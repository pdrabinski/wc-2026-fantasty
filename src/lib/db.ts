import { currentUser } from "@clerk/nextjs/server";

import {
  scoringDefaults,
  seedPlayers,
  seedTeams,
  type DraftPick,
  type FantasyLeague,
  type LeagueMember,
  type LeagueScore,
  type LeagueStatus,
  type KnockoutStage,
  type RosterEntry,
  type ScorePhase,
} from "@/lib/fantasy-data";
import { calculateTeamFantasyPoints } from "@/lib/fantasy-engine";
import { hasSupabaseEnv } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getTournamentDataSnapshot, type TournamentMatch, type TournamentTeam } from "@/lib/world-cup-data";

type AppUserRow = {
  id: string;
  clerk_user_id: string;
  display_name: string;
  email: string;
  created_at: string;
};

type LeagueRow = {
  id: string;
  name: string;
  commissioner_user_id: string;
  invite_code: string;
  status: LeagueStatus;
  max_members: number;
  created_at: string;
};

type LeagueMemberRow = {
  id: string;
  league_id: string;
  user_id: string;
  draft_position: number | null;
  created_at: string;
};

type ScoreRow = {
  league_id: string;
  user_id: string;
  phase: ScorePhase;
  team_points: number;
  player_points: number;
  total_points: number;
  updated_at: string;
};

type RosterRow = {
  id: string;
  league_id: string;
  user_id: string;
  team_id: string | null;
  player_id: string | null;
  roster_type: "team" | "player";
};

type PickRow = {
  id: string;
  league_id: string;
  round: number;
  pick_number: number;
  user_id: string;
  pick_type: "team" | "player";
  team_id: string | null;
  player_id: string | null;
  created_at: string;
};

type TeamRow = {
  id: string;
  name: string;
  country_code: string;
  tier: string;
  group_name: string;
  flag_url: string | null;
};

type PlayerRow = {
  id: string;
  name: string;
  team_id: string | null;
  position: string;
  active: boolean;
};

type MatchRow = {
  id: string;
  home_team_id: string;
  away_team_id: string;
  stage: "group" | "r32" | "r16" | "qf" | "sf" | "final";
  kickoff_at: string;
  home_score: number | null;
  away_score: number | null;
  status: "scheduled" | "completed";
};

type KnockoutPickRow = {
  id: string;
  league_id: string;
  user_id: string;
  match_id: string;
  pick_team_id: string;
  created_at: string;
  updated_at: string;
};

export type DashboardLeague = {
  id: string;
  name: string;
  status: LeagueStatus;
  inviteCode: string;
  inviteLink: string;
  maxMembers: number;
  memberCount: number;
  createdAt: string;
};

export type CurrentAppUser = {
  id: string;
  clerkUserId: string;
  displayName: string;
  email: string;
};

export type PersistenceState = {
  available: boolean;
  reason?: string;
};

export type StoredMatch = {
  id: string;
  kickoffAt: string;
  stage: string;
  status: "scheduled" | "completed";
  homeTeam: string;
  awayTeam: string;
  homeCode?: string;
  awayCode?: string;
  homeScore: number | null;
  awayScore: number | null;
};

export type BracketMatch = {
  id: string;
  stage: KnockoutStage;
  kickoffAt: string;
  status: "scheduled" | "completed";
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: string;
  awayTeam: string;
  homeCode?: string;
  awayCode?: string;
  homeScore: number | null;
  awayScore: number | null;
  winningTeamId?: string;
  currentUserPickTeamId?: string;
  currentUserPickLabel?: string;
  homePickedCount: number;
  awayPickedCount: number;
};

function createInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function getDisplayName(user: Awaited<ReturnType<typeof currentUser>>) {
  return (
    user?.fullName ||
    user?.firstName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Manager"
  );
}

function getEmail(user: Awaited<ReturnType<typeof currentUser>>) {
  return user?.primaryEmailAddress?.emailAddress || "";
}

export async function syncCurrentUser() {
  if (!hasSupabaseEnv) {
    return null;
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return null;
  }

  const supabase = getSupabaseServerClient();
  const payload = {
    clerk_user_id: clerkUser.id,
    display_name: getDisplayName(clerkUser),
    email: getEmail(clerkUser),
  };

  const { data, error } = await supabase
    .from("users")
    .upsert([payload], { onConflict: "clerk_user_id" })
    .select("*")
    .single<AppUserRow>();

  if (error || !data) {
    throw new Error(error?.message || "Unable to sync current user.");
  }

  return {
    id: data.id,
    clerkUserId: data.clerk_user_id,
    displayName: data.display_name,
    email: data.email,
  } satisfies CurrentAppUser;
}

async function ensureSeedData() {
  const supabase = getSupabaseServerClient();

  const teamPayload = seedTeams.map((team) => ({
    id: team.id,
    name: team.name,
    country_code: team.countryCode,
    tier: team.tier,
    group_name: team.groupName,
    flag_url: null,
  }));

  const playerPayload = seedPlayers.map((player) => ({
    id: player.id,
    name: player.name,
    team_id: player.teamId,
    position: player.position,
    active: true,
  }));

  await Promise.all([
    supabase.from("teams").upsert(teamPayload, { onConflict: "id" }),
    supabase.from("players").upsert(playerPayload, { onConflict: "id" }),
  ]);
}

export async function getPersistenceState(): Promise<PersistenceState> {
  if (!hasSupabaseEnv) {
    return { available: false, reason: "Supabase environment variables are missing." };
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("leagues").select("id").limit(1);
    if (error) {
      return { available: false, reason: error.message };
    }

    return { available: true };
  } catch (error) {
    return {
      available: false,
      reason: error instanceof Error ? error.message : "Unknown Supabase error.",
    };
  }
}

export async function getDashboardLeagues(clerkUserId: string) {
  if (!hasSupabaseEnv) {
    return [] as DashboardLeague[];
  }

  const supabase = getSupabaseServerClient();
  const { data: appUser, error: appUserError } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle<AppUserRow>();

  if (appUserError || !appUser) {
    return [] as DashboardLeague[];
  }

  const { data: membershipRows, error: membershipError } = await supabase
    .from("league_members")
    .select("league_id")
    .eq("user_id", appUser.id);

  if (membershipError || !membershipRows || membershipRows.length === 0) {
    return [] as DashboardLeague[];
  }

  const leagueIds = membershipRows.map((row) => row.league_id);
  const [{ data: leagues, error: leaguesError }, { data: allMembers, error: countError }] =
    await Promise.all([
      supabase
        .from("leagues")
        .select("*")
        .in("id", leagueIds)
        .order("created_at", { ascending: false }),
      supabase.from("league_members").select("league_id").in("league_id", leagueIds),
    ]);

  if (leaguesError || countError || !leagues) {
    throw new Error(leaguesError?.message || countError?.message || "Unable to load leagues.");
  }

  return (leagues as LeagueRow[]).map((league) => ({
    id: league.id,
    name: league.name,
    status: league.status,
    inviteCode: league.invite_code,
    inviteLink: `/join/${league.invite_code}`,
    maxMembers: league.max_members,
    memberCount: allMembers?.filter((member) => member.league_id === league.id).length ?? 0,
    createdAt: league.created_at,
  }));
}

function slugifyName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeStage(stage: string | undefined): MatchRow["stage"] {
  const value = (stage || "GROUP").toUpperCase();
  if (value.includes("ROUND_OF_32") || value.includes("LAST_32") || value === "R32") {
    return "r32";
  }
  if (value.includes("ROUND_OF_16") || value.includes("LAST_16") || value === "R16") {
    return "r16";
  }
  if (value.includes("QUARTER")) {
    return "qf";
  }
  if (value.includes("SEMI")) {
    return "sf";
  }
  if (value.includes("FINAL")) {
    return "final";
  }
  return "group";
}

function normalizeMatchStatus(match: TournamentMatch): MatchRow["status"] {
  return match.status === "FINISHED" ? "completed" : "scheduled";
}

function getWinningTeamId(match: MatchRow) {
  if (match.home_score === null || match.away_score === null) {
    return undefined;
  }

  if (match.home_score > match.away_score) {
    return match.home_team_id;
  }

  if (match.away_score > match.home_score) {
    return match.away_team_id;
  }

  return undefined;
}

function getBracketStagePoints(stage: KnockoutStage) {
  return scoringDefaults.bracket.knockout[stage];
}

function findSeedTeamByReference(team: TournamentTeam) {
  return seedTeams.find(
    (seed) =>
      seed.countryCode.toUpperCase() === team.code.toUpperCase() ||
      seed.name.toLowerCase() === team.name.toLowerCase(),
  );
}

async function ensureTournamentTeamsPersisted(teams: TournamentTeam[], matches: TournamentMatch[]) {
  const supabase = getSupabaseServerClient();
  const { data: existingRows, error } = await supabase.from("teams").select("*");

  if (error || !existingRows) {
    throw new Error(error?.message || "Unable to load teams for sync.");
  }

  const existing = existingRows as TeamRow[];
  const byCode = new Map(existing.map((team) => [team.country_code.toUpperCase(), team]));
  const byName = new Map(existing.map((team) => [team.name.toLowerCase(), team]));

  const merged = new Map<string, TournamentTeam>();
  teams.forEach((team) => merged.set(team.id, team));
  matches.forEach((match) => {
    const homeId = `derived-${match.homeCode || slugifyName(match.homeTeam)}`;
    const awayId = `derived-${match.awayCode || slugifyName(match.awayTeam)}`;
    merged.set(homeId, {
      id: homeId,
      name: match.homeTeam,
      code: match.homeCode || match.homeTeam.slice(0, 3).toUpperCase(),
      source: match.source,
    });
    merged.set(awayId, {
      id: awayId,
      name: match.awayTeam,
      code: match.awayCode || match.awayTeam.slice(0, 3).toUpperCase(),
      source: match.source,
    });
  });

  const teamIdMap = new Map<string, string>();
  const payload = Array.from(merged.values()).map((team) => {
    const existingByCode = byCode.get(team.code.toUpperCase());
    const existingByName = byName.get(team.name.toLowerCase());
    const matchedSeed = findSeedTeamByReference(team);
    const resolvedId = matchedSeed?.id || existingByCode?.id || existingByName?.id || `fd-${slugifyName(team.name)}`;
    teamIdMap.set(team.id, resolvedId);
    return {
      id: resolvedId,
      name: team.name,
      country_code: team.code,
      tier: matchedSeed?.tier || existingByCode?.tier || existingByName?.tier || "Pot 3",
      group_name: matchedSeed?.groupName || existingByCode?.group_name || existingByName?.group_name || "TBD",
      flag_url: team.crestUrl || existingByCode?.flag_url || existingByName?.flag_url || null,
    };
  });

  const { error: upsertError } = await supabase.from("teams").upsert(payload, { onConflict: "id" });
  if (upsertError) {
    throw new Error(upsertError.message);
  }

  return teamIdMap;
}

export async function getStoredMatches() {
  if (!hasSupabaseEnv) {
    return [] as StoredMatch[];
  }

  const supabase = getSupabaseServerClient();
  const [{ data: matchRows, error: matchError }, { data: teamRows, error: teamError }] =
    await Promise.all([
      supabase.from("matches").select("*").order("kickoff_at", { ascending: true }),
      supabase.from("teams").select("*"),
    ]);

  if (matchError || teamError || !matchRows || !teamRows) {
    throw new Error(matchError?.message || teamError?.message || "Unable to load stored matches.");
  }

  const teams = new Map((teamRows as TeamRow[]).map((team) => [team.id, team]));

  return (matchRows as MatchRow[]).map((match) => ({
    id: match.id,
    kickoffAt: match.kickoff_at,
    stage: match.stage.toUpperCase(),
    status: match.status,
    homeTeam: teams.get(match.home_team_id)?.name || match.home_team_id,
    awayTeam: teams.get(match.away_team_id)?.name || match.away_team_id,
    homeCode: teams.get(match.home_team_id)?.country_code,
    awayCode: teams.get(match.away_team_id)?.country_code,
    homeScore: match.home_score,
    awayScore: match.away_score,
  }));
}

export async function getBracketMatchesForLeague(clerkUserId: string, leagueId: string) {
  if (!hasSupabaseEnv) {
    return [] as BracketMatch[];
  }

  const supabase = getSupabaseServerClient();
  const { data: appUser, error: appUserError } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle<AppUserRow>();

  if (appUserError || !appUser) {
    return [] as BracketMatch[];
  }

  const { data: membership, error: membershipError } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", leagueId)
    .eq("user_id", appUser.id)
    .maybeSingle();

  if (membershipError || !membership) {
    return [] as BracketMatch[];
  }

  const [
    { data: matchRows, error: matchError },
    { data: teamRows, error: teamError },
    { data: pickRows, error: pickError },
  ] = await Promise.all([
    supabase
      .from("matches")
      .select("*")
      .neq("stage", "group")
      .order("kickoff_at", { ascending: true }),
    supabase.from("teams").select("*"),
    supabase.from("knockout_picks").select("*").eq("league_id", leagueId),
  ]);

  if (matchError || teamError || pickError || !matchRows || !teamRows || !pickRows) {
    throw new Error(
      matchError?.message || teamError?.message || pickError?.message || "Unable to load bracket.",
    );
  }

  const teams = new Map((teamRows as TeamRow[]).map((team) => [team.id, team]));
  const picks = pickRows as KnockoutPickRow[];

  return (matchRows as MatchRow[]).map((match) => {
    const homeTeam = teams.get(match.home_team_id);
    const awayTeam = teams.get(match.away_team_id);
    const currentUserPick = picks.find(
      (pick) => pick.match_id === match.id && pick.user_id === appUser.id,
    );
    const homePickedCount = picks.filter(
      (pick) => pick.match_id === match.id && pick.pick_team_id === match.home_team_id,
    ).length;
    const awayPickedCount = picks.filter(
      (pick) => pick.match_id === match.id && pick.pick_team_id === match.away_team_id,
    ).length;
    const winningTeamId = getWinningTeamId(match);

    return {
      id: match.id,
      stage: match.stage as KnockoutStage,
      kickoffAt: match.kickoff_at,
      status: match.status,
      homeTeamId: match.home_team_id,
      awayTeamId: match.away_team_id,
      homeTeam: homeTeam?.name || match.home_team_id,
      awayTeam: awayTeam?.name || match.away_team_id,
      homeCode: homeTeam?.country_code,
      awayCode: awayTeam?.country_code,
      homeScore: match.home_score,
      awayScore: match.away_score,
      winningTeamId,
      currentUserPickTeamId: currentUserPick?.pick_team_id,
      currentUserPickLabel: currentUserPick
        ? teams.get(currentUserPick.pick_team_id)?.name || currentUserPick.pick_team_id
        : undefined,
      homePickedCount,
      awayPickedCount,
    } satisfies BracketMatch;
  });
}

export async function syncTournamentMatchesForLeague(user: CurrentAppUser, leagueId: string) {
  const supabase = getSupabaseServerClient();
  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .select("*")
    .eq("id", leagueId)
    .maybeSingle<LeagueRow>();

  if (leagueError || !league) {
    throw new Error("League not found.");
  }

  if (league.commissioner_user_id !== user.id) {
    throw new Error("Only the commissioner can sync tournament fixtures.");
  }

  const snapshot = await getTournamentDataSnapshot();
  const teamIdMap = await ensureTournamentTeamsPersisted(snapshot.teams, snapshot.matches);

  const { data: existingRows, error: existingError } = await supabase.from("matches").select("*");
  if (existingError || !existingRows) {
    throw new Error(existingError?.message || "Unable to load existing matches.");
  }

  const existingByKey = new Map(
    (existingRows as MatchRow[]).map((row) => [
      `${row.kickoff_at}|${row.home_team_id}|${row.away_team_id}`,
      row,
    ]),
  );

  const inserts: Array<{
    home_team_id: string;
    away_team_id: string;
    stage: MatchRow["stage"];
    kickoff_at: string;
    home_score: number | null;
    away_score: number | null;
    status: MatchRow["status"];
  }> = [];

  const updates: Array<{
    id: string;
    stage: MatchRow["stage"];
    home_score: number | null;
    away_score: number | null;
    status: MatchRow["status"];
  }> = [];

  snapshot.matches.forEach((match) => {
    const derivedHomeKey = `derived-${match.homeCode || slugifyName(match.homeTeam)}`;
    const derivedAwayKey = `derived-${match.awayCode || slugifyName(match.awayTeam)}`;
    const homeTeamId = teamIdMap.get(derivedHomeKey) || teamIdMap.get(`fd-${slugifyName(match.homeTeam)}`) || derivedHomeKey;
    const awayTeamId = teamIdMap.get(derivedAwayKey) || teamIdMap.get(`fd-${slugifyName(match.awayTeam)}`) || derivedAwayKey;
    const key = `${match.kickoffAt}|${homeTeamId}|${awayTeamId}`;
    const existing = existingByKey.get(key);
    const stage = normalizeStage(match.stage);
    const status = normalizeMatchStatus(match);

    if (existing) {
      updates.push({
        id: existing.id,
        stage,
        home_score: match.homeScore ?? null,
        away_score: match.awayScore ?? null,
        status,
      });
    } else {
      inserts.push({
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        stage,
        kickoff_at: match.kickoffAt,
        home_score: match.homeScore ?? null,
        away_score: match.awayScore ?? null,
        status,
      });
    }
  });

  const insertPromise = inserts.length > 0 ? supabase.from("matches").insert(inserts) : Promise.resolve({ error: null });
  const updatePromises = updates.map((update) =>
    supabase
      .from("matches")
      .update({
        stage: update.stage,
        home_score: update.home_score,
        away_score: update.away_score,
        status: update.status,
      })
      .eq("id", update.id),
  );

  const [insertResult, ...updateResults] = await Promise.all([insertPromise, ...updatePromises]);
  const updateError = updateResults.find((result) => result.error)?.error;

  if (insertResult.error || updateError) {
    throw new Error(insertResult.error?.message || updateError?.message || "Unable to sync matches.");
  }

  return {
    inserted: inserts.length,
    updated: updates.length,
    provider: snapshot.provider.label,
  };
}

export async function recalculateLeagueScoresForLeague(user: CurrentAppUser, leagueId: string) {
  const supabase = getSupabaseServerClient();
  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .select("*")
    .eq("id", leagueId)
    .maybeSingle<LeagueRow>();

  if (leagueError || !league) {
    throw new Error("League not found.");
  }

  if (league.commissioner_user_id !== user.id) {
    throw new Error("Only the commissioner can recalculate scores.");
  }

  const [
    { data: memberRows, error: memberError },
    { data: rosterRows, error: rosterError },
    { data: matchRows, error: matchError },
    { data: knockoutPickRows, error: knockoutPickError },
  ] = await Promise.all([
    supabase.from("league_members").select("*").eq("league_id", leagueId),
    supabase.from("rosters").select("*").eq("league_id", leagueId).eq("roster_type", "team"),
    supabase.from("matches").select("*").eq("status", "completed"),
    supabase.from("knockout_picks").select("*").eq("league_id", leagueId),
  ]);

  if (
    memberError ||
    rosterError ||
    matchError ||
    knockoutPickError ||
    !memberRows ||
    !rosterRows ||
    !matchRows ||
    !knockoutPickRows
  ) {
    throw new Error(
      memberError?.message ||
        rosterError?.message ||
        matchError?.message ||
        knockoutPickError?.message ||
        "Unable to load league scoring data.",
    );
  }

  const teamRosterRows = rosterRows as RosterRow[];
  const completedMatches = matchRows as MatchRow[];
  const knockoutPicks = knockoutPickRows as KnockoutPickRow[];

  const scoreMap = new Map<
    string,
    {
      group: number;
      knockout: number;
    }
  >();

  (memberRows as LeagueMemberRow[]).forEach((member) => {
    scoreMap.set(member.user_id, { group: 0, knockout: 0 });
  });

  for (const member of memberRows as LeagueMemberRow[]) {
    const rosteredTeamIds = new Set(
      teamRosterRows
        .filter((entry) => entry.user_id === member.user_id && entry.team_id)
        .map((entry) => entry.team_id as string),
    );

    const groupMatches = completedMatches.filter((match) => match.stage === "group");
    for (const match of groupMatches) {
      const isHomeTeam = rosteredTeamIds.has(match.home_team_id);
      const isAwayTeam = rosteredTeamIds.has(match.away_team_id);

      if (!isHomeTeam && !isAwayTeam) {
        continue;
      }

      const teamIsHome = isHomeTeam;
      const teamScore = teamIsHome ? match.home_score : match.away_score;
      const opponentScore = teamIsHome ? match.away_score : match.home_score;

      if (teamScore === null || opponentScore === null) {
        continue;
      }

      const result =
        teamScore > opponentScore ? "win" : teamScore === opponentScore ? "draw" : "loss";
      const basePoints = calculateTeamFantasyPoints({
        result,
        cleanSheet: opponentScore === 0,
        goalDifferential: Math.max(teamScore - opponentScore, 0),
      });

      const existing = scoreMap.get(member.user_id);
      if (!existing) {
        continue;
      }

      existing.group += basePoints;
    }

    const memberKnockoutPicks = knockoutPicks.filter((pick) => pick.user_id === member.user_id);
    for (const pick of memberKnockoutPicks) {
      const match = completedMatches.find((entry) => entry.id === pick.match_id);
      if (!match || match.stage === "group") {
        continue;
      }

      const winnerTeamId = getWinningTeamId(match);
      if (!winnerTeamId || winnerTeamId !== pick.pick_team_id) {
        continue;
      }

      const existing = scoreMap.get(member.user_id);
      if (!existing) {
        continue;
      }

      existing.knockout += getBracketStagePoints(match.stage);
    }
  }

  const payload = Array.from(scoreMap.entries()).flatMap(([userId, points]) => [
    {
      league_id: leagueId,
      user_id: userId,
      phase: "group" as ScorePhase,
      team_points: points.group,
      player_points: 0,
      total_points: points.group,
    },
    {
      league_id: leagueId,
      user_id: userId,
      phase: "knockout" as ScorePhase,
      team_points: points.knockout,
      player_points: 0,
      total_points: points.knockout,
    },
  ]);

  const { error: upsertError } = await supabase.from("league_scores").upsert(payload, {
    onConflict: "league_id,user_id,phase",
  });

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  const nextStatus: LeagueStatus =
    completedMatches.some((match) => match.stage !== "group")
      ? "knockout_stage"
      : completedMatches.some((match) => match.stage === "group")
        ? "group_stage"
        : league.status;

  if (nextStatus !== league.status) {
    const { error: updateLeagueError } = await supabase
      .from("leagues")
      .update({ status: nextStatus })
      .eq("id", leagueId);

    if (updateLeagueError) {
      throw new Error(updateLeagueError.message);
    }
  }

  return {
    updatedManagers: scoreMap.size,
    completedMatches: completedMatches.length,
  };
}

export async function syncTournamentResultsForLeague(user: CurrentAppUser, leagueId: string) {
  await syncTournamentMatchesForLeague(user, leagueId);
  return recalculateLeagueScoresForLeague(user, leagueId);
}

export async function submitKnockoutPickForLeague(
  user: CurrentAppUser,
  leagueId: string,
  input: { matchId: string; pickTeamId: string },
) {
  const supabase = getSupabaseServerClient();

  const [
    { data: membership, error: membershipError },
    { data: match, error: matchError },
  ] = await Promise.all([
    supabase
      .from("league_members")
      .select("id")
      .eq("league_id", leagueId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("matches").select("*").eq("id", input.matchId).maybeSingle<MatchRow>(),
  ]);

  if (membershipError || !membership) {
    throw new Error("You are not a member of this league.");
  }

  if (matchError || !match) {
    throw new Error("Knockout match not found.");
  }

  if (match.stage === "group") {
    throw new Error("Bracket picks open after the group stage.");
  }

  if (match.status === "completed") {
    throw new Error("This match is already final.");
  }

  if (![match.home_team_id, match.away_team_id].includes(input.pickTeamId)) {
    throw new Error("Pick must match one of the teams in this fixture.");
  }

  const { error: upsertError } = await supabase.from("knockout_picks").upsert(
    [
      {
        league_id: leagueId,
        user_id: user.id,
        match_id: input.matchId,
        pick_team_id: input.pickTeamId,
        updated_at: new Date().toISOString(),
      },
    ],
    { onConflict: "league_id,user_id,match_id" },
  );

  if (upsertError) {
    throw new Error(upsertError.message);
  }
}

export async function createLeagueForUser(user: CurrentAppUser, input: { name: string; maxMembers: number }) {
  await ensureSeedData();

  const supabase = getSupabaseServerClient();

  let inviteCode = createInviteCode();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: existing } = await supabase
      .from("leagues")
      .select("id")
      .eq("invite_code", inviteCode)
      .maybeSingle();
    if (!existing) {
      break;
    }
    inviteCode = createInviteCode();
  }

  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .insert([{
      name: input.name,
      commissioner_user_id: user.id,
      invite_code: inviteCode,
      max_members: input.maxMembers,
      status: "pre_draft",
    }])
    .select("*")
    .single<LeagueRow>();

  if (leagueError || !league) {
    throw new Error(leagueError?.message || "Unable to create league.");
  }

  const payloadScores = ["group", "knockout"].map((phase) => ({
    league_id: league.id,
    user_id: user.id,
    phase: phase as ScorePhase,
    team_points: 0,
    player_points: 0,
    total_points: 0,
  }));

  const [{ error: memberError }, { error: scoreError }] = await Promise.all([
    supabase.from("league_members").insert([{
      league_id: league.id,
      user_id: user.id,
      draft_position: 1,
    }]),
    supabase.from("league_scores").upsert(payloadScores, {
      onConflict: "league_id,user_id,phase",
    }),
  ]);

  if (memberError || scoreError) {
    throw new Error(memberError?.message || scoreError?.message || "Unable to finish league setup.");
  }

  return league.id;
}

export async function joinLeagueForUser(user: CurrentAppUser, inviteCode: string) {
  const supabase = getSupabaseServerClient();
  const normalizedCode = inviteCode.trim().toUpperCase();

  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .select("*")
    .eq("invite_code", normalizedCode)
    .maybeSingle<LeagueRow>();

  if (leagueError || !league) {
    throw new Error("League invite code was not found.");
  }

  const [{ data: existingMembership }, { count, error: countError }] = await Promise.all([
    supabase
      .from("league_members")
      .select("*")
      .eq("league_id", league.id)
      .eq("user_id", user.id)
      .maybeSingle<LeagueMemberRow>(),
    supabase
      .from("league_members")
      .select("id", { count: "exact", head: true })
      .eq("league_id", league.id),
  ]);

  if (existingMembership) {
    return league.id;
  }

  if (countError) {
    throw new Error(countError.message);
  }

  if ((count ?? 0) >= league.max_members) {
    throw new Error("This league is already full.");
  }

  const nextDraftPosition = (count ?? 0) + 1;
  const scorePayload = ["group", "knockout"].map((phase) => ({
    league_id: league.id,
    user_id: user.id,
    phase: phase as ScorePhase,
    team_points: 0,
    player_points: 0,
    total_points: 0,
  }));

  const [{ error: memberError }, { error: scoreError }] = await Promise.all([
    supabase.from("league_members").insert([{
      league_id: league.id,
      user_id: user.id,
      draft_position: league.status === "pre_draft" ? nextDraftPosition : null,
    }]),
    supabase.from("league_scores").upsert(scorePayload, {
      onConflict: "league_id,user_id,phase",
    }),
  ]);

  if (memberError || scoreError) {
    throw new Error(memberError?.message || scoreError?.message || "Unable to join league.");
  }

  return league.id;
}

export async function getLeagueByInviteCode(inviteCode: string) {
  if (!hasSupabaseEnv) {
    return null;
  }

  const supabase = getSupabaseServerClient();
  const normalizedCode = inviteCode.trim().toUpperCase();
  const { data, error } = await supabase
    .from("leagues")
    .select("id,name,invite_code,status,max_members,created_at")
    .eq("invite_code", normalizedCode)
    .maybeSingle<LeagueRow>();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    inviteCode: data.invite_code,
    status: data.status,
    maxMembers: data.max_members,
    createdAt: data.created_at,
  };
}

function mapRosterEntries(
  rosterRows: RosterRow[],
  teams: Map<string, TeamRow>,
  players: Map<string, PlayerRow>,
): RosterEntry[] {
  return rosterRows.map((row) => {
    if (row.roster_type === "team" && row.team_id) {
      return {
        id: row.id,
        label: teams.get(row.team_id)?.name || row.team_id,
        rosterType: "team",
        sourceId: row.team_id,
      };
    }

    const playerId = row.player_id || "";
    return {
      id: row.id,
      label: players.get(playerId)?.name || playerId,
      rosterType: "player",
      sourceId: playerId,
    };
  });
}

function mapScoreRows(scoreRows: ScoreRow[], phase: ScorePhase): LeagueScore[] {
  return scoreRows
    .filter((row) => row.phase === phase)
    .map((row) => ({
      userId: row.user_id,
      teamPoints: row.team_points,
      playerPoints: row.player_points,
      totalPoints: row.total_points,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints);
}

function mapPickRows(
  pickRows: PickRow[],
  users: Map<string, AppUserRow>,
  teams: Map<string, TeamRow>,
  players: Map<string, PlayerRow>,
): DraftPick[] {
  return pickRows.map((row) => {
    const managerName = users.get(row.user_id)?.display_name || "Manager";
    const targetId = row.team_id || row.player_id || "";
    const targetLabel =
      (row.team_id ? teams.get(row.team_id)?.name : players.get(row.player_id || "")?.name) ||
      targetId;

    return {
      id: row.id,
      round: row.round,
      pickNumber: row.pick_number,
      userId: row.user_id,
      pickType: row.pick_type,
      targetId,
      label: `${managerName} drafted ${targetLabel}`,
    };
  });
}

export async function getLeagueByIdForUser(clerkUserId: string, leagueId: string) {
  if (!hasSupabaseEnv) {
    return null;
  }

  const supabase = getSupabaseServerClient();
  const { data: appUser, error: appUserError } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle<AppUserRow>();

  if (appUserError || !appUser) {
    return null;
  }

  const { data: membership, error: membershipError } = await supabase
    .from("league_members")
    .select("*")
    .eq("league_id", leagueId)
    .eq("user_id", appUser.id)
    .maybeSingle<LeagueMemberRow>();

  if (membershipError || !membership) {
    return null;
  }

  const [
    { data: league, error: leagueError },
    { data: memberRows, error: memberRowsError },
    { data: scoreRows, error: scoreRowsError },
    { data: rosterRows, error: rosterRowsError },
    { data: pickRows, error: pickRowsError },
    { data: teamRows, error: teamRowsError },
    { data: playerRows, error: playerRowsError },
  ] = await Promise.all([
    supabase.from("leagues").select("*").eq("id", leagueId).maybeSingle<LeagueRow>(),
    supabase.from("league_members").select("*").eq("league_id", leagueId),
    supabase.from("league_scores").select("*").eq("league_id", leagueId),
    supabase.from("rosters").select("*").eq("league_id", leagueId),
    supabase.from("draft_picks").select("*").eq("league_id", leagueId).order("pick_number"),
    supabase.from("teams").select("*"),
    supabase.from("players").select("*"),
  ]);

  if (
    leagueError ||
    memberRowsError ||
    scoreRowsError ||
    rosterRowsError ||
    pickRowsError ||
    teamRowsError ||
    playerRowsError ||
    !league
  ) {
    throw new Error(
      leagueError?.message ||
        memberRowsError?.message ||
        scoreRowsError?.message ||
        rosterRowsError?.message ||
        pickRowsError?.message ||
        teamRowsError?.message ||
        playerRowsError?.message ||
        "Unable to load league.",
    );
  }

  const memberIds = (memberRows as LeagueMemberRow[]).map((row) => row.user_id);
  const { data: userRows, error: userRowsError } = await supabase
    .from("users")
    .select("*")
    .in("id", memberIds);

  if (userRowsError || !userRows) {
    throw new Error(userRowsError?.message || "Unable to load league members.");
  }

  const teams = new Map((teamRows as TeamRow[]).map((team) => [team.id, team]));
  const players = new Map((playerRows as PlayerRow[]).map((player) => [player.id, player]));
  const users = new Map((userRows as AppUserRow[]).map((user) => [user.id, user]));

  const members: LeagueMember[] = (memberRows as LeagueMemberRow[])
    .sort((left, right) => (left.draft_position ?? 999) - (right.draft_position ?? 999))
    .map((row) => ({
      userId: row.user_id,
      displayName: users.get(row.user_id)?.display_name || "Manager",
      draftPosition: row.draft_position ?? 0,
      roster: mapRosterEntries(
        (rosterRows as RosterRow[]).filter((entry) => entry.user_id === row.user_id),
        teams,
        players,
      ),
    }));

  return {
    id: league.id,
    name: league.name,
    inviteCode: league.invite_code,
    inviteLink: `/join/${league.invite_code}`,
    status: league.status,
    commissionerUserId: league.commissioner_user_id,
    members,
    picks: mapPickRows(pickRows as PickRow[], users, teams, players),
    scores: {
      group: mapScoreRows(scoreRows as ScoreRow[], "group"),
      knockout: mapScoreRows(scoreRows as ScoreRow[], "knockout"),
    },
    maxMembers: league.max_members,
    currentUserId: appUser.id,
    commissionerName: users.get(league.commissioner_user_id)?.display_name || "Commissioner",
  } as FantasyLeague & {
    maxMembers: number;
    currentUserId: string;
    commissionerName: string;
  };
}

export async function startDraftForLeague(user: CurrentAppUser, leagueId: string) {
  const supabase = getSupabaseServerClient();
  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .select("*")
    .eq("id", leagueId)
    .maybeSingle<LeagueRow>();

  if (leagueError || !league) {
    throw new Error("League not found.");
  }

  if (league.commissioner_user_id !== user.id) {
    throw new Error("Only the commissioner can start the draft.");
  }

  const { data: members, error: membersError } = await supabase
    .from("league_members")
    .select("*")
    .eq("league_id", leagueId);

  if (membersError || !members || members.length < 2) {
    throw new Error("Need at least two members before starting the draft.");
  }

  const shuffled = [...(members as LeagueMemberRow[])].sort(() => Math.random() - 0.5);
  const memberUpdatePromises = shuffled.map((member, index) =>
    supabase
      .from("league_members")
      .update({ draft_position: index + 1 })
      .eq("id", member.id),
  );

  const [{ error: updateLeagueError }, ...memberResults] = await Promise.all([
    supabase.from("leagues").update({ status: "drafting" }).eq("id", leagueId),
    ...memberUpdatePromises,
  ]);

  const updateMembersError = memberResults.find((result) => result.error)?.error;

  if (updateMembersError || updateLeagueError) {
    throw new Error(
      updateMembersError?.message || updateLeagueError?.message || "Unable to start draft.",
    );
  }
}

export async function submitDraftPickForLeague(
  user: CurrentAppUser,
  leagueId: string,
  input: { pickType: "team" | "player"; targetId: string },
) {
  const league = await getLeagueByIdForUser(user.clerkUserId, leagueId);
  if (!league) {
    throw new Error("League not found.");
  }

  const { getCurrentDraftState, validateDraftPick } = await import("@/lib/fantasy-engine");
  const draft = getCurrentDraftState(league);

  if (draft.currentManager.userId !== user.id) {
    throw new Error("It is not your turn to draft.");
  }

  const validation = validateDraftPick(league, user.id, input);
  if (!validation.isValid) {
    throw new Error(validation.message);
  }

  const supabase = getSupabaseServerClient();
  const round = draft.round;
  const pickNumber = draft.pickNumber;

  const draftInsert: {
    league_id: string;
    round: number;
    pick_number: number;
    user_id: string;
    pick_type: "team" | "player";
    team_id: string | null;
    player_id: string | null;
  } = {
    league_id: leagueId,
    round,
    pick_number: pickNumber,
    user_id: user.id,
    pick_type: input.pickType,
    team_id: input.pickType === "team" ? input.targetId : null,
    player_id: input.pickType === "player" ? input.targetId : null,
  };

  const rosterInsert: {
    league_id: string;
    user_id: string;
    roster_type: "team" | "player";
    team_id: string | null;
    player_id: string | null;
  } = {
    league_id: leagueId,
    user_id: user.id,
    roster_type: input.pickType,
    team_id: input.pickType === "team" ? input.targetId : null,
    player_id: input.pickType === "player" ? input.targetId : null,
  };

  const [{ error: pickError }, { error: rosterError }] = await Promise.all([
    supabase.from("draft_picks").insert([draftInsert]),
    supabase.from("rosters").insert([rosterInsert]),
  ]);

  if (pickError || rosterError) {
    throw new Error(pickError?.message || rosterError?.message || "Unable to save draft pick.");
  }
}
