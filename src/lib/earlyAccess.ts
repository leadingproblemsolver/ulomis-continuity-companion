/**
 * Early-access signup.
 *
 * Submissions insert into the shared `waitlist` table in Supabase (see
 * supabase/README.md — that table also serves an unrelated product, so every
 * row this app writes is tagged `source: "ulomis"`). The table's RLS policy
 * is insert-only for the public/anon role: this client can add a row but can
 * never read, change, or remove one, its own or anyone else's.
 *
 * localStorage is kept only as a same-device "you already joined" cache so a
 * reload doesn't re-show the form — it is not the source of truth, and if
 * it's cleared the person can simply submit again.
 */
import { getSupabaseClient } from "./supabaseClient";

const STORAGE_KEY = "ulomis-early-access";
const SOURCE = "ulomis";

export const CONTEXT_LOSS_OPTIONS = [
  "Research",
  "Work",
  "AI chats",
  "Shopping",
  "Learning",
  "Personal planning",
] as const;

export type ContextLossArea = (typeof CONTEXT_LOSS_OPTIONS)[number];

export interface EarlyAccessSignup {
  email: string;
  losesContextIn: string | null;
  referralCode: string;
  joinedAt: string;
}

export const REFERRAL_MESSAGE =
  "I joined Ulomis—an early continuity companion designed to help you continue projects, plans, and decisions without reconstructing everything from memory.";

/** Short, readable, stable-per-signup. Not a security token. */
function makeReferralCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  return out;
}

export function readSignup(): EarlyAccessSignup | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EarlyAccessSignup) : null;
  } catch {
    return null;
  }
}

function cacheSignup(signup: EarlyAccessSignup) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(signup));
  } catch {
    // Private browsing or a full quota. The in-memory result still stands
    // for this page view; it just won't be remembered on reload.
  }
}

export async function submitEarlyAccess(input: {
  email: string;
  losesContextIn: string | null;
}): Promise<EarlyAccessSignup> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Signups aren't available right now. Try again in a moment.");
  }

  const email = input.email.trim();
  // A referral_code collision is astronomically unlikely (6 chars over a
  // 32-symbol alphabet), but the column is unique — retry a couple of times
  // rather than surface a confusing error for it.
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    const referralCode = makeReferralCode();
    const { error } = await supabase.from("waitlist").insert({
      email,
      use_case: input.losesContextIn,
      source: SOURCE,
      referral_code: referralCode,
    });

    if (!error) {
      const signup: EarlyAccessSignup = {
        email,
        losesContextIn: input.losesContextIn,
        referralCode,
        joinedAt: new Date().toISOString(),
      };
      cacheSignup(signup);
      return signup;
    }

    lastError = error;
    // 23505 = unique_violation. Anything else won't be fixed by retrying.
    if (error.code !== "23505") break;
  }

  console.error("[ulomis] early access signup failed", lastError);
  throw new Error("Something went wrong saving that. Try again.");
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}
