import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type AppSupabaseClient = ReturnType<typeof createClient<Database>>;

let cachedClient: AppSupabaseClient | null = null;

export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  if (!cachedClient) {
    cachedClient = createClient<Database>(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return cachedClient;
}
