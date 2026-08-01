import { Eye, EyeOff, Globe, ShieldCheck, SlidersHorizontal, Tag } from "lucide-react";
import type { ComponentType } from "react";
import { useText } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const claims: { icon: ComponentType<{ className?: string }>; text: { en: string; ar: string } }[] =
  [
    {
      icon: Eye,
      text: {
        en: "Sources stay visible.",
        ar: "المصادر تبقى ظاهرة.",
      },
    },
    {
      icon: SlidersHorizontal,
      text: {
        en: "Inferences can be corrected.",
        ar: "يمكن تصحيح الاستنتاجات.",
      },
    },
    {
      icon: Tag,
      text: {
        en: "Simulated examples are labeled.",
        ar: "الأمثلة المحاكاة موسومة بوضوح.",
      },
    },
    {
      icon: ShieldCheck,
      text: {
        en: "Ulomis suggests; you decide.",
        ar: "أولوميس يقترح؛ أنت تقرّر.",
      },
    },
    {
      icon: EyeOff,
      text: {
        en: "Nothing from this demo leaves your browser.",
        ar: "لا شيء من هذا العرض يغادر متصفحك.",
      },
    },
    {
      icon: Globe,
      text: {
        en: "This demo doesn't access any live app.",
        ar: "هذا العرض لا يصل إلى أي تطبيق فعلي.",
      },
    },
  ];

/**
 * Scene 10 — compact, close to the demo, deliberately not another marketing
 * section. Every claim here must be true of the shipped code, not aspirational.
 */
export function TrustStrip({ className }: { className?: string }) {
  const t = useText();
  return (
    <ul className={cn("grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {claims.map(({ icon: Icon, text }) => (
        <li key={text.en} className="flex items-start gap-2.5 text-sm text-muted-foreground">
          <Icon className="mt-0.5 size-4 shrink-0 text-primary/70" aria-hidden />
          <span>{t(text)}</span>
        </li>
      ))}
    </ul>
  );
}
