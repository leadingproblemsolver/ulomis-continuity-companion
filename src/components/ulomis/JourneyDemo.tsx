/* eslint-disable prettier/prettier */
import {
  ArrowDown,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  Copy,
  Download,
  FileText,
  GitBranch,
  HelpCircle,
  History,
  Info,
  Link2,
  MessageSquareText,
  ListChecks,
  Pause,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { UButton } from "./Button";
import { UCard } from "./Card";
import { UlomisMark, type UlomisState } from "./UlomisMark";
import {
  copy,
  scenarios,
  t,
  type CorrectionChoice,
  type DemoFragment,
  type DemoScenario,
  type Language,
  type LocalizedText,
  type ScenarioId,
} from "./journey-data";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export type JourneyStage =
  | "recognition"
  | "fragments"
  | "restoring"
  | "reconstructed"
  | "reviewing"
  | "corrected"
  | "continuing"
  | "real-thread";

type ThreadStatus = "active" | "saved" | "deferred" | "completed";

type JourneyState = {
  scenarioId: ScenarioId;
  stage: JourneyStage;
  correction: CorrectionChoice | null;
  evidenceKey: string | null;
  nextActionSelected: boolean;
  threadStatus: ThreadStatus;
  deferUntil: string;
  deferReason: string;
};

type JourneyAction =
  | { type: "SELECT_SCENARIO"; scenarioId: ScenarioId }
  | { type: "START" }
  | { type: "RESTORE" }
  | { type: "RESTORED" }
  | { type: "OPEN_EVIDENCE"; key: string | null }
  | { type: "REVIEW" }
  | { type: "CORRECT"; correction: CorrectionChoice }
  | { type: "CONTINUE" }
  | { type: "REAL_THREAD" }
  | { type: "SET_STATUS"; status: ThreadStatus }
  | { type: "SET_DEFER_DETAILS"; deferUntil: string; deferReason: string }
  | { type: "RESTORE_SESSION"; state: JourneyState }
  | { type: "RESET" };

const initialState: JourneyState = {
  scenarioId: "work",
  stage: "recognition",
  correction: null,
  evidenceKey: null,
  nextActionSelected: false,
  threadStatus: "active",
  deferUntil: "",
  deferReason: "",
};

const JOURNEY_STORAGE_KEY = "ulomis-demo-continuity-v2";
const REAL_THREAD_STORAGE_KEY = "ulomis-real-thread-draft-v1";

function reducer(state: JourneyState, action: JourneyAction): JourneyState {
  switch (action.type) {
    case "SELECT_SCENARIO":
      return {
        ...initialState,
        scenarioId: action.scenarioId,
        stage: "fragments",
      };
    case "START":
      return { ...state, stage: "fragments", threadStatus: "active" };
    case "RESTORE":
      return { ...state, stage: "restoring", correction: null, evidenceKey: null, nextActionSelected: false, threadStatus: "active" };
    case "RESTORED":
      return { ...state, stage: "reconstructed" };
    case "OPEN_EVIDENCE":
      return { ...state, evidenceKey: action.key };
    case "REVIEW":
      return { ...state, stage: "reviewing" };
    case "CORRECT":
      return { ...state, correction: action.correction, stage: "corrected", threadStatus: "active" };
    case "CONTINUE":
      return { ...state, nextActionSelected: true, stage: "continuing", threadStatus: "active" };
    case "REAL_THREAD":
      return { ...state, stage: "real-thread" };
    case "SET_STATUS":
      return { ...state, threadStatus: action.status };
    case "SET_DEFER_DETAILS":
      return { ...state, deferUntil: action.deferUntil, deferReason: action.deferReason };
    case "RESTORE_SESSION":
      return { ...action.state, evidenceKey: null };
    case "RESET":
      return { ...initialState, scenarioId: state.scenarioId, stage: "fragments" };
  }
}

const labels = {
  scenarioIntro: {
    en: "One mechanism, three parts of life",
    ar: "آلية واحدة، في ثلاثة جوانب من الحياة",
  },
  sourceFact: { en: "Source statement", ar: "معلومة من المصدر" },
  userMeaning: { en: "Your stated meaning", ar: "المعنى الذي ذكرته" },
  inference: { en: "Inference", ar: "استنتاج" },
  stale: { en: "Possibly outdated", ar: "قديمة على الأرجح" },
  contradiction: { en: "Sources disagree", ar: "المصادر متعارضة" },
  objective: { en: "What is this?", ar: "ما هذا؟" },
  previous: { en: "Where did I leave it?", ar: "أين توقفت؟" },
  currentState: { en: "Where things stand now", ar: "أين تقف الأمور الآن" },
  changed: { en: "What changed?", ar: "ما الذي تغيّر؟" },
  decided: { en: "What did I decide and why?", ar: "ماذا قررت ولماذا؟" },
  open: { en: "What remains open?", ar: "ما الذي ما زال مفتوحًا؟" },
  next: { en: "What should I do next?", ar: "ماذا أفعل الآن؟" },
  why: { en: "Why is Ulomis showing this?", ar: "لماذا يعرض أولوميس هذا؟" },
  commitments: { en: "Commitments", ar: "الالتزامات" },
  dependencies: { en: "Dependencies", ar: "الاعتماديات" },
  missingInformation: { en: "Missing information", ar: "المعلومات المفقودة" },
  owners: { en: "People responsible", ar: "الأشخاص المسؤولون" },
  operationalDetails: { en: "Show operational details", ar: "اعرض التفاصيل التشغيلية" },
  confidence: { en: "Confidence", ar: "الثقة" },
  sources: { en: "Supporting sources", ar: "المصادر الداعمة" },
  corrected: { en: "The thread has been updated.", ar: "تم تحديث الخيط." },
  suggested: { en: "Suggested next action", ar: "الخطوة التالية المقترحة" },
  notObligation: { en: "A suggestion—not an obligation.", ar: "اقتراح، وليس التزامًا." },
  correct: { en: "Correct", ar: "صحيح" },
  partial: { en: "Partly right", ar: "صحيح جزئيًا" },
  outdated: { en: "Outdated", ar: "قديم" },
  unrelated: { en: "Unrelated", ar: "غير مرتبط" },
  missing: { en: "Something is missing", ar: "هناك شيء مفقود" },
  saveLater: { en: "Save for later", ar: "احفظه لوقت لاحق" },
  defer: { en: "Defer", ar: "أجّل" },
  complete: { en: "Mark complete", ar: "علّمه مكتملًا" },
  exportView: { en: "Export continuity view", ar: "صدّر عرض الاستمرارية" },
  deleteLocal: { en: "Delete local continuity", ar: "احذف الاستمرارية المحلية" },
  resumeThread: { en: "Continue your preserved thread", ar: "تابع خيطك المحفوظ" },
  locallyPreserved: { en: "Preserved in this browser", ar: "محفوظ في هذا المتصفح" },
  viewSources: { en: "View sources", ar: "اعرض المصادر" },
  realTitle: { en: "Give Ulomis one unfinished thread", ar: "أعطِ أولوميس خيطًا غير مكتمل" },
  realBody: {
    en: "Paste the fragments as they already exist. Do not organize them first.",
    ar: "الصق الأجزاء كما هي. لا تنظّمها أولًا.",
  },
  labelOptional: { en: "Short label (optional)", ar: "عنوان قصير (اختياري)" },
  fragmentsLabel: { en: "Messages, notes, or fragments", ar: "رسائل أو ملاحظات أو أجزاء" },
  fileLabel: { en: "Add a .txt, .md, .json, or .csv file", ar: "أضف ملف txt أو md أو json أو csv" },
  reviewPacket: { en: "Review my thread", ar: "راجع خيطي" },
  copyPacket: { en: "Copy thread packet", ar: "انسخ حزمة الخيط" },
  localOnly: {
    en: "This early handoff stays in this browser. It is not analyzed or uploaded. Remove or redact anything you do not want stored on this device.",
    ar: "تبقى هذه الحزمة المبكرة في هذا المتصفح. لا تُحلّل ولا تُرفع. احذف أو أخفِ أي معلومات لا تريد حفظها على هذا الجهاز.",
  },
  packetReady: {
    en: "Your thread is ready for a guided early-access handoff—not a generated continuity view.",
    ar: "خيطك جاهز للتسليم الإرشادي المبكر، وليس عرض استمرارية مُنشأ آليًا.",
  },
  returnTitle: { en: "When you return, you do not start with a blank dashboard.", ar: "عندما تعود، لا تبدأ بلوحة فارغة." },
  previousState: { en: "Previous state", ar: "الحالة السابقة" },
  newFragment: { en: "New fragment", ar: "جزء جديد" },
  stillOpen: { en: "Still open", ar: "ما زال مفتوحًا" },
  trustTitle: { en: "Quiet by design. Clear when it matters.", ar: "هادئ بتصميمه، وواضح حين يلزم." },
  tryAnother: { en: "Try another scenario", ar: "جرّب سيناريو آخر" },
} satisfies Record<string, LocalizedText>;

const correctionOptions: Array<{ value: CorrectionChoice; label: keyof typeof labels }> = [
  { value: "correct", label: "correct" },
  { value: "partial", label: "partial" },
  { value: "outdated", label: "outdated" },
  { value: "unrelated", label: "unrelated" },
  { value: "missing", label: "missing" },
];

function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} data-revealed={visible} className={cn("journey-reveal", className)}>
      {children}
    </div>
  );
}

function getKindLabel(fragment: DemoFragment, language: Language) {
  if (fragment.kind === "fact") return t(labels.userMeaning, language);
  if (fragment.kind === "inference") return t(labels.inference, language);
  if (fragment.kind === "stale") return t(labels.stale, language);
  if (fragment.kind === "contradiction") return t(labels.contradiction, language);
  return t(labels.sourceFact, language);
}

function FragmentCard({
  fragment,
  language,
  connected,
}: {
  fragment: DemoFragment;
  language: Language;
  connected: boolean;
}) {
  const kindClass = {
    source: "fragment-source",
    fact: "fragment-fact",
    inference: "fragment-inference",
    stale: "fragment-stale",
    contradiction: "fragment-contradiction",
  }[fragment.kind];

  return (
    <article
      className={cn(
        "fragment-card relative rounded-3xl border bg-surface p-4 shadow-[var(--shadow-soft)] sm:p-5",
        kindClass,
        connected && fragment.relevant && "is-connected",
        connected && !fragment.relevant && "is-deemphasized",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <MessageSquareText className="size-3.5" aria-hidden />
          <span>{t(fragment.source, language)}</span>
        </div>
        <span className="whitespace-nowrap text-[0.68rem] text-muted-foreground">
          {t(fragment.time, language)}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-foreground">{t(fragment.text, language)}</p>
      <span className="mt-4 inline-flex rounded-full border border-border bg-background/75 px-2.5 py-1 text-[0.65rem] font-semibold text-muted-foreground">
        {getKindLabel(fragment, language)}
      </span>
    </article>
  );
}

function Evidence({
  itemKey,
  sourceIds,
  scenario,
  language,
  openKey,
  onToggle,
}: {
  itemKey: string;
  sourceIds: string[];
  scenario: DemoScenario;
  language: Language;
  openKey: string | null;
  onToggle: (key: string | null) => void;
}) {
  const open = openKey === itemKey;
  const sources = scenario.fragments.filter((fragment) => sourceIds.includes(fragment.id));

  return (
    <div className="mt-3">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-expanded={open}
        onClick={() => onToggle(open ? null : itemKey)}
      >
        <Link2 className="size-3.5" aria-hidden />
        {t(labels.why, language)}
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <ul className="mt-3 space-y-2 rounded-2xl bg-accent/40 p-3" aria-label={t(labels.sources, language)}>
          {sources.map((source) => (
            <li key={source.id} className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">{t(source.source, language)}</span>
              {" · "}
              {t(source.time, language)} — {t(source.text, language)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ResultItem({
  icon,
  label,
  children,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  tone?: "default" | "change" | "open" | "action";
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border p-4 sm:p-5",
        tone === "default" && "border-border bg-background/50",
        tone === "change" && "border-confirmed/50 bg-confirmed/10",
        tone === "open" && "border-openloop/50 bg-openloop/10",
        tone === "action" && "border-primary/40 bg-primary/10",
      )}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-3 text-sm leading-relaxed text-foreground sm:text-base">{children}</div>
    </section>
  );
}

function TrustStrip({ language }: { language: Language }) {
  const items =
    language === "ar"
      ? [
          "المصادر تبقى ظاهرة.",
          "يمكنك تصحيح الاستنتاجات.",
          "الأمثلة المحاكاة معلّمة بوضوح.",
          "أولوميس يقترح؛ وأنت تقرر.",
          "لا يغادر محتوى العرض هذا المتصفح.",
        ]
      : [
          "Sources stay visible.",
          "Inferences can be corrected.",
          "Simulated examples are labeled.",
          "Ulomis suggests; you decide.",
          "Demo content does not leave this browser.",
        ];

  return (
    <section className="border-y border-border bg-accent/30 py-10" aria-labelledby="trust-title">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{language === "ar" ? "الثقة" : "Trust"}</p>
            <h2 id="trust-title" className="mt-2 text-xl font-semibold sm:text-2xl">
              {t(labels.trustTitle, language)}
            </h2>
          </div>
          <ul className="grid gap-3 text-sm sm:grid-cols-2 lg:max-w-2xl">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-confirmed-foreground" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function RealThreadHandoff({ language }: { language: Language }) {
  const [label, setLabel] = useState("");
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [expectedReentryTime, setExpectedReentryTime] = useState("");
  const [sourcesNormallyOpened, setSourcesNormallyOpened] = useState("");
  const [peopleNormallyContacted, setPeopleNormallyContacted] = useState("");
  const [nextActionConfidence, setNextActionConfidence] = useState("");
  const [draftReady, setDraftReady] = useState(false);
  const [draftStorageFailed, setDraftStorageFailed] = useState(false);
  const hasDraft = Boolean(label || content || fileName || expectedReentryTime || sourcesNormallyOpened || peopleNormallyContacted || nextActionConfidence);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(REAL_THREAD_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as {
          label?: string;
          content?: string;
          fileName?: string;
          expectedReentryTime?: string;
          sourcesNormallyOpened?: string;
          peopleNormallyContacted?: string;
          nextActionConfidence?: string;
        };
        setLabel(saved.label ?? "");
        setContent(saved.content ?? "");
        setFileName(saved.fileName ?? "");
        setExpectedReentryTime(saved.expectedReentryTime ?? "");
        setSourcesNormallyOpened(saved.sourcesNormallyOpened ?? "");
        setPeopleNormallyContacted(saved.peopleNormallyContacted ?? "");
        setNextActionConfidence(saved.nextActionConfidence ?? "");
      }
    } catch {
      setDraftStorageFailed(true);
      try { window.localStorage.removeItem(REAL_THREAD_STORAGE_KEY); } catch { /* storage unavailable */ }
    } finally {
      setDraftReady(true);
    }
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    try {
      if (!hasDraft) {
        window.localStorage.removeItem(REAL_THREAD_STORAGE_KEY);
        setDraftStorageFailed(false);
        return;
      }
      window.localStorage.setItem(
        REAL_THREAD_STORAGE_KEY,
        JSON.stringify({ label, content, fileName, expectedReentryTime, sourcesNormallyOpened, peopleNormallyContacted, nextActionConfidence }),
      );
      setDraftStorageFailed(false);
    } catch {
      setDraftStorageFailed(true);
    }
  }, [content, draftReady, expectedReentryTime, fileName, hasDraft, label, nextActionConfidence, peopleNormallyContacted, sourcesNormallyOpened]);

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowed = [".txt", ".md", ".json", ".csv"];
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (file.size > 250_000) {
      toast.error(language === "ar" ? "يجب ألا يتجاوز الملف 250 كيلوبايت." : "Keep the file under 250 KB.");
      event.target.value = "";
      return;
    }
    if (!allowed.includes(extension)) {
      toast.error(language === "ar" ? "استخدم ملف txt أو md أو json أو csv." : "Use a .txt, .md, .json, or .csv file.");
      event.target.value = "";
      return;
    }
    const text = await file.text();
    if (text.length > 100000) {
      toast.error(language === "ar" ? "النص طويل جدًا لهذا التسليم المبكر." : "This text is too long for the early handoff.");
      event.target.value = "";
      return;
    }
    setContent((current) => (current ? `${current}\n\n${text}`.slice(0, 100000) : text));
    setFileName(file.name);
    setReviewed(false);
  }

  function review() {
    if (!content.trim()) {
      toast.error(language === "ar" ? "أضف خيطًا أولًا." : "Add a thread first.");
      return;
    }
    setReviewed(true);
    trackEvent("real_thread_started", { language });
  }

  function buildPacket() {
    return JSON.stringify(
      {
        packet_type: "ulomis_assisted_trial_intake",
        created_at: new Date().toISOString(),
        label: label || null,
        source_file: fileName || null,
        thread_fragments: content,
        baseline: {
          expected_reentry_time: expectedReentryTime || null,
          sources_normally_opened: sourcesNormallyOpened || null,
          people_normally_contacted: peopleNormallyContacted || null,
          next_action_confidence: nextActionConfidence || null,
        },
        notice: "Real, user-provided thread. No continuity analysis has been generated by this demo.",
      },
      null,
      2,
    );
  }

  async function copyPacket() {
    try {
      await navigator.clipboard.writeText(buildPacket());
      toast.success(language === "ar" ? "تم نسخ حزمة الخيط." : "Thread packet copied.");
    } catch {
      toast.error(language === "ar" ? "تعذر النسخ تلقائيًا." : "Could not copy automatically.");
    }
  }

  function downloadPacket() {
    const blob = new Blob([buildPacket()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ulomis-thread-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function clearDraft() {
    setLabel("");
    setContent("");
    setFileName("");
    setExpectedReentryTime("");
    setSourcesNormallyOpened("");
    setPeopleNormallyContacted("");
    setNextActionConfidence("");
    setReviewed(false);
    try { window.localStorage.removeItem(REAL_THREAD_STORAGE_KEY); } catch { /* storage unavailable */ }
    setDraftStorageFailed(false);
    trackEvent("local_data_deleted", { language });
  }

  return (
    <section id="real-thread" className="scroll-mt-24 py-16 sm:py-24" aria-labelledby="real-thread-title">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <Reveal>
          <div className="max-w-lg">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" aria-hidden />
              {t(copy.giveReal, language)}
            </span>
            <h2 id="real-thread-title" className="mt-5 text-3xl font-semibold leading-tight sm:text-4xl">
              {t(labels.realTitle, language)}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t(labels.realBody, language)}
            </p>
            <div className="mt-8 flex items-start gap-3 rounded-2xl border border-border bg-accent/40 p-4 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <p>{t(labels.localOnly, language)}</p>
            </div>
            {draftStorageFailed && (
              <div className="mt-3 rounded-2xl border border-correction/50 bg-correction/10 p-4 text-sm text-foreground" role="status">
                {language === "ar"
                  ? "منع المتصفح الحفظ المحلي. نزّل حزمة الخيط قبل مغادرة الصفحة إذا أردت الاحتفاظ بها."
                  : "This browser blocked local saving. Download the thread packet before leaving if you want to keep it."}
              </div>
            )}
          </div>
        </Reveal>

        <Reveal>
          <UCard variant="raised" padding="lg">
            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">{t(labels.labelOptional, language)}</span>
                <input
                  value={label}
                  maxLength={120}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    setLabel(event.target.value);
                    setReviewed(false);
                  }}
                  className="w-full rounded-2xl border border-input bg-surface px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                  placeholder={language === "ar" ? "تجديد تسجيل السيارة" : "Client portal launch"}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">{t(labels.fragmentsLabel, language)}</span>
                <textarea
                  value={content}
                  maxLength={100000}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                    setContent(event.target.value);
                    setReviewed(false);
                  }}
                  className="min-h-44 w-full resize-y rounded-2xl border border-input bg-surface px-4 py-3 text-base leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                  placeholder={
                    language === "ar"
                      ? "الصق الرسائل والملاحظات والقرارات كما هي..."
                      : "Paste the messages, notes, and decisions as they already exist..."
                  }
                />
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-border bg-background/70 p-4 transition-colors hover:border-primary/50">
                <Upload className="size-5 text-primary" aria-hidden />
                <span className="text-sm">
                  {fileName || t(labels.fileLabel, language)}
                </span>
                <input className="sr-only" type="file" accept=".txt,.md,.json,.csv" onChange={readFile} />
              </label>

              <details className="rounded-2xl border border-border bg-background/55 p-4">
                <summary className="cursor-pointer text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {language === "ar" ? "خط أساس اختياري لقياس إعادة الدخول" : "Optional baseline for a real re-entry test"}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {language === "ar"
                    ? "هذه الأسئلة لا تغيّر العرض. وهي تساعد على مقارنة الجهد المعتاد بالنتيجة الفعلية لاحقًا."
                    : "These questions do not change the demo. They make a later before/after comparison possible."}
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm">
                    <span className="mb-1.5 block font-semibold">{language === "ar" ? "الوقت المتوقع عادةً لإعادة بناء الخيط" : "Expected time to reconstruct this normally"}</span>
                    <select value={expectedReentryTime} onChange={(event: ChangeEvent<HTMLSelectElement>) => setExpectedReentryTime(event.target.value)} className="w-full rounded-xl border border-input bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring">
                      <option value="">{language === "ar" ? "غير محدد" : "Not set"}</option>
                      <option value="under-5">{language === "ar" ? "أقل من 5 دقائق" : "Under 5 minutes"}</option>
                      <option value="5-15">5–15</option>
                      <option value="15-30">15–30</option>
                      <option value="30-plus">{language === "ar" ? "أكثر من 30 دقيقة" : "30+ minutes"}</option>
                    </select>
                  </label>
                  <label className="text-sm">
                    <span className="mb-1.5 block font-semibold">{language === "ar" ? "عدد المصادر التي ستفتحها عادةً" : "Sources normally reopened"}</span>
                    <select value={sourcesNormallyOpened} onChange={(event: ChangeEvent<HTMLSelectElement>) => setSourcesNormallyOpened(event.target.value)} className="w-full rounded-xl border border-input bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring">
                      <option value="">{language === "ar" ? "غير محدد" : "Not set"}</option>
                      <option value="1">1</option>
                      <option value="2-3">2–3</option>
                      <option value="4-plus">4+</option>
                    </select>
                  </label>
                  <label className="text-sm">
                    <span className="mb-1.5 block font-semibold">{language === "ar" ? "عدد الأشخاص الذين ستسألهم عادةً" : "People normally contacted"}</span>
                    <select value={peopleNormallyContacted} onChange={(event: ChangeEvent<HTMLSelectElement>) => setPeopleNormallyContacted(event.target.value)} className="w-full rounded-xl border border-input bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring">
                      <option value="">{language === "ar" ? "غير محدد" : "Not set"}</option>
                      <option value="0">0</option>
                      <option value="1">1</option>
                      <option value="2-plus">2+</option>
                    </select>
                  </label>
                  <label className="text-sm">
                    <span className="mb-1.5 block font-semibold">{language === "ar" ? "ثقتك الحالية بالخطوة التالية" : "Current next-action confidence"}</span>
                    <select value={nextActionConfidence} onChange={(event: ChangeEvent<HTMLSelectElement>) => setNextActionConfidence(event.target.value)} className="w-full rounded-xl border border-input bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring">
                      <option value="">{language === "ar" ? "غير محدد" : "Not set"}</option>
                      <option value="low">{language === "ar" ? "منخفضة" : "Low"}</option>
                      <option value="medium">{language === "ar" ? "متوسطة" : "Medium"}</option>
                      <option value="high">{language === "ar" ? "مرتفعة" : "High"}</option>
                    </select>
                  </label>
                </div>
              </details>

              <div className="flex flex-wrap gap-3">
                <UButton type="button" variant="thread" size="lg" onClick={review}>
                  {t(labels.reviewPacket, language)}
                </UButton>
                {hasDraft && (
                  <UButton
                    type="button"
                    variant="ghost"
                    size="lg"
                    onClick={clearDraft}
                  >
                    {language === "ar" ? "مسح" : "Clear"}
                  </UButton>
                )}
              </div>

              {reviewed && (
                <div className="animate-rise rounded-3xl border border-confirmed/50 bg-confirmed/10 p-5" aria-live="polite">
                  <div className="flex items-start gap-3">
                    <UlomisMark language={language} state="gathering" size={44} />
                    <div>
                      <h3 className="font-semibold">{t(labels.packetReady, language)}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {language === "ar"
                          ? "راجع النص أدناه. لم ينشئ أولوميس ادعاءات أو قرارات من محتواك."
                          : "Review the text below. Ulomis has not generated claims or decisions from your content."}
                      </p>
                    </div>
                  </div>
                  <pre className="mt-4 max-h-56 overflow-auto whitespace-pre-wrap rounded-2xl bg-background/75 p-4 text-xs leading-relaxed">
                    {label ? `${label}\n\n` : ""}
                    {content}
                  </pre>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <UButton type="button" variant="outline" onClick={copyPacket}>
                      <Copy className="size-4" aria-hidden />
                      {t(labels.copyPacket, language)}
                    </UButton>
                    <UButton type="button" variant="outline" onClick={downloadPacket}>
                      <Download className="size-4" aria-hidden />
                      {language === "ar" ? "نزّل حزمة الخيط" : "Download thread packet"}
                    </UButton>
                  </div>
                </div>
              )}
            </div>
          </UCard>
        </Reveal>
      </div>
    </section>
  );
}

export function JourneyDemo({ language }: { language: Language }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [stateReady, setStateReady] = useState(false);
  const [journeyStorageFailed, setJourneyStorageFailed] = useState(false);
  const scenario = useMemo(
    () => scenarios.find((item) => item.id === state.scenarioId) ?? scenarios[0],
    [state.scenarioId],
  );
  const demoRef = useRef<HTMLElement | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);
  const correctionRef = useRef<HTMLElement | null>(null);
  const skipNextPersistRef = useRef(false);
  const connected = ["restoring", "reconstructed", "reviewing", "corrected", "continuing", "real-thread"].includes(
    state.stage,
  );
  const resultVisible = ["reconstructed", "reviewing", "corrected", "continuing", "real-thread"].includes(state.stage);
  const correctionOutcome = state.correction ? scenario.correctionOutcomes[state.correction] : null;
  const currentState = correctionOutcome ? correctionOutcome.updatedState : scenario.currentState;
  const nextAction = correctionOutcome ? correctionOutcome.nextAction : scenario.suggestedNextAction;

  const landingTracked = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(JOURNEY_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<JourneyState>;
        const validScenario = scenarios.some((item) => item.id === saved.scenarioId);
        const validStage = ["recognition", "fragments", "restoring", "reconstructed", "reviewing", "corrected", "continuing", "real-thread"].includes(saved.stage ?? "");
        const validCorrection = saved.correction === null || ["correct", "partial", "outdated", "unrelated", "missing"].includes(saved.correction ?? "");
        const validStatus = ["active", "saved", "deferred", "completed"].includes(saved.threadStatus ?? "");
        if (validScenario && validStage && validCorrection && validStatus) {
          dispatch({
            type: "RESTORE_SESSION",
            state: {
              scenarioId: saved.scenarioId as ScenarioId,
              stage: saved.stage as JourneyStage,
              correction: (saved.correction ?? null) as CorrectionChoice | null,
              evidenceKey: null,
              nextActionSelected: Boolean(saved.nextActionSelected),
              threadStatus: saved.threadStatus as ThreadStatus,
              deferUntil: typeof saved.deferUntil === "string" ? saved.deferUntil : "",
              deferReason: typeof saved.deferReason === "string" ? saved.deferReason : "",
            },
          });
          if (saved.nextActionSelected) {
            trackEvent("thread_reopened", { scenario: saved.scenarioId as ScenarioId });
          }
        }
      }
    } catch {
      setJourneyStorageFailed(true);
      try { window.localStorage.removeItem(JOURNEY_STORAGE_KEY); } catch { /* storage unavailable */ }
    } finally {
      setStateReady(true);
    }
  }, []);

  useEffect(() => {
    if (!stateReady) return;
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    try {
      if (state.stage === "recognition" && !state.nextActionSelected) {
        window.localStorage.removeItem(JOURNEY_STORAGE_KEY);
        setJourneyStorageFailed(false);
        return;
      }
      const persistable = { ...state, evidenceKey: null };
      window.localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(persistable));
      setJourneyStorageFailed(false);
    } catch {
      setJourneyStorageFailed(true);
    }
  }, [state, stateReady]);

  useEffect(() => {
    if (landingTracked.current) return;
    landingTracked.current = true;
    trackEvent("landing_viewed", { language });
  }, [language]);

  useEffect(() => {
    if (state.stage !== "restoring") return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      dispatch({ type: "RESTORED" });
      trackEvent("restoration_completed", { language, scenario: scenario.id });
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" }));
    }, reducedMotion ? 50 : 850);
    return () => window.clearTimeout(timer);
  }, [language, scenario.id, state.stage]);

  function selectScenario(id: ScenarioId) {
    dispatch({ type: "SELECT_SCENARIO", scenarioId: id });
    trackEvent("scenario_selected", { language, scenario: id });
    requestAnimationFrame(() => demoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function startDemo() {
    dispatch({ type: "START" });
    trackEvent("demo_started", { language, scenario: scenario.id });
    requestAnimationFrame(() => demoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function restore() {
    dispatch({ type: "RESTORE" });
    trackEvent("demo_started", { language, scenario: scenario.id });
  }

  function openEvidence(key: string | null) {
    dispatch({ type: "OPEN_EVIDENCE", key });
    if (key) trackEvent("why_opened", { language, scenario: scenario.id });
  }

  function chooseCorrection(choice: CorrectionChoice) {
    dispatch({ type: "CORRECT", correction: choice });
    const eventName = choice === "correct" ? "item_confirmed" : choice === "unrelated" ? "item_dismissed" : "item_corrected";
    trackEvent(eventName, { language, scenario: scenario.id, correctionType: choice });
    if (scenario.id === "household") {
      trackEvent("contradiction_resolved", { language, scenario: scenario.id, correctionType: choice });
    }
  }

  function continueThread() {
    dispatch({ type: "CONTINUE" });
    trackEvent("next_action_selected", { language, scenario: scenario.id });
    trackEvent("demo_first_value_completed", { language, scenario: scenario.id });
  }

  function setThreadStatus(status: ThreadStatus) {
    dispatch({ type: "SET_STATUS", status });
    if (status === "deferred" && !state.deferUntil) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dispatch({ type: "SET_DEFER_DETAILS", deferUntil: tomorrow.toISOString().slice(0, 10), deferReason: state.deferReason });
    }
    const event = status === "saved" ? "thread_saved" : status === "deferred" ? "thread_deferred" : status === "completed" ? "thread_completed" : "thread_resumed";
    trackEvent(event, { language, scenario: scenario.id });
    toast.success(
      status === "saved"
        ? language === "ar" ? "تم حفظ الخيط في هذا المتصفح." : "Thread preserved in this browser."
        : status === "deferred"
          ? language === "ar" ? "تم تأجيل الخيط مع الاحتفاظ بحالته." : "Thread deferred with its state preserved."
          : status === "completed"
            ? language === "ar" ? "تم إكمال الخيط مع الاحتفاظ بتاريخه." : "Thread completed with its history preserved."
            : language === "ar" ? "تمت متابعة الخيط." : "Thread resumed.",
    );
  }

  function buildContinuityExport() {
    return {
      schema: "ulomis_continuity_view_v1",
      exported_at: new Date().toISOString(),
      scenario: scenario.id,
      thread: t(scenario.threadTitle, language),
      objective: t(scenario.objective, language),
      previous_state: t(scenario.previousState, language),
      current_state: t(currentState, language),
      latest_meaningful_changes: scenario.changes.map((change) => t(change.text, language)),
      decisions: [{ statement: t(scenario.decision.statement, language), rationale: t(scenario.decision.rationale, language) }],
      commitments: scenario.commitments.map((item) => ({ text: t(item.text, language), owner: t(item.owner, language), status: t(item.status, language) })),
      dependencies: scenario.dependencies.map((item) => ({ text: t(item.text, language), owner: t(item.owner, language), status: t(item.status, language) })),
      unresolved_items: [t(scenario.openLoop.statement, language)],
      missing_information: scenario.missingInformation.map((item) => ({ text: t(item.text, language), impact: t(item.impact, language) })),
      next_action: t(nextAction, language),
      owners: scenario.owners.map((owner) => t(owner, language)),
      correction: state.correction,
      correction_update: correctionOutcome ? t(correctionOutcome.updatedState, language) : null,
      status: state.threadStatus,
      defer_until: state.deferUntil || null,
      defer_reason: state.deferReason || null,
      sources: scenario.fragments.filter((fragment) => fragment.relevant).map((fragment) => ({ id: fragment.id, source: t(fragment.source, language), time: t(fragment.time, language), text: t(fragment.text, language), kind: fragment.kind })),
      confidence: scenario.uncertainItem.confidence,
      simulated: true,
    };
  }

  function exportContinuity() {
    const blob = new Blob([JSON.stringify(buildContinuityExport(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ulomis-continuity-${scenario.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    trackEvent("continuity_exported", { language, scenario: scenario.id });
  }

  function deleteLocalContinuity() {
    skipNextPersistRef.current = true;
    try { window.localStorage.removeItem(JOURNEY_STORAGE_KEY); } catch { /* storage unavailable */ }
    setJourneyStorageFailed(false);
    dispatch({ type: "RESET" });
    trackEvent("local_data_deleted", { language, scenario: scenario.id });
    toast.success(language === "ar" ? "تم حذف حالة العرض المحلية." : "Local demo continuity deleted.");
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  const markState: UlomisState =
    state.threadStatus === "completed"
      ? "completed"
      : state.stage === "recognition"
        ? "fragmented"
      : state.stage === "fragments"
        ? "gathering"
        : state.stage === "restoring"
          ? "connecting"
          : state.stage === "reviewing"
            ? scenario.id === "household"
              ? "contradicted"
              : "uncertain"
            : state.stage === "corrected"
              ? "corrected"
              : state.stage === "continuing" || state.stage === "real-thread"
                ? "continued"
                : "restored";

  return (
    <>
      <section className="relative overflow-hidden" aria-labelledby="hero-title">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: "var(--gradient-veil)" }} />
        <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" />
              {t(copy.brandTagline, language)}
            </p>
            <h1 id="hero-title" className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.08] sm:text-6xl">
              {t(copy.heroTitle, language)}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-xl">
              {t(copy.heroBody, language)}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <UButton size="lg" variant="thread" onClick={startDemo}>
                {t(copy.restoreThread, language)}
                <ArrowDown className="size-4" aria-hidden />
              </UButton>
              <span className="text-sm text-muted-foreground">
                {language === "ar" ? "من دون تسجيل أو ربط تطبيقات" : "No signup or app connections"}
              </span>
            </div>
            {stateReady && state.nextActionSelected && (
              <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-confirmed/50 bg-confirmed/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">{t(labels.resumeThread, language)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t(scenario.threadTitle, language)} · {t(labels.locallyPreserved, language)}
                  </p>
                </div>
                <UButton
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setThreadStatus("active");
                    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }));
                  }}
                >
                  {t(copy.continue, language)}
                </UButton>
              </div>
            )}
            {journeyStorageFailed && (
              <p className="mt-4 rounded-2xl border border-correction/50 bg-correction/10 p-3 text-sm text-foreground" role="status">
                {language === "ar"
                  ? "لا يستطيع هذا المتصفح حفظ حالة العرض محليًا. استخدم التصدير قبل المغادرة."
                  : "This browser cannot preserve the demo state locally. Use export before leaving."}
              </p>
            )}
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="relative rounded-[3rem] border border-border/70 bg-surface/75 p-8 shadow-[var(--shadow-lift)] sm:p-12">
              <div className="absolute -inset-10 -z-10 rounded-full bg-sky/25 blur-3xl" aria-hidden />
              <UlomisMark language={language} state={markState} size="min(62vw, 330px)" title={language === "ar" ? "أولوميس والخيط المتناثر" : "Ulomis with a fragmented thread"} />
              <p className="mt-4 max-w-xs text-center text-sm leading-relaxed text-muted-foreground">
                {language === "ar"
                  ? "الخيط نفسه يتغيّر مع حالة القصة؛ وليس مجرد شعار متحرك."
                  : "The ribbon changes with the thread state; it is not decorative motion."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section ref={demoRef} id="demo" className="scroll-mt-24 border-y border-border bg-accent/25 py-16 sm:py-24" aria-labelledby="scenario-heading">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{t(copy.guidedDemo, language)}</p>
                <h2 id="scenario-heading" className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
                  {t(labels.scenarioIntro, language)}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {t(copy.simulatedDisclosure, language)}
                </p>
              </div>
              <div className="inline-flex w-full rounded-2xl border border-border bg-surface p-1.5 sm:w-auto" role="tablist" aria-label={t(copy.scenarios, language)}>
                {scenarios.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={state.scenarioId === item.id}
                    onClick={() => selectScenario(item.id)}
                    className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-selected:bg-primary aria-selected:text-primary-foreground sm:flex-none"
                  >
                    {t(item.label, language)}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal className="mt-10">
            <div className="grid gap-8 lg:grid-cols-[0.68fr_1.32fr] lg:items-start">
              <div className="lg:sticky lg:top-24">
                <UCard variant="raised" padding="lg">
                  <div className="flex items-start gap-4">
                    <UlomisMark language={language} state={markState} size={64} />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                        {t(scenario.label, language)}
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold">{t(scenario.threadTitle, language)}</h3>
                    </div>
                  </div>
                  <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                    {t(scenario.recognition, language)}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {t(scenario.threadDescription, language)}
                  </p>
                  <div className="mt-7 rounded-2xl border border-openloop/40 bg-openloop/10 p-4">
                    <p className="font-display text-lg font-semibold">{t(copy.infoSurvived, language)}</p>
                  </div>
                  <UButton className="mt-7 w-full" size="lg" variant="thread" onClick={restore} disabled={state.stage === "restoring"}>
                    {state.stage === "restoring"
                      ? language === "ar"
                        ? "يجري وصل الخيط..."
                        : "Connecting the thread..."
                      : t(copy.letRestore, language)}
                  </UButton>
                </UCard>
              </div>

              <div className={cn("fragment-board relative grid gap-4 sm:grid-cols-2", connected && "is-restored")}>
                {scenario.fragments.map((fragment) => (
                  <FragmentCard key={fragment.id} fragment={fragment} language={language} connected={connected} />
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {resultVisible && (
        <section ref={resultRef} className="scroll-mt-24 py-16 sm:py-24" aria-labelledby="continuity-title">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <UCard variant="thread" padding="lg" className="overflow-visible">
                <div className="flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <UlomisMark language={language} state={markState} size={72} tail />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                        {t(copy.guidedDemo, language)}
                      </p>
                      <h2 id="continuity-title" className="mt-2 text-3xl font-semibold sm:text-4xl">
                        {t(copy.whereLeft, language)}
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {t(scenario.threadTitle, language)} · {language === "ar" ? "آخر تأكيد قبل 4 أيام" : "Last confirmed 4 days ago"}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-confirmed/50 bg-confirmed/20 px-3 py-1.5 text-xs font-semibold text-confirmed-foreground">
                    <CheckCircle2 className="size-3.5" aria-hidden />
                    {language === "ar" ? "حالة قابلة للمراجعة" : "Reviewable state"}
                  </span>
                </div>

                <div className="mt-7 grid gap-4 md:grid-cols-2">
                  <ResultItem icon={<FileText className="size-4" />} label={t(labels.objective, language)}>
                    <p>{t(scenario.objective, language)}</p>
                    <Evidence itemKey="objective" sourceIds={scenario.objectiveSourceIds} scenario={scenario} language={language} openKey={state.evidenceKey} onToggle={openEvidence} />
                  </ResultItem>

                  <ResultItem icon={<History className="size-4" />} label={t(labels.previous, language)}>
                    <p>{t(scenario.previousState, language)}</p>
                    <Evidence itemKey="previous-state" sourceIds={scenario.previousStateSourceIds} scenario={scenario} language={language} openKey={state.evidenceKey} onToggle={openEvidence} />
                  </ResultItem>

                  <ResultItem icon={<ArrowRight className="size-4" />} label={t(labels.currentState, language)} tone="change">
                    <p>{t(currentState, language)}</p>
                    <Evidence itemKey="current-state" sourceIds={scenario.currentStateSourceIds} scenario={scenario} language={language} openKey={state.evidenceKey} onToggle={openEvidence} />
                  </ResultItem>

                  <ResultItem icon={<RotateCcw className="size-4" />} label={t(labels.changed, language)} tone="change">
                    <ul className="space-y-3">
                      {scenario.changes.map((change, index) => (
                        <li key={t(change.text, language)}>
                          <p>{t(change.text, language)}</p>
                          <Evidence
                            itemKey={`change-${index}`}
                            sourceIds={change.sourceIds}
                            scenario={scenario}
                            language={language}
                            openKey={state.evidenceKey}
                            onToggle={openEvidence}
                          />
                        </li>
                      ))}
                    </ul>
                  </ResultItem>

                  <ResultItem icon={<Check className="size-4" />} label={t(labels.decided, language)}>
                    <p className="font-semibold">{t(scenario.decision.statement, language)}</p>
                    <p className="mt-2 text-muted-foreground">{t(scenario.decision.rationale, language)}</p>
                    <Evidence
                      itemKey="decision"
                      sourceIds={scenario.decision.sourceIds}
                      scenario={scenario}
                      language={language}
                      openKey={state.evidenceKey}
                      onToggle={openEvidence}
                    />
                  </ResultItem>

                  <ResultItem icon={<CircleAlert className="size-4" />} label={t(labels.open, language)} tone="open">
                    <p>{t(scenario.openLoop.statement, language)}</p>
                    <Evidence
                      itemKey="open-loop"
                      sourceIds={scenario.openLoop.sourceIds}
                      scenario={scenario}
                      language={language}
                      openKey={state.evidenceKey}
                      onToggle={openEvidence}
                    />
                  </ResultItem>

                  <ResultItem icon={<ArrowRight className="size-4" />} label={t(labels.next, language)} tone="action">
                    <p className="text-lg font-semibold">{t(nextAction, language)}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{t(labels.notObligation, language)}</p>
                    <Evidence itemKey="next-action" sourceIds={scenario.nextActionSourceIds} scenario={scenario} language={language} openKey={state.evidenceKey} onToggle={openEvidence} />
                  </ResultItem>
                </div>

                <details className="mt-5 rounded-3xl border border-border bg-background/45 p-5">
                  <summary className="cursor-pointer font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {t(labels.operationalDetails, language)}
                  </summary>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <ResultItem icon={<ListChecks className="size-4" />} label={t(labels.commitments, language)}>
                      <ul className="space-y-3">
                        {scenario.commitments.map((item, index) => (
                          <li key={t(item.text, language)}>
                            <p className="font-semibold">{t(item.text, language)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{t(item.owner, language)} · {t(item.status, language)}</p>
                            <Evidence itemKey={`commitment-${index}`} sourceIds={item.sourceIds} scenario={scenario} language={language} openKey={state.evidenceKey} onToggle={openEvidence} />
                          </li>
                        ))}
                      </ul>
                    </ResultItem>
                    <ResultItem icon={<GitBranch className="size-4" />} label={t(labels.dependencies, language)}>
                      <ul className="space-y-3">
                        {scenario.dependencies.map((item, index) => (
                          <li key={t(item.text, language)}>
                            <p className="font-semibold">{t(item.text, language)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{t(item.owner, language)} · {t(item.status, language)}</p>
                            <Evidence itemKey={`dependency-${index}`} sourceIds={item.sourceIds} scenario={scenario} language={language} openKey={state.evidenceKey} onToggle={openEvidence} />
                          </li>
                        ))}
                      </ul>
                    </ResultItem>
                    <ResultItem icon={<HelpCircle className="size-4" />} label={t(labels.missingInformation, language)} tone="open">
                      <ul className="space-y-3">
                        {scenario.missingInformation.map((item) => (
                          <li key={t(item.text, language)}>
                            <p className="font-semibold">{t(item.text, language)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{t(item.impact, language)}</p>
                          </li>
                        ))}
                      </ul>
                    </ResultItem>
                    <ResultItem icon={<Users className="size-4" />} label={t(labels.owners, language)}>
                      <ul className="flex flex-wrap gap-2">
                        {scenario.owners.map((owner) => (
                          <li key={t(owner, language)} className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold">{t(owner, language)}</li>
                        ))}
                      </ul>
                    </ResultItem>
                  </div>
                </details>

                {state.stage === "reconstructed" && (
                  <div className="mt-7 flex flex-col gap-3 rounded-3xl border border-openloop/50 bg-openloop/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">{t(copy.checkReconstruction, language)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {language === "ar" ? "هناك رابط واحد يحتاج إلى تأكيدك." : "One connection still needs your confirmation."}
                      </p>
                    </div>
                    <UButton
                      variant="outline"
                      onClick={() => {
                        dispatch({ type: "REVIEW" });
                        requestAnimationFrame(() => correctionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
                      }}
                    >
                      {language === "ar" ? "راجع الرابط" : "Review the connection"}
                    </UButton>
                  </div>
                )}

                {(state.stage === "corrected" || state.stage === "continuing" || state.stage === "real-thread") && (
                  <div className="mt-7 rounded-3xl border border-confirmed/50 bg-confirmed/10 p-5" aria-live="polite">
                    <div className="flex items-start gap-3">
                      <UlomisMark language={language} state="corrected" size={44} />
                      <div>
                        <p className="font-semibold">{t(labels.corrected, language)}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {state.correction === "correct"
                            ? language === "ar"
                              ? "تم تأكيد الاستنتاج مع الاحتفاظ بمصادره."
                              : "The inference is confirmed and its sources remain visible."
                            : language === "ar"
                              ? "تم الاحتفاظ بالاستنتاج الأصلي وتصحيحك كسجلين منفصلين."
                              : "The original inference and your correction are preserved as separate records."}
                        </p>
                        {correctionOutcome && (
                          <p className="mt-3 rounded-xl border border-border bg-background/70 p-3 text-sm font-semibold text-foreground">
                            {t(correctionOutcome.updatedState, language)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </UCard>
            </Reveal>
          </div>
        </section>
      )}

      {state.stage === "reviewing" && (
        <section ref={correctionRef} className="scroll-mt-24 bg-accent/30 py-16 sm:py-20" aria-labelledby="correction-title">
          <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <UCard variant="raised" padding="lg">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  <UlomisMark language={language} state={scenario.id === "household" ? "contradicted" : "uncertain"} size={84} />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-openloop/50 bg-openloop/15 px-3 py-1 text-xs font-semibold text-openloop-foreground">
                        {t(labels.inference, language)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t(labels.confidence, language)} {Math.round(scenario.uncertainItem.confidence * 100)}%
                      </span>
                    </div>
                    <h2 id="correction-title" className="mt-4 text-2xl font-semibold leading-snug sm:text-3xl">
                      {t(scenario.uncertainItem.statement, language)}
                    </h2>
                    <Evidence
                      itemKey="uncertain"
                      sourceIds={scenario.uncertainItem.sourceIds}
                      scenario={scenario}
                      language={language}
                      openKey={state.evidenceKey}
                      onToggle={openEvidence}
                    />
                    <div className="mt-7 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                      {correctionOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => chooseCorrection(option.value)}
                          className="rounded-2xl border border-border bg-surface px-3 py-3 text-sm font-semibold outline-none transition-all hover:border-primary/40 hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {t(labels[option.label], language)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </UCard>
            </Reveal>
          </div>
        </section>
      )}

      {(state.stage === "corrected" || state.stage === "continuing" || state.stage === "real-thread") && (
        <section className="py-16 sm:py-20" aria-labelledby="continue-title">
          <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <div className="rounded-[2rem] border border-primary/30 bg-primary/10 p-6 shadow-[var(--shadow-soft)] sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <UlomisMark language={language} state={state.stage === "continuing" || state.stage === "real-thread" ? "continued" : "corrected"} size={68} tail />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                        {t(labels.suggested, language)}
                      </p>
                      <h2 id="continue-title" className="mt-2 max-w-2xl text-2xl font-semibold leading-snug">
                        {t(nextAction, language)}
                      </h2>
                    </div>
                  </div>
                  {!state.nextActionSelected ? (
                    <UButton size="lg" variant="thread" onClick={continueThread}>
                      {t(copy.continue, language)}
                    </UButton>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full border border-confirmed/50 bg-confirmed/20 px-4 py-2 text-sm font-semibold text-confirmed-foreground" aria-live="polite">
                      <CheckCircle2 className="size-4" aria-hidden />
                      {state.threadStatus === "saved"
                        ? language === "ar" ? "الخيط محفوظ في هذا المتصفح" : "Thread preserved in this browser"
                        : state.threadStatus === "deferred"
                          ? language === "ar" ? "الخيط مؤجل مع حفظ حالته" : "Thread deferred with state preserved"
                          : state.threadStatus === "completed"
                            ? language === "ar" ? "اكتمل الخيط مع حفظ تاريخه" : "Thread complete with history preserved"
                            : language === "ar" ? "أنت تتابع من هنا" : "You are continuing from here"}
                    </span>
                  )}
                </div>

                {state.nextActionSelected && (
                  <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-5">
                    <UButton variant={state.threadStatus === "saved" ? "outline" : "ghost"} size="sm" onClick={() => setThreadStatus("saved")}>
                      <Save className="size-4" /> {t(labels.saveLater, language)}
                    </UButton>
                    <UButton variant={state.threadStatus === "deferred" ? "outline" : "ghost"} size="sm" onClick={() => setThreadStatus("deferred")}>
                      <Pause className="size-4" /> {t(labels.defer, language)}
                    </UButton>
                    <UButton variant={state.threadStatus === "completed" ? "outline" : "ghost"} size="sm" onClick={() => setThreadStatus("completed")}>
                      <Check className="size-4" /> {t(labels.complete, language)}
                    </UButton>
                    <UButton variant="ghost" size="sm" onClick={() => openEvidence(state.evidenceKey ? null : "decision")}>
                      <Link2 className="size-4" /> {t(labels.viewSources, language)}
                    </UButton>
                    <UButton variant="ghost" size="sm" onClick={exportContinuity}>
                      <Download className="size-4" /> {t(labels.exportView, language)}
                    </UButton>
                    <UButton variant="ghost" size="sm" onClick={deleteLocalContinuity}>
                      <Trash2 className="size-4" /> {t(labels.deleteLocal, language)}
                    </UButton>
                    <UButton
                      variant="outline"
                      size="sm"
                      className="sm:ms-auto"
                      onClick={() => {
                        dispatch({ type: "REAL_THREAD" });
                        document.getElementById("real-thread")?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      {t(copy.giveReal, language)}
                    </UButton>
                  </div>
                )}

                {state.nextActionSelected && state.threadStatus === "deferred" && (
                  <div className="mt-5 grid gap-4 rounded-2xl border border-openloop/50 bg-openloop/10 p-4 sm:grid-cols-2">
                    <label className="text-sm">
                      <span className="mb-1.5 block font-semibold">{language === "ar" ? "متى يظهر الخيط مرة أخرى؟" : "When should this thread return?"}</span>
                      <input
                        type="date"
                        value={state.deferUntil}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => dispatch({ type: "SET_DEFER_DETAILS", deferUntil: event.target.value, deferReason: state.deferReason })}
                        className="w-full rounded-xl border border-input bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1.5 block font-semibold">{language === "ar" ? "لماذا تم التأجيل؟" : "Why is it deferred?"}</span>
                      <input
                        value={state.deferReason}
                        maxLength={200}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => dispatch({ type: "SET_DEFER_DETAILS", deferUntil: state.deferUntil, deferReason: event.target.value })}
                        placeholder={language === "ar" ? "مثال: بانتظار رد المراجع" : "Example: waiting for the reviewer"}
                        className="w-full rounded-xl border border-input bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
                      />
                    </label>
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      <TrustStrip language={language} />

      {state.nextActionSelected && (
        <section className="py-16 sm:py-20" aria-labelledby="return-title">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
              <div>
                <UlomisMark language={language} state="continued" size={86} tail />
                <h2 id="return-title" className="mt-5 text-3xl font-semibold leading-tight">
                  {t(labels.returnTitle, language)}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  {language === "ar"
                    ? "يعرض أولوميس الجزء الجديد وما تغيّر وما بقي مفتوحًا، بدل إجبارك على إعادة بناء القصة."
                    : "Ulomis shows the new fragment, what changed, and what remains open instead of making you reconstruct the story."}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ResultItem icon={<History className="size-4" />} label={t(labels.previousState, language)}>
                  {t(scenario.previousState, language)}
                </ResultItem>
                <ResultItem icon={<MessageSquareText className="size-4" />} label={t(labels.newFragment, language)} tone="change">
                  {t(scenario.returnPreview.newFragment, language)}
                </ResultItem>
                <ResultItem icon={<RotateCcw className="size-4" />} label={t(labels.changed, language)}>
                  {t(scenario.returnPreview.changed, language)}
                </ResultItem>
                <ResultItem icon={<CircleAlert className="size-4" />} label={t(labels.stillOpen, language)} tone="open">
                  {t(scenario.returnPreview.stillOpen, language)}
                  <p className="mt-2 font-semibold text-foreground">{t(scenario.returnPreview.nextAction, language)}</p>
                </ResultItem>
              </div>
            </div>
          </Reveal>
        </div>
        </section>
      )}

      {state.nextActionSelected && <RealThreadHandoff language={language} />}

      <section className="border-t border-border py-12">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-5 px-4 text-center sm:flex-row sm:px-6 sm:text-start lg:px-8">
          <div className="flex items-center gap-3">
            <UlomisMark language={language} state="restored" size={36} />
            <div>
              <p className="font-display font-semibold">Ulomis · أولوميس</p>
              <p className="text-sm text-muted-foreground">{t(copy.brandTagline, language)}</p>
            </div>
          </div>
          <UButton variant="ghost" onClick={() => dispatch({ type: "RESET" })}>
            <RotateCcw className="size-4" aria-hidden />
            {t(labels.tryAnother, language)}
          </UButton>
        </div>
      </section>
    </>
  );
}
