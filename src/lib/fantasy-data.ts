export type LeagueStatus =
  | "pre_draft"
  | "drafting"
  | "group_stage"
  | "knockout_stage"
  | "completed";

export type TeamTier = "Tier 1" | "Tier 2" | "Tier 3";
export type PlayerPosition = "GK" | "DEF" | "MID" | "FWD";
export type DraftPickType = "team" | "player";
export type ScorePhase = "group" | "knockout";

export type TeamSeed = {
  id: string;
  name: string;
  countryCode: string;
  tier: TeamTier;
  groupName: string;
};

export type PlayerSeed = {
  id: string;
  name: string;
  teamId: string;
  position: PlayerPosition;
};

export type RosterEntry = {
  id: string;
  label: string;
  rosterType: DraftPickType;
  sourceId: string;
};

export type LeagueMember = {
  userId: string;
  displayName: string;
  draftPosition: number;
  roster: RosterEntry[];
};

export type DraftPick = {
  id: string;
  round: number;
  pickNumber: number;
  userId: string;
  pickType: DraftPickType;
  targetId: string;
  label: string;
};

export type LeagueScore = {
  userId: string;
  teamPoints: number;
  playerPoints: number;
  totalPoints: number;
};

export type FantasyLeague = {
  id: string;
  name: string;
  inviteCode: string;
  inviteLink: string;
  status: LeagueStatus;
  commissionerUserId: string;
  members: LeagueMember[];
  picks: DraftPick[];
  scores: Record<ScorePhase, LeagueScore[]>;
};

export const seedTeams: TeamSeed[] = [
  { id: "team-france", name: "France", countryCode: "FRA", tier: "Tier 1", groupName: "A" },
  { id: "team-brazil", name: "Brazil", countryCode: "BRA", tier: "Tier 1", groupName: "B" },
  { id: "team-argentina", name: "Argentina", countryCode: "ARG", tier: "Tier 1", groupName: "C" },
  { id: "team-england", name: "England", countryCode: "ENG", tier: "Tier 1", groupName: "D" },
  { id: "team-spain", name: "Spain", countryCode: "ESP", tier: "Tier 1", groupName: "E" },
  { id: "team-germany", name: "Germany", countryCode: "GER", tier: "Tier 1", groupName: "F" },
  { id: "team-portugal", name: "Portugal", countryCode: "POR", tier: "Tier 2", groupName: "G" },
  { id: "team-netherlands", name: "Netherlands", countryCode: "NED", tier: "Tier 2", groupName: "H" },
  { id: "team-morocco", name: "Morocco", countryCode: "MAR", tier: "Tier 2", groupName: "E" },
  { id: "team-usa", name: "United States", countryCode: "USA", tier: "Tier 3", groupName: "D" },
  { id: "team-japan", name: "Japan", countryCode: "JPN", tier: "Tier 3", groupName: "F" },
  { id: "team-senegal", name: "Senegal", countryCode: "SEN", tier: "Tier 3", groupName: "A" },
  { id: "team-mexico", name: "Mexico", countryCode: "MEX", tier: "Tier 3", groupName: "B" },
  { id: "team-switzerland", name: "Switzerland", countryCode: "SUI", tier: "Tier 3", groupName: "G" },
];

export const seedPlayers: PlayerSeed[] = [
  { id: "player-mbappe", name: "Kylian Mbappe", teamId: "team-france", position: "FWD" },
  { id: "player-vinicius", name: "Vinicius Junior", teamId: "team-brazil", position: "FWD" },
  { id: "player-messi", name: "Lionel Messi", teamId: "team-argentina", position: "FWD" },
  { id: "player-bellingham", name: "Jude Bellingham", teamId: "team-england", position: "MID" },
  { id: "player-yamal", name: "Lamine Yamal", teamId: "team-spain", position: "FWD" },
  { id: "player-musiala", name: "Jamal Musiala", teamId: "team-germany", position: "MID" },
  { id: "player-hakimi", name: "Achraf Hakimi", teamId: "team-morocco", position: "DEF" },
  { id: "player-pulisic", name: "Christian Pulisic", teamId: "team-usa", position: "MID" },
  { id: "player-mitoma", name: "Kaoru Mitoma", teamId: "team-japan", position: "MID" },
  { id: "player-ochoa", name: "Guillermo Ochoa", teamId: "team-mexico", position: "GK" },
];

export const scoringDefaults = {
  team: {
    group: {
      win: 3,
      draw: 1,
      cleanSheet: 1,
      goalDifferentialCap: 2,
    },
    knockout: {
      r16: 5,
      qf: 8,
      sf: 12,
      champion: 20,
    },
  },
  player: {
    goal: 5,
    assist: 3,
    cleanSheet: 4,
    save: 1,
    penaltySave: 8,
    yellowCard: -1,
    redCard: -3,
    ownGoal: -5,
  },
} as const;

export const sampleLeague: FantasyLeague = {
  id: "demo-league",
  name: "Front Range Cup Club",
  inviteCode: "QATAR26",
  inviteLink: "/join/QATAR26",
  status: "drafting",
  commissionerUserId: "user-ava",
  members: [
    {
      userId: "user-ava",
      displayName: "Ava",
      draftPosition: 1,
      roster: [
        { id: "r1", label: "France", rosterType: "team", sourceId: "team-france" },
        { id: "r2", label: "Morocco", rosterType: "team", sourceId: "team-morocco" },
        { id: "r3", label: "Kylian Mbappe", rosterType: "player", sourceId: "player-mbappe" },
      ],
    },
    {
      userId: "user-luca",
      displayName: "Luca",
      draftPosition: 2,
      roster: [
        { id: "r4", label: "Brazil", rosterType: "team", sourceId: "team-brazil" },
        { id: "r5", label: "Japan", rosterType: "team", sourceId: "team-japan" },
        { id: "r6", label: "Vinicius Junior", rosterType: "player", sourceId: "player-vinicius" },
      ],
    },
    {
      userId: "user-maya",
      displayName: "Maya",
      draftPosition: 3,
      roster: [
        { id: "r7", label: "Argentina", rosterType: "team", sourceId: "team-argentina" },
        { id: "r8", label: "United States", rosterType: "team", sourceId: "team-usa" },
        { id: "r9", label: "Lionel Messi", rosterType: "player", sourceId: "player-messi" },
      ],
    },
    {
      userId: "user-noah",
      displayName: "Noah",
      draftPosition: 4,
      roster: [
        { id: "r10", label: "England", rosterType: "team", sourceId: "team-england" },
        { id: "r11", label: "Senegal", rosterType: "team", sourceId: "team-senegal" },
        { id: "r12", label: "Jude Bellingham", rosterType: "player", sourceId: "player-bellingham" },
      ],
    },
  ],
  picks: [
    { id: "p1", round: 1, pickNumber: 1, userId: "user-ava", pickType: "team", targetId: "team-france", label: "Ava drafted France" },
    { id: "p2", round: 1, pickNumber: 2, userId: "user-luca", pickType: "team", targetId: "team-brazil", label: "Luca drafted Brazil" },
    { id: "p3", round: 1, pickNumber: 3, userId: "user-maya", pickType: "team", targetId: "team-argentina", label: "Maya drafted Argentina" },
    { id: "p4", round: 1, pickNumber: 4, userId: "user-noah", pickType: "team", targetId: "team-england", label: "Noah drafted England" },
    { id: "p5", round: 2, pickNumber: 5, userId: "user-noah", pickType: "team", targetId: "team-senegal", label: "Noah drafted Senegal" },
    { id: "p6", round: 2, pickNumber: 6, userId: "user-maya", pickType: "team", targetId: "team-usa", label: "Maya drafted United States" },
    { id: "p7", round: 2, pickNumber: 7, userId: "user-luca", pickType: "team", targetId: "team-japan", label: "Luca drafted Japan" },
    { id: "p8", round: 2, pickNumber: 8, userId: "user-ava", pickType: "team", targetId: "team-morocco", label: "Ava drafted Morocco" },
    { id: "p9", round: 3, pickNumber: 9, userId: "user-ava", pickType: "player", targetId: "player-mbappe", label: "Ava drafted Kylian Mbappe" },
    { id: "p10", round: 3, pickNumber: 10, userId: "user-luca", pickType: "player", targetId: "player-vinicius", label: "Luca drafted Vinicius Junior" },
    { id: "p11", round: 3, pickNumber: 11, userId: "user-maya", pickType: "player", targetId: "player-messi", label: "Maya drafted Lionel Messi" },
    { id: "p12", round: 3, pickNumber: 12, userId: "user-noah", pickType: "player", targetId: "player-bellingham", label: "Noah drafted Jude Bellingham" },
  ],
  scores: {
    group: [
      { userId: "user-noah", teamPoints: 11, playerPoints: 8, totalPoints: 19 },
      { userId: "user-ava", teamPoints: 10, playerPoints: 7, totalPoints: 17 },
      { userId: "user-luca", teamPoints: 8, playerPoints: 7, totalPoints: 15 },
      { userId: "user-maya", teamPoints: 7, playerPoints: 5, totalPoints: 12 },
    ],
    knockout: [
      { userId: "user-ava", teamPoints: 0, playerPoints: 0, totalPoints: 0 },
      { userId: "user-luca", teamPoints: 0, playerPoints: 0, totalPoints: 0 },
      { userId: "user-maya", teamPoints: 0, playerPoints: 0, totalPoints: 0 },
      { userId: "user-noah", teamPoints: 0, playerPoints: 0, totalPoints: 0 },
    ],
  },
};

export function summarizeLeague(league: FantasyLeague) {
  return {
    memberCount: league.members.length,
    pickCount: league.picks.length,
    groupLeader:
      league.members.find((member) => member.userId === league.scores.group[0]?.userId)?.displayName ??
      "TBD",
  };
}
