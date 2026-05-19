import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type AppSupabaseClient = ReturnType<typeof createClient<Database>>;

let cachedClient: AppSupabaseClient | null = null;

export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  if (!cachedClient) {
    cachedClient = createClient<Database>(url, secretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return cachedClient;
}
