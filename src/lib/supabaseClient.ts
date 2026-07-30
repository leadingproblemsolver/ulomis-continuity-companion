/**
 * Supabase client for the browser.
 *
 * The publishable (anon) key is meant to be public — everything it can
 * actually do is bounded by Row Level Security policies on the database side,
 * not by keeping this value secret. See supabase/README.md for the schema
 * and policies this key is scoped to.
 *
 * Created lazily so a build without the env vars set (a local preview, say)
 * doesn't crash at import time — only a real submit attempt fails, with a
 * message that says why.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

export function getSupabaseClient(): SupabaseClient | null {
  if (client !== undefined) return client;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  client = url && key ? createClient(url, key) : null;
  if (!client) {
    console.error(
      "[ulomis] Supabase is not configured — VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY are missing at build time.",
    );
  }
  return client;
}
