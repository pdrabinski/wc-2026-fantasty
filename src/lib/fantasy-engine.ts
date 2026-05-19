import {
  sampleLeague,
  scoringDefaults,
  seedTeams,
  type DraftPickType,
  type FantasyLeague,
  type LeagueMember,
  type ScorePhase,
} from "@/lib/fantasy-data";

type ProposedPick = {
  pickType: DraftPickType;
  targetId: string;
};

function getMember(league: FantasyLeague, userId: string) {
  return league.members.find((member) => member.userId === userId);
}

function countRoster(member: LeagueMember, rosterType: DraftPickType) {
  return member.roster.filter((item) => item.rosterType === rosterType).length;
}

function countTeamTiers(member: LeagueMember) {
  const teamEntries = member.roster.filter((item) => item.rosterType === "team");

  return teamEntries.reduce(
    (accumulator, entry) => {
      const team = seedTeams.find((candidate) => candidate.id === entry.sourceId);
      if (!team) {
        return accumulator;
      }

      accumulator[team.tier] += 1;
      return accumulator;
    },
    {
      "Pot 1": 0,
      "Pot 2": 0,
      "Pot 3": 0,
    },
  );
}

export function getCurrentDraftState(league: FantasyLeague) {
  const members = [...league.members].sort((left, right) => left.draftPosition - right.draftPosition);
  const picksMade = league.picks.length;
  const currentRound = Math.floor(picksMade / members.length) + 1;
  const isReverseRound = currentRound % 2 === 0;
  const order = isReverseRound ? [...members].reverse() : members;
  const roundPickIndex = picksMade % members.length;

  return {
    round: currentRound,
    pickNumber: picksMade + 1,
    order,
    currentManager: order[roundPickIndex] ?? members[0],
  };
}

export function validateDraftPick(league: FantasyLeague, userId: string, proposedPick: ProposedPick) {
  const member = getMember(league, userId);
  if (!member) {
    return { isValid: false, message: "Manager was not found in this league." };
  }

  const alreadyPicked = league.picks.some((pick) => pick.targetId === proposedPick.targetId);
  if (alreadyPicked) {
    return { isValid: false, message: "That team has already been drafted." };
  }

  if (proposedPick.pickType !== "team") {
    return { isValid: false, message: "This league is teams only." };
  }

  const team = seedTeams.find((candidate) => candidate.id === proposedPick.targetId);
  if (!team) {
    return { isValid: false, message: "Selected team does not exist in the seed pool." };
  }

  if (countRoster(member, "team") >= 5) {
    return { isValid: false, message: "This roster already has the maximum 5 teams." };
  }

  const tierCounts = countTeamTiers(member);
  if (team.tier === "Pot 1" && tierCounts["Pot 1"] >= 1) {
    return { isValid: false, message: "Each manager can draft only one Pot 1 team." };
  }

  if (team.tier === "Pot 2" && tierCounts["Pot 2"] >= 1) {
    return { isValid: false, message: "Each manager can draft only one Pot 2 team." };
  }

  return { isValid: true, message: `${team.name} is a valid team pick.` };
}

export function calculateTeamFantasyPoints(input: {
  result: "win" | "draw" | "loss";
  cleanSheet: boolean;
  goalDifferential: number;
  knockoutAdvanceStage?: "r16" | "qf" | "sf" | "champion";
}) {
  let points = 0;

  if (input.result === "win") {
    points += scoringDefaults.team.group.win;
  } else if (input.result === "draw") {
    points += scoringDefaults.team.group.draw;
  }

  if (input.cleanSheet) {
    points += scoringDefaults.team.group.cleanSheet;
  }

  points += Math.min(Math.max(input.goalDifferential, 0), scoringDefaults.team.group.goalDifferentialCap);

  if (input.knockoutAdvanceStage) {
    points += scoringDefaults.team.knockout[input.knockoutAdvanceStage];
  }

  return points;
}

export function calculatePlayerFantasyPoints(input: {
  goals: number;
  assists: number;
  cleanSheet: boolean;
  saves: number;
  penaltySaves: number;
  yellowCards: number;
  redCards: number;
  ownGoals: number;
  position: "GK" | "DEF" | "MID" | "FWD";
}) {
  let points = input.goals * scoringDefaults.player.goal;
  points += input.assists * scoringDefaults.player.assist;
  points += input.saves * scoringDefaults.player.save;
  points += input.penaltySaves * scoringDefaults.player.penaltySave;
  points += input.yellowCards * scoringDefaults.player.yellowCard;
  points += input.redCards * scoringDefaults.player.redCard;
  points += input.ownGoals * scoringDefaults.player.ownGoal;

  if (input.cleanSheet && (input.position === "GK" || input.position === "DEF")) {
    points += scoringDefaults.player.cleanSheet;
  }

  return points;
}

export function resetScoresForPhase(league: FantasyLeague, phase: ScorePhase) {
  return league.members.map((member) => ({
    userId: member.userId,
    teamPoints: phase === "knockout" ? 0 : sampleLeague.scores.group.find((score) => score.userId === member.userId)?.teamPoints ?? 0,
    playerPoints: phase === "knockout" ? 0 : sampleLeague.scores.group.find((score) => score.userId === member.userId)?.playerPoints ?? 0,
    totalPoints: phase === "knockout" ? 0 : sampleLeague.scores.group.find((score) => score.userId === member.userId)?.totalPoints ?? 0,
  }));
}

export function aggregateLeagueScores(entries: Array<{ userId: string; teamPoints: number; playerPoints: number }>) {
  return entries
    .map((entry) => ({
      ...entry,
      totalPoints: entry.teamPoints + entry.playerPoints,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints);
}

// Future version: this app may add a top-8 fantasy playoff bracket after the group stage lock.
