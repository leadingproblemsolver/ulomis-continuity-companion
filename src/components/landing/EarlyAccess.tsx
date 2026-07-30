import { useEffect, useState, type FormEvent } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Section } from "@/components/ulomis/Section";
import { UButton } from "@/components/ulomis/Button";
import { UCard } from "@/components/ulomis/Card";
import { Field, UChipGroup, UInput } from "@/components/ulomis/Form";
import { UlomisMark } from "@/components/ulomis/UlomisMark";
import { track } from "@/lib/analytics";
import {
  CONTEXT_LOSS_OPTIONS,
  REFERRAL_MESSAGE,
  isValidEmail,
  readSignup,
  submitEarlyAccess,
  type EarlyAccessSignup,
} from "@/lib/earlyAccess";

function Joined({ signup }: { signup: EarlyAccessSignup }) {
  const [copied, setCopied] = useState(false);

  async function copyReferral() {
    try {
      await navigator.clipboard.writeText(REFERRAL_MESSAGE);
      setCopied(true);
      track("ulomis_referral_created", { code: signup.referralCode });
      toast.success("Copied", { description: "Paste it wherever you'd normally share something." });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Couldn't copy", { description: "Select the text and copy it manually." });
    }
  }

  return (
    <UCard variant="thread" padding="lg" className="animate-rise">
      <div className="flex flex-wrap items-center gap-4">
        <UlomisMark size={48} state="confirmed" eyes decorative />
        <div className="min-w-0">
          <h3 className="font-display text-xl font-semibold">You're on the list.</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Held against {signup.email} — reference {signup.referralCode}.
          </p>
        </div>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        Ulomis isn't open yet, so there's nothing to log into and nothing waiting in your inbox.
        When there is something real to hold a thread with, that's when we'll write.
      </p>

      <div className="mt-7 border-t border-border pt-6">
        <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          If someone you know loses the thread too
        </p>
        <blockquote className="mt-3 rounded-2xl bg-accent/60 px-4 py-4 text-sm leading-relaxed">
          {REFERRAL_MESSAGE}
        </blockquote>
        <UButton variant="outline" size="sm" className="mt-4" onClick={copyReferral}>
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy this"}
        </UButton>
      </div>
    </UCard>
  );
}

export function EarlyAccess() {
  const [signup, setSignup] = useState<EarlyAccessSignup | null>(null);
  const [email, setEmail] = useState("");
  const [area, setArea] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Restore a previous signup so a reload doesn't ask twice.
  useEffect(() => setSignup(readSignup()), []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setError("That doesn't look like an email address.");
      return;
    }

    setError(null);
    setPending(true);
    try {
      const result = await submitEarlyAccess({ email, losesContextIn: area });
      setSignup(result);
      track("ulomis_early_access_submitted", { losesContextIn: area ?? "unspecified" });
    } catch {
      setError("Something went wrong. Try that again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Section
      id="early-access"
      tone="quiet"
      eyebrow="Early access"
      title="Join Ulomis early"
      lede="Ulomis is being built around the threads people actually lose. Tell us where yours go missing and you'll shape what it holds first."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr] lg:gap-10">
        {signup ? (
          <Joined signup={signup} />
        ) : (
          <UCard variant="raised" padding="lg">
            <form className="space-y-6" onSubmit={onSubmit} noValidate>
              <Field label="Email" htmlFor="early-access-email">
                <UInput
                  id="early-access-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "early-access-error" : undefined}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (error) setError(null);
                  }}
                />
              </Field>

              <Field
                label="Where do you lose context most?"
                hint="Optional. Pick the one that stings most — tap it again to clear it."
              >
                <UChipGroup
                  name="context-loss"
                  options={CONTEXT_LOSS_OPTIONS}
                  value={area}
                  onChange={setArea}
                />
              </Field>

              {error && (
                <p id="early-access-error" role="alert" className="text-sm text-correction-ink">
                  {error}
                </p>
              )}

              <UButton type="submit" variant="thread" size="lg" disabled={pending}>
                {pending ? "Keeping your place…" : "Join Ulomis early"}
              </UButton>

              <p className="text-xs leading-relaxed text-muted-foreground">
                One address, nothing else. No product exists to log into yet, so this is a place in
                line rather than an account.
              </p>
            </form>
          </UCard>
        )}

        <div className="space-y-5 lg:pt-2">
          <div className="flex items-start gap-4">
            <UlomisMark size={40} state="holding" decorative className="mt-0.5" />
            <div>
              <h3 className="font-semibold">Why we're asking where</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Continuity breaks differently in research than it does in a household or a long
                project. The answers decide which thread Ulomis learns to hold first.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <UlomisMark size={40} state="open" decorative className="mt-0.5" />
            <div>
              <h3 className="font-semibold">What early access means here</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Not a beta invite on a timeline we can't promise. It means you'll be asked real
                questions while there's still time for the answers to change the product.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
