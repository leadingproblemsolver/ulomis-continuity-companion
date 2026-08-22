import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Check, Copy, Paperclip, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { UButton } from "@/components/ulomis/Button";
import { UCard, UCardHeader } from "@/components/ulomis/Card";
import { Field, UInput, UTextarea } from "@/components/ulomis/Form";
import { UlomisMark } from "@/components/ulomis/UlomisMark";
import { useLocale } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import {
  formatContinuityPacket,
  reconstructFirstValue,
  type ContinuityItem,
  type FirstValueResult,
} from "@/lib/firstValue";

const MAX_CHARS = 20_000;
const MIN_CHARS = 40;

function EvidenceLine({ item }: { item: ContinuityItem }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-sm leading-relaxed text-foreground">{item.text}</p>
      <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Source {item.sourceId} · explicit wording
      </p>
    </div>
  );
}

function ResultBlock({
  title,
  items,
  empty,
}: {
  title: string;
  items: ContinuityItem[];
  empty: string;
}) {
  return (
    <section>
      <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</h4>
      <div className="mt-2 space-y-2">
        {items.length ? (
          items.map((item) => <EvidenceLine key={`${item.kind}-${item.sourceId}`} item={item} />)
        ) : (
          <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            {empty}
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * Real first value, deliberately bounded.
 *
 * The visitor pastes a real unfinished thread. A deterministic browser-local
 * extractor surfaces only explicit state, decisions, open loops, and action
 * language already present in that text. No backend, LLM, upload, or hidden
 * inference is involved. Every surfaced item cites its source fragment.
 */
export function RealThreadHandoff() {
  const { locale } = useLocale();
  const [content, setContent] = useState("");
  const [label, setLabel] = useState("");
  const [result, setResult] = useState<FirstValueResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const startedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function markStarted() {
    if (startedRef.current) return;
    startedRef.current = true;
    track("real_thread_started", {});
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    markStarted();
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setContent((prev) => (prev ? `${prev}\n\n${text}` : text).slice(0, MAX_CHARS));
      setResult(null);
      setError(null);
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function restore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = content.trim();
    if (trimmed.length < MIN_CHARS) {
      setError(
        locale === "ar"
          ? "أضف بضعة أسطر من خيط حقيقي حتى توجد مادة كافية للاستعادة."
          : "Add a few lines from a real thread so there is enough evidence to restore.",
      );
      return;
    }

    const next = reconstructFirstValue(trimmed);
    setResult(next);
    setError(null);
    track("real_thread_first_value_completed", {
      chars: trimmed.length,
      sources: next.sources.length,
      matchedSources: next.matchedSourceCount,
      decisions: next.decisions.length,
      openLoops: next.openLoops.length,
      hasNextAction: Boolean(next.nextAction),
    });
  }

  async function copyPacket() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(formatContinuityPacket(label, result));
      setCopied(true);
      track("real_thread_packet_copied", { sources: result.sources.length });
      toast.success(locale === "ar" ? "تم نسخ حزمة الاستمرارية" : "Continuity packet copied");
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error(locale === "ar" ? "تعذّر النسخ" : "Couldn't copy");
    }
  }

  if (result) {
    return (
      <UCard variant="thread" padding="lg" className="animate-rise">
        <UCardHeader
          icon={<UlomisMark size={32} state="confirmed" eyes decorative />}
          eyebrow={locale === "ar" ? "قيمة أولى حقيقية · داخل المتصفح" : "Real first value · browser-local"}
          title={locale === "ar" ? "هذه حزمة الاستمرارية الخاصة بخيطك" : "Your first continuity packet"}
          description={
            locale === "ar"
              ? "هذه ليست خلاصة مخمّنة. أولوميس أظهر فقط العبارات الصريحة الموجودة في النص وربط كل نتيجة بمصدرها."
              : "This is not a guessed summary. Ulomis surfaced only explicit wording already in your thread and tied every result back to its source."
          }
        />

        {label && (
          <p className="mt-5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>
        )}

        <div className="mt-6 space-y-6">
          <ResultBlock
            title={locale === "ar" ? "أين توقفت" : "Where you left it"}
            items={result.state ? [result.state] : []}
            empty={locale === "ar" ? "لم يتم العثور على حالة صريحة." : "No explicit state was found."}
          />
          <ResultBlock
            title={locale === "ar" ? "القرارات" : "Decisions"}
            items={result.decisions}
            empty={locale === "ar" ? "لم يتم العثور على قرار صريح." : "No explicit decision was detected."}
          />
          <ResultBlock
            title={locale === "ar" ? "الحلقات المفتوحة" : "Open loops"}
            items={result.openLoops}
            empty={locale === "ar" ? "لم يتم العثور على حلقة مفتوحة صريحة." : "No explicit open loop was detected."}
          />
          <ResultBlock
            title={locale === "ar" ? "الخطوة التالية" : "Next action"}
            items={result.nextAction ? [result.nextAction] : []}
            empty={
              locale === "ar"
                ? "لا توجد خطوة تالية صريحة في النص — لم يخترع أولوميس واحدة."
                : "No explicit next action is present — Ulomis did not invent one."
            }
          />
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-border bg-accent/40 p-4 text-xs leading-relaxed text-muted-foreground">
          {locale === "ar"
            ? `تم فحص ${result.sources.length} جزءاً نصياً محلياً في هذا المتصفح. لم يتم إرسال أي محتوى إلى خادم أو نموذج ذكاء اصطناعي.`
            : `${result.sources.length} source fragments were checked locally in this browser. Nothing was sent to a server or AI model.`}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <UButton variant="thread" size="sm" onClick={copyPacket}>
            {copied ? <Check /> : <Copy />}
            {copied
              ? locale === "ar"
                ? "تم النسخ"
                : "Copied"
              : locale === "ar"
                ? "انسخ حزمة الاستمرارية"
                : "Copy continuity packet"}
          </UButton>
          <UButton
            variant="outline"
            size="sm"
            onClick={() => {
              setResult(null);
              track("ulomis_cta_clicked", { cta: "real_thread_edit_input" });
            }}
          >
            <RotateCcw />
            {locale === "ar" ? "صحح أو أضف مصدراً" : "Correct or add a source"}
          </UButton>
          <UButton
            variant="ghost"
            size="sm"
            asChild
            onClick={() => track("ulomis_cta_clicked", { cta: "real_value_to_early_access" })}
          >
            <a href="#early-access">
              {locale === "ar" ? "أريد اختبار هذا مع خيط أطول" : "I want to test this on a longer thread"}
            </a>
          </UButton>
        </div>
      </UCard>
    );
  }

  return (
    <UCard variant="raised" padding="lg">
      <UCardHeader
        icon={<UlomisMark size={28} state="idle" decorative />}
        eyebrow={locale === "ar" ? "المشهد ٨ · أول قيمة حقيقية" : "Scene 8 · real first value"}
        title={locale === "ar" ? "أرِ أولوميس أين توقفت" : "Show Ulomis where you stopped"}
        description={
          locale === "ar"
            ? "الصق بضعة أسطر من رسالة أو ملاحظات أو قرار أو مسؤولية غير مكتملة. استعادة واحدة، بدون تسجيل دخول."
            : "Paste a few lines from a message, note, decision, or unfinished responsibility. One restore, no signup."
        }
      />

      <form className="mt-6 space-y-5" onSubmit={restore}>
        <Field
          label={locale === "ar" ? "الخيط غير المكتمل" : "The unfinished thread"}
          hint={
            locale === "ar"
              ? "أفضل مدخل: 3–20 سطراً فيها قرار أو شيء معلق أو خطوة قادمة. احذف الأسماء الحساسة إن أردت."
              : "Best input: 3–20 lines containing a decision, something still open, or a next step. Redact sensitive names if needed."
          }
          htmlFor="real-thread-content"
        >
          <UTextarea
            id="real-thread-content"
            className="min-h-44"
            value={content}
            maxLength={MAX_CHARS}
            placeholder={
              locale === "ar"
                ? "مثال: اتفقنا على... ما زلنا ننتظر... الخطوة التالية هي..."
                : "Example: We agreed to… We're still waiting on… Next I need to…"
            }
            onChange={(event) => {
              markStarted();
              setContent(event.target.value);
              setError(null);
            }}
            onPaste={markStarted}
          />
        </Field>

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.json,text/plain,text/markdown,application/json"
            onChange={onFileChange}
            className="sr-only"
            id="real-thread-file"
          />
          <UButton type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Paperclip />
            {locale === "ar" ? "أرفق ملف نصي" : "Attach a text file"}
          </UButton>
        </div>

        <Field
          label={locale === "ar" ? "ما الذي تعود إليه؟ (اختياري)" : "What are you returning to? (optional)"}
          htmlFor="real-thread-label"
        >
          <UInput
            id="real-thread-label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder={locale === "ar" ? "مثال: الجلسة القادمة مع الطالب" : "e.g. Next student session"}
          />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-correction-ink">
            {error}
          </p>
        )}

        <p className="rounded-2xl border border-dashed border-border bg-accent/40 p-3 text-xs leading-relaxed text-muted-foreground">
          {locale === "ar"
            ? "يعمل هذا المرور الأول داخل متصفحك فقط. يستخدم قواعد محدودة لاستخراج العبارات الصريحة؛ لا يوجد رفع للبيانات ولا استدعاء لنموذج ذكاء اصطناعي."
            : "This first pass runs only in your browser. It uses bounded rules to surface explicit wording; there is no upload and no AI-model call."}
        </p>

        <UButton type="submit" variant="thread" size="lg" disabled={!content.trim()}>
          {locale === "ar" ? "استعد خيطي محلياً" : "Restore my thread locally"}
        </UButton>
      </form>
    </UCard>
  );
}
