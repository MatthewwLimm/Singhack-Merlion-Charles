import { createClient } from "@supabase/supabase-js"
import type { Database } from "./types"

// No authentication exists yet in this prototype (see supabase/migrations/
// 20260101000003_rls_policies.sql), so a single anon-key client is enough on
// both the server and (indirectly, via Server Actions) the browser. Every
// query still goes through RLS — this key can never bypass it. Once RM login
// exists, swap this for @supabase/ssr's cookie-aware server client so
// `auth.uid()` is available to policies.
let cached: ReturnType<typeof createClient<Database, "public">> | null = null

export function getSupabaseClient() {
  if (cached) return cached

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.example).",
    )
  }

  cached = createClient<Database, "public">(url, anonKey, { auth: { persistSession: false } })
  return cached
}
