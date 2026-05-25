import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
  createLeagueForUser,
  getBracketMatchesForLeague,
  getDashboardLeagues,
  getLeagueByIdForUser,
  getLeagueByInviteCode,
  getStoredMatches,
  joinLeagueForUser,
  recalculateLeagueScoresForLeague,
  startDraftForLeague,
  submitDraftPickForLeague,
  submitKnockoutPickForLeague,
  syncTournamentMatchesForLeague,
  syncTournamentResultsForLeague,
  type CurrentAppUser,
} from "@/lib/db";
import { seedTeams } from "@/lib/fantasy-data";
import { getCurrentDraftState } from "@/lib/fantasy-engine";
import { getTournamentDataSnapshot } from "@/lib/world-cup-data";

type McpUserContext = {
  appUser: CurrentAppUser;
  clerkUserId: string;
  scopes: string[];
  tokenType: string | null;
};

function jsonToolResult(summary: string, data: Record<string, unknown>) {
  return {
    content: [
      {
        type: "text" as const,
        text: `${summary}\n\n${JSON.stringify(data, null, 2)}`,
      },
    ],
    structuredContent: data,
  };
}

function buildStandings(league: NonNullable<Awaited<ReturnType<typeof getLeagueByIdForUser>>>) {
  return league.members
    .map((member) => {
      const groupScore = league.scores.group.find((score) => score.userId === member.userId);
      const knockoutScore = league.scores.knockout.find((score) => score.userId === member.userId);

      return {
        userId: member.userId,
        displayName: member.displayName,
        groupPoints: groupScore?.totalPoints ?? 0,
        knockoutPoints: knockoutScore?.totalPoints ?? 0,
        totalPoints: (groupScore?.totalPoints ?? 0) + (knockoutScore?.totalPoints ?? 0),
      };
    })
    .sort((left, right) => right.totalPoints - left.totalPoints);
}

export function createWorldCupMcpServer(context: McpUserContext) {
  const server = new McpServer({
    name: "wc-fantasy-league",
    version: "1.0.0",
  });

  server.registerTool(
    "whoami",
    {
      description: "Show the authenticated World Cup Fantasy League user.",
    },
    async () =>
      jsonToolResult("Authenticated user", {
        userId: context.appUser.id,
        clerkUserId: context.clerkUserId,
        displayName: context.appUser.displayName,
        email: context.appUser.email,
        tokenType: context.tokenType,
        scopes: context.scopes,
      }),
  );

  server.registerTool(
    "list_my_leagues",
    {
      description: "List the leagues this user belongs to.",
    },
    async () => {
      const leagues = await getDashboardLeagues(context.clerkUserId);
      return jsonToolResult("League memberships", {
        count: leagues.length,
        leagues,
      });
    },
  );

  server.registerTool(
    "create_league",
    {
      description: "Create a new fantasy league for this user.",
      inputSchema: {
        name: z.string().min(2),
        maxMembers: z.number().int().min(2).max(32).default(8),
      },
    },
    async ({ name, maxMembers }) => {
      const leagueId = await createLeagueForUser(context.appUser, { name, maxMembers });
      const league = await getLeagueByIdForUser(context.clerkUserId, leagueId);
      return jsonToolResult("League created", {
        leagueId,
        leagueName: league?.name ?? name,
        inviteCode: league?.inviteCode,
        invitePath: league?.inviteLink,
      });
    },
  );

  server.registerTool(
    "join_league",
    {
      description: "Join a league with an invite code.",
      inputSchema: {
        inviteCode: z.string().min(4),
      },
    },
    async ({ inviteCode }) => {
      const leagueInfo = await getLeagueByInviteCode(inviteCode);
      const leagueId = await joinLeagueForUser(context.appUser, inviteCode);
      return jsonToolResult("League joined", {
        leagueId,
        leagueName: leagueInfo?.name ?? null,
        inviteCode: inviteCode.toUpperCase(),
      });
    },
  );

  server.registerTool(
    "get_league_overview",
    {
      description: "Get the main shared view for a league, including members and score leaders.",
      inputSchema: {
        leagueId: z.string().uuid(),
      },
    },
    async ({ leagueId }) => {
      const league = await getLeagueByIdForUser(context.clerkUserId, leagueId);
      if (!league) {
        throw new Error("League not found.");
      }

      const standings = buildStandings(league);
      return jsonToolResult("League overview", {
        leagueId: league.id,
        name: league.name,
        status: league.status,
        commissionerUserId: league.commissionerUserId,
        commissionerName: league.commissionerName,
        inviteCode: league.inviteCode,
        members: league.members.map((member) => ({
          userId: member.userId,
          displayName: member.displayName,
          draftPosition: member.draftPosition,
          roster: member.roster,
        })),
        standings,
        groupChampion: league.scores.group[0]?.userId ?? null,
        knockoutChampion: league.scores.knockout[0]?.userId ?? null,
      });
    },
  );

  server.registerTool(
    "get_standings",
    {
      description: "Get standings for a league with separate group, bracket, and total points.",
      inputSchema: {
        leagueId: z.string().uuid(),
      },
    },
    async ({ leagueId }) => {
      const league = await getLeagueByIdForUser(context.clerkUserId, leagueId);
      if (!league) {
        throw new Error("League not found.");
      }

      return jsonToolResult("League standings", {
        leagueId: league.id,
        name: league.name,
        standings: buildStandings(league),
      });
    },
  );

  server.registerTool(
    "get_matches",
    {
      description: "Get synced fixtures and scores for the tournament.",
      inputSchema: {
        onlyKnockout: z.boolean().default(false),
      },
    },
    async ({ onlyKnockout }) => {
      const storedMatches = await getStoredMatches();
      const fallbackTournament = await getTournamentDataSnapshot();
      const matches =
        storedMatches.length > 0
          ? storedMatches.filter((match) => (onlyKnockout ? match.stage !== "GROUP" : true))
          : fallbackTournament.matches.filter((match) =>
              onlyKnockout ? match.stage.toUpperCase() !== "GROUP" : true,
            );

      return jsonToolResult("Tournament fixtures", {
        source: storedMatches.length > 0 ? "supabase" : fallbackTournament.provider.label,
        count: matches.length,
        matches,
      });
    },
  );

  server.registerTool(
    "get_bracket",
    {
      description: "Get knockout fixtures and this user's current bracket picks for a league.",
      inputSchema: {
        leagueId: z.string().uuid(),
      },
    },
    async ({ leagueId }) => {
      const bracketMatches = await getBracketMatchesForLeague(context.clerkUserId, leagueId);
      return jsonToolResult("Knockout bracket", {
        leagueId,
        count: bracketMatches.length,
        matches: bracketMatches,
      });
    },
  );

  server.registerTool(
    "get_draft_status",
    {
      description: "Get draft order, current manager, and available teams for a league draft.",
      inputSchema: {
        leagueId: z.string().uuid(),
      },
    },
    async ({ leagueId }) => {
      const league = await getLeagueByIdForUser(context.clerkUserId, leagueId);
      if (!league) {
        throw new Error("League not found.");
      }

      const draft = getCurrentDraftState(league);
      const draftedTeamIds = new Set(
        league.picks.filter((pick) => pick.pickType === "team").map((pick) => pick.targetId),
      );
      const availableTeams = seedTeams.filter((team) => !draftedTeamIds.has(team.id));

      return jsonToolResult("Draft status", {
        leagueId,
        leagueStatus: league.status,
        round: draft.round,
        pickNumber: draft.pickNumber,
        currentManager: draft.currentManager,
        draftOrder: draft.order.map((member) => ({
          userId: member.userId,
          displayName: member.displayName,
          draftPosition: member.draftPosition,
        })),
        availableTeams,
      });
    },
  );

  server.registerTool(
    "draft_team",
    {
      description: "Submit a team draft pick for the current user when it is their turn.",
      inputSchema: {
        leagueId: z.string().uuid(),
        teamId: z.string(),
      },
    },
    async ({ leagueId, teamId }) => {
      await submitDraftPickForLeague(context.appUser, leagueId, {
        pickType: "team",
        targetId: teamId,
      });
      return jsonToolResult("Draft pick submitted", {
        leagueId,
        teamId,
      });
    },
  );

  server.registerTool(
    "submit_bracket_pick",
    {
      description: "Pick a winner for a knockout match.",
      inputSchema: {
        leagueId: z.string().uuid(),
        matchId: z.string().uuid(),
        pickTeamId: z.string(),
      },
    },
    async ({ leagueId, matchId, pickTeamId }) => {
      await submitKnockoutPickForLeague(context.appUser, leagueId, {
        matchId,
        pickTeamId,
      });
      return jsonToolResult("Bracket pick submitted", {
        leagueId,
        matchId,
        pickTeamId,
      });
    },
  );

  server.registerTool(
    "start_draft",
    {
      description: "Commissioner-only: start or reshuffle the draft order for a league.",
      inputSchema: {
        leagueId: z.string().uuid(),
      },
    },
    async ({ leagueId }) => {
      await startDraftForLeague(context.appUser, leagueId);
      return jsonToolResult("Draft started", { leagueId });
    },
  );

  server.registerTool(
    "sync_fixtures",
    {
      description: "Commissioner-only: sync fixtures into the app from the tournament provider.",
      inputSchema: {
        leagueId: z.string().uuid(),
      },
    },
    async ({ leagueId }) => {
      const result = await syncTournamentMatchesForLeague(context.appUser, leagueId);
      return jsonToolResult("Fixtures synced", {
        leagueId,
        ...result,
      });
    },
  );

  server.registerTool(
    "sync_results",
    {
      description: "Commissioner-only: sync match results and update league scoring.",
      inputSchema: {
        leagueId: z.string().uuid(),
      },
    },
    async ({ leagueId }) => {
      const result = await syncTournamentResultsForLeague(context.appUser, leagueId);
      return jsonToolResult("Results synced", {
        leagueId,
        ...result,
      });
    },
  );

  server.registerTool(
    "recalculate_table",
    {
      description: "Commissioner-only: recalculate group and bracket points from stored data.",
      inputSchema: {
        leagueId: z.string().uuid(),
      },
    },
    async ({ leagueId }) => {
      const result = await recalculateLeagueScoresForLeague(context.appUser, leagueId);
      return jsonToolResult("League table recalculated", {
        leagueId,
        ...result,
      });
    },
  );

  return server;
}
