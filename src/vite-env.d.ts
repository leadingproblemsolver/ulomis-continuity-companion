/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL, e.g. https://xxxx.supabase.co — public by design. */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase publishable (anon) key — safe to ship client-side; RLS does the restricting. */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
