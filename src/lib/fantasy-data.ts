export type LeagueStatus =
  | "pre_draft"
  | "drafting"
  | "group_stage"
  | "knockout_stage"
  | "completed";

export type TeamTier = "Pot 1" | "Pot 2" | "Pot 3";
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

const countryCodeToIso2: Record<string, string> = {
  ALG: "DZ",
  ARG: "AR",
  AUS: "AU",
  AUT: "AT",
  BEL: "BE",
  BRA: "BR",
  CAN: "CA",
  CIV: "CI",
  COL: "CO",
  CRO: "HR",
  ECU: "EC",
  EGY: "EG",
  ESP: "ES",
  FRA: "FR",
  GER: "DE",
  IRN: "IR",
  JPN: "JP",
  KOR: "KR",
  KSA: "SA",
  MAR: "MA",
  MEX: "MX",
  NED: "NL",
  NOR: "NO",
  PAN: "PA",
  PAR: "PY",
  POR: "PT",
  QAT: "QA",
  RSA: "ZA",
  SEN: "SN",
  SUI: "CH",
  TUN: "TN",
  URU: "UY",
  USA: "US",
  UZB: "UZ",
};

const flagOverrides: Record<string, string> = {
  ENG: "🏴",
  SCO: "🏴",
};

export function getFlagEmojiFromCode(countryCode?: string) {
  if (!countryCode) {
    return "🏳️";
  }

  const normalized = countryCode.toUpperCase();
  if (flagOverrides[normalized]) {
    return flagOverrides[normalized];
  }

  const iso2 = countryCodeToIso2[normalized] || normalized.slice(0, 2);

  return iso2
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

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

const potSeeds: Array<{ id: string; name: string; countryCode: string; tier: TeamTier }> = [
  { id: "team-spain", name: "Spain", countryCode: "ESP", tier: "Pot 1" },
  { id: "team-argentina", name: "Argentina", countryCode: "ARG", tier: "Pot 1" },
  { id: "team-france", name: "France", countryCode: "FRA", tier: "Pot 1" },
  { id: "team-england", name: "England", countryCode: "ENG", tier: "Pot 1" },
  { id: "team-brazil", name: "Brazil", countryCode: "BRA", tier: "Pot 1" },
  { id: "team-portugal", name: "Portugal", countryCode: "POR", tier: "Pot 1" },
  { id: "team-netherlands", name: "Netherlands", countryCode: "NED", tier: "Pot 1" },
  { id: "team-belgium", name: "Belgium", countryCode: "BEL", tier: "Pot 1" },
  { id: "team-germany", name: "Germany", countryCode: "GER", tier: "Pot 1" },
  { id: "team-croatia", name: "Croatia", countryCode: "CRO", tier: "Pot 1" },
  { id: "team-mexico", name: "Mexico", countryCode: "MEX", tier: "Pot 1" },
  { id: "team-morocco", name: "Morocco", countryCode: "MAR", tier: "Pot 2" },
  { id: "team-colombia", name: "Colombia", countryCode: "COL", tier: "Pot 2" },
  { id: "team-uruguay", name: "Uruguay", countryCode: "URU", tier: "Pot 2" },
  { id: "team-switzerland", name: "Switzerland", countryCode: "SUI", tier: "Pot 2" },
  { id: "team-japan", name: "Japan", countryCode: "JPN", tier: "Pot 2" },
  { id: "team-senegal", name: "Senegal", countryCode: "SEN", tier: "Pot 2" },
  { id: "team-iran", name: "Iran", countryCode: "IRN", tier: "Pot 2" },
  { id: "team-south-korea", name: "South Korea", countryCode: "KOR", tier: "Pot 2" },
  { id: "team-ecuador", name: "Ecuador", countryCode: "ECU", tier: "Pot 2" },
  { id: "team-austria", name: "Austria", countryCode: "AUT", tier: "Pot 2" },
  { id: "team-australia", name: "Australia", countryCode: "AUS", tier: "Pot 2" },
  { id: "team-usa", name: "United States", countryCode: "USA", tier: "Pot 2" },
  { id: "team-canada", name: "Canada", countryCode: "CAN", tier: "Pot 2" },
  { id: "team-norway", name: "Norway", countryCode: "NOR", tier: "Pot 3" },
  { id: "team-panama", name: "Panama", countryCode: "PAN", tier: "Pot 3" },
  { id: "team-egypt", name: "Egypt", countryCode: "EGY", tier: "Pot 3" },
  { id: "team-algeria", name: "Algeria", countryCode: "ALG", tier: "Pot 3" },
  { id: "team-scotland", name: "Scotland", countryCode: "SCO", tier: "Pot 3" },
  { id: "team-paraguay", name: "Paraguay", countryCode: "PAR", tier: "Pot 3" },
  { id: "team-tunisia", name: "Tunisia", countryCode: "TUN", tier: "Pot 3" },
  { id: "team-ivory-coast", name: "Ivory Coast", countryCode: "CIV", tier: "Pot 3" },
  { id: "team-uzbekistan", name: "Uzbekistan", countryCode: "UZB", tier: "Pot 3" },
  { id: "team-qatar", name: "Qatar", countryCode: "QAT", tier: "Pot 3" },
  { id: "team-saudi-arabia", name: "Saudi Arabia", countryCode: "KSA", tier: "Pot 3" },
  { id: "team-south-africa", name: "South Africa", countryCode: "RSA", tier: "Pot 3" },
];

export const seedTeams: TeamSeed[] = potSeeds.map((team) => ({
  id: team.id,
  name: team.name,
  countryCode: team.countryCode,
  tier: team.tier,
  groupName: "TBD",
}));

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
        { id: "r3", label: "Mexico", rosterType: "team", sourceId: "team-mexico" },
      ],
    },
    {
      userId: "user-luca",
      displayName: "Luca",
      draftPosition: 2,
      roster: [
        { id: "r4", label: "Brazil", rosterType: "team", sourceId: "team-brazil" },
        { id: "r5", label: "Japan", rosterType: "team", sourceId: "team-japan" },
        { id: "r6", label: "Portugal", rosterType: "team", sourceId: "team-portugal" },
      ],
    },
    {
      userId: "user-maya",
      displayName: "Maya",
      draftPosition: 3,
      roster: [
        { id: "r7", label: "Argentina", rosterType: "team", sourceId: "team-argentina" },
        { id: "r8", label: "United States", rosterType: "team", sourceId: "team-usa" },
        { id: "r9", label: "Canada", rosterType: "team", sourceId: "team-canada" },
      ],
    },
    {
      userId: "user-noah",
      displayName: "Noah",
      draftPosition: 4,
      roster: [
        { id: "r10", label: "England", rosterType: "team", sourceId: "team-england" },
        { id: "r11", label: "Senegal", rosterType: "team", sourceId: "team-senegal" },
        { id: "r12", label: "Germany", rosterType: "team", sourceId: "team-germany" },
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
    { id: "p9", round: 3, pickNumber: 9, userId: "user-ava", pickType: "team", targetId: "team-mexico", label: "Ava drafted Mexico" },
    { id: "p10", round: 3, pickNumber: 10, userId: "user-luca", pickType: "team", targetId: "team-portugal", label: "Luca drafted Portugal" },
    { id: "p11", round: 3, pickNumber: 11, userId: "user-maya", pickType: "team", targetId: "team-canada", label: "Maya drafted Canada" },
    { id: "p12", round: 3, pickNumber: 12, userId: "user-noah", pickType: "team", targetId: "team-germany", label: "Noah drafted Germany" },
  ],
  scores: {
    group: [
      { userId: "user-noah", teamPoints: 19, playerPoints: 0, totalPoints: 19 },
      { userId: "user-ava", teamPoints: 17, playerPoints: 0, totalPoints: 17 },
      { userId: "user-luca", teamPoints: 15, playerPoints: 0, totalPoints: 15 },
      { userId: "user-maya", teamPoints: 12, playerPoints: 0, totalPoints: 12 },
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
