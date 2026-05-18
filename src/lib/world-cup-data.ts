import {
  footballDataBaseUrl,
  footballDataCompetitionCode,
  footballDataSeason,
  hasFootballDataEnv,
} from "@/lib/env";
import { seedTeams } from "@/lib/fantasy-data";

type FootballDataTeam = {
  id: number;
  name: string;
  tla?: string;
  shortName?: string;
  crest?: string;
  area?: {
    code?: string;
  };
};

type FootballDataMatch = {
  id: number;
  utcDate: string;
  status: string;
  stage?: string;
  group?: string | null;
  homeTeam: {
    name: string;
    tla?: string;
  };
  awayTeam: {
    name: string;
    tla?: string;
  };
  score: {
    fullTime?: {
      home?: number | null;
      away?: number | null;
    };
    winner?: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
  };
};

export type TournamentTeam = {
  id: string;
  name: string;
  code: string;
  crestUrl?: string;
  source: "football-data" | "seed";
};

export type TournamentMatch = {
  id: string;
  kickoffAt: string;
  status: string;
  stage: string;
  groupName?: string | null;
  homeTeam: string;
  awayTeam: string;
  homeCode?: string;
  awayCode?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  source: "football-data" | "seed";
};

export type TournamentDataSnapshot = {
  provider: {
    mode: "live" | "manual";
    label: string;
    reason: string;
    links: {
      footballDataDocs: string;
      fifaSchedule: string;
      fifaQualified: string;
    };
  };
  teams: TournamentTeam[];
  matches: TournamentMatch[];
};

const providerLinks = {
  footballDataDocs: "https://www.football-data.org/documentation/api",
  fifaSchedule:
    "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums",
  fifaQualified:
    "https://www.fifa.com/en/articles/world-cup-2026-who-has-qualified?searchOverlay=1",
};

const fallbackMatches: TournamentMatch[] = [
  {
    id: "seed-match-1",
    kickoffAt: "2026-06-11T18:00:00Z",
    status: "SCHEDULED",
    stage: "GROUP",
    groupName: "A",
    homeTeam: "United States",
    awayTeam: "Japan",
    homeCode: "USA",
    awayCode: "JPN",
    source: "seed",
  },
  {
    id: "seed-match-2",
    kickoffAt: "2026-06-12T21:00:00Z",
    status: "SCHEDULED",
    stage: "GROUP",
    groupName: "B",
    homeTeam: "Brazil",
    awayTeam: "Mexico",
    homeCode: "BRA",
    awayCode: "MEX",
    source: "seed",
  },
  {
    id: "seed-match-3",
    kickoffAt: "2026-06-13T19:00:00Z",
    status: "SCHEDULED",
    stage: "GROUP",
    groupName: "C",
    homeTeam: "Argentina",
    awayTeam: "Senegal",
    homeCode: "ARG",
    awayCode: "SEN",
    source: "seed",
  },
  {
    id: "seed-match-4",
    kickoffAt: "2026-06-14T20:00:00Z",
    status: "SCHEDULED",
    stage: "GROUP",
    groupName: "D",
    homeTeam: "England",
    awayTeam: "Morocco",
    homeCode: "ENG",
    awayCode: "MAR",
    source: "seed",
  },
];

function getFallbackTeams(): TournamentTeam[] {
  return seedTeams.map((team) => ({
    id: team.id,
    name: team.name,
    code: team.countryCode,
    source: "seed",
  }));
}

function getFallbackSnapshot(reason: string): TournamentDataSnapshot {
  return {
    provider: {
      mode: "manual",
      label: "Manual / seed fallback",
      reason,
      links: providerLinks,
    },
    teams: getFallbackTeams(),
    matches: fallbackMatches,
  };
}

async function fetchFootballDataJson<T>(path: string) {
  const response = await fetch(`${footballDataBaseUrl}${path}`, {
    headers: {
      "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY || "",
    },
    next: {
      revalidate: 900,
    },
  });

  if (!response.ok) {
    throw new Error(`football-data.org responded with ${response.status}.`);
  }

  return (await response.json()) as T;
}

export async function getTournamentDataSnapshot(): Promise<TournamentDataSnapshot> {
  if (!hasFootballDataEnv) {
    return getFallbackSnapshot(
      "FOOTBALL_DATA_API_KEY is missing, so the app is using seeded teams and placeholder fixtures.",
    );
  }

  try {
    const [teamsPayload, matchesPayload] = await Promise.all([
      fetchFootballDataJson<{ teams: FootballDataTeam[] }>(
        `/competitions/${footballDataCompetitionCode}/teams`,
      ),
      fetchFootballDataJson<{ matches: FootballDataMatch[] }>(
        `/competitions/${footballDataCompetitionCode}/matches?season=${footballDataSeason}`,
      ),
    ]);

    return {
      provider: {
        mode: "live",
        label: "football-data.org + FIFA reference",
        reason: `Using football-data.org competition ${footballDataCompetitionCode} for the ${footballDataSeason} World Cup feed, with FIFA pages as the official tournament reference.`,
        links: providerLinks,
      },
      teams: teamsPayload.teams.map((team) => ({
        id: `fd-team-${team.id}`,
        name: team.shortName || team.name,
        code: team.tla || team.area?.code || team.name.slice(0, 3).toUpperCase(),
        crestUrl: team.crest,
        source: "football-data",
      })),
      matches: matchesPayload.matches.map((match) => ({
        id: `fd-match-${match.id}`,
        kickoffAt: match.utcDate,
        status: match.status,
        stage: match.stage || "GROUP",
        groupName: match.group,
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        homeCode: match.homeTeam.tla,
        awayCode: match.awayTeam.tla,
        homeScore: match.score.fullTime?.home ?? null,
        awayScore: match.score.fullTime?.away ?? null,
        source: "football-data",
      })),
    };
  } catch (error) {
    return getFallbackSnapshot(
      error instanceof Error
        ? `${error.message} Falling back to seeded tournament data.`
        : "Could not reach football-data.org. Falling back to seeded tournament data.",
    );
  }
}
