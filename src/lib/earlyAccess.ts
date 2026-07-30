/**
 * Early-access signup.
 *
 * There is no backend in this build. Submissions are held in localStorage so
 * the page can show a truthful "you're on the list" state across reloads
 * without claiming an email was sent.
 *
 * `submitEarlyAccess` is the single function to replace when a real endpoint
 * exists; nothing else in the app touches storage directly.
 */

const STORAGE_KEY = "ulomis-early-access";

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

export async function submitEarlyAccess(input: {
  email: string;
  losesContextIn: string | null;
}): Promise<EarlyAccessSignup> {
  const signup: EarlyAccessSignup = {
    email: input.email.trim(),
    losesContextIn: input.losesContextIn,
    referralCode: makeReferralCode(),
    joinedAt: new Date().toISOString(),
  };

  // Stands in for network latency so the pending state is actually visible.
  await new Promise((resolve) => setTimeout(resolve, 550));

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(signup));
  } catch {
    // Private browsing or a full quota. The in-memory result still stands.
  }

  return signup;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}
