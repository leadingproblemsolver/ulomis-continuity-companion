import { useRef, useState, type ChangeEvent } from "react";
import { Check, Copy, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { UButton } from "@/components/ulomis/Button";
import { UCard, UCardHeader } from "@/components/ulomis/Card";
import { Field, UInput, UTextarea } from "@/components/ulomis/Form";
import { UlomisMark } from "@/components/ulomis/UlomisMark";
import { useLocale } from "@/lib/i18n";
import { track } from "@/lib/analytics";

const MAX_CHARS = 20_000;

/**
 * Scene 8 — real-thread handoff. There is no ingestion backend, so this is
 * deliberately honest about what it is: content stays in this component's
 * state, nothing is sent anywhere, and nothing claims to have been analyzed.
 * The truthful next step is the real early-access form further down the page.
 */
export function RealThreadHandoff() {
  const { locale } = useLocale();
  const [content, setContent] = useState("");
  const [label, setLabel] = useState("");
  const [saved, setSaved] = useState(false);
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
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  async function copyPacket() {
    const packet = [
      label ? `Label: ${label}` : null,
      "---",
      content,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(packet);
      setCopied(true);
      toast.success(
        locale === "ar" ? "تم النسخ" : "Copied",
        {
          description:
            locale === "ar"
              ? "هذا نسخة مما كتبتَه فقط — لم يُحلَّل شيء."
              : "This is exactly what you typed — nothing was analyzed.",
        },
      );
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error(locale === "ar" ? "تعذّر النسخ" : "Couldn't copy");
    }
  }

  if (saved) {
    return (
      <UCard variant="thread" padding="lg" className="animate-rise">
        <UCardHeader
          icon={<UlomisMark size={28} state="holding" decorative />}
          eyebrow={locale === "ar" ? "خيط حقيقي · محفوظ محلياً" : "Real thread · kept locally"}
          title={locale === "ar" ? "هذا ما زوّدتَنا به" : "Here's what you gave us"}
        />
        {label && (
          <p className="mt-4 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>
        )}
        <pre className="mt-2 max-h-64 overflow-auto rounded-2xl border border-border bg-surface p-4 text-xs leading-relaxed whitespace-pre-wrap text-foreground/85">
          {content}
        </pre>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          {locale === "ar"
            ? "هذا موجود فقط في متصفحك الآن. لم يُقرأ أو يُحلَّل أو يُرسَل إلى أي مكان — ولم يُنشأ أي خيط استعادة حقيقي من هذا النص."
            : "This exists only in your browser right now. Nothing has been read, analyzed, or sent anywhere — and no real restoration view has been generated from it."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <UButton variant="outline" size="sm" onClick={copyPacket}>
            {copied ? <Check /> : <Copy />}
            {copied
              ? locale === "ar"
                ? "تم النسخ"
                : "Copied"
              : locale === "ar"
                ? "انسخ ما أدخلتَه"
                : "Copy what you entered"}
          </UButton>
          <UButton
            variant="thread"
            size="sm"
            asChild
            onClick={() => track("ulomis_cta_clicked", { cta: "real_thread_to_early_access" })}
          >
            <a href="#early-access">
              {locale === "ar" ? "تابع إلى طلب الوصول المبكر" : "Continue to the early-access form"}
            </a>
          </UButton>
          <UButton variant="ghost" size="sm" onClick={() => setSaved(false)}>
            {locale === "ar" ? "تعديل" : "Edit"}
          </UButton>
        </div>
      </UCard>
    );
  }

  return (
    <UCard variant="raised" padding="lg">
      <UCardHeader
        icon={<UlomisMark size={28} state="idle" decorative />}
        eyebrow={locale === "ar" ? "المشهد ٨ · خيط حقيقي" : "Scene 8 · a real thread"}
        title={locale === "ar" ? "أعطِ أولوميس خيطاً حقيقياً" : "Give Ulomis one real thread"}
        description={
          locale === "ar"
            ? "الصق رسائل أو ملاحظات أو أجزاء من خيط غير مكتمل فعلي — أو ارفع ملفاً. لا حاجة لتصنيف أي شيء."
            : "Paste messages, notes, or fragments from a real unfinished thread — or attach a file. Nothing needs to be classified."
        }
      />

      <form
        className="mt-6 space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (!content.trim()) return;
          setSaved(true);
        }}
      >
        <Field
          label={locale === "ar" ? "الصق المحتوى هنا" : "Paste your content here"}
          htmlFor="real-thread-content"
        >
          <UTextarea
            id="real-thread-content"
            className="min-h-40"
            value={content}
            maxLength={MAX_CHARS}
            placeholder={
              locale === "ar"
                ? "بريد إلكتروني، رسالة، ملاحظة، أي شيء يتعلق بخيط توقّفتَ عنده…"
                : "An email, a message, a note — anything from a thread you paused…"
            }
            onChange={(event) => {
              markStarted();
              setContent(event.target.value);
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
          <UButton
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip />
            {locale === "ar" ? "أرفق ملف نصي (.txt، .md، .json)" : "Attach a .txt, .md, or .json file"}
          </UButton>
        </div>

        <Field
          label={locale === "ar" ? "تسمية قصيرة (اختياري)" : "Short label (optional)"}
          htmlFor="real-thread-label"
        >
          <UInput
            id="real-thread-label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder={locale === "ar" ? "مثال: قرار إطلاق العميل" : "e.g. Client-launch decision"}
          />
        </Field>

        <p className="rounded-2xl border border-dashed border-border bg-accent/40 p-3 text-xs leading-relaxed text-muted-foreground">
          {locale === "ar"
            ? "هذه واجهة تسليم مبكرة وموجَّهة. لا يوجد نظام استيعاب فعلي بعد: ما تكتبه يبقى في هذه الصفحة فقط، ولن يُقرأ أو يُخزَّن أو يُرسَل إلى أي خادم."
            : "This is an early, guided handoff — there's no real ingestion system yet. What you type stays on this page only; nothing is read, stored, or sent to any server."}
        </p>

        <UButton type="submit" variant="thread" size="lg" disabled={!content.trim()}>
          {locale === "ar" ? "احفظ هذا واستعرضه" : "Save this and review it"}
        </UButton>
      </form>
    </UCard>
  );
}
