export const hasClerkEnv = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export const hasSupabaseEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export const hasFootballDataEnv = Boolean(process.env.FOOTBALL_DATA_API_KEY);

export const footballDataBaseUrl =
  process.env.FOOTBALL_DATA_BASE_URL || "https://api.football-data.org/v4";

export const footballDataCompetitionCode =
  process.env.FOOTBALL_DATA_WORLD_CUP_CODE || "WC";

export const footballDataSeason = Number(process.env.FOOTBALL_DATA_SEASON || "2026");
