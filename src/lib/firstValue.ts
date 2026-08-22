export type ContinuityKind = "state" | "decision" | "open" | "action";

export interface SourceSnippet {
  id: number;
  text: string;
}

export interface ContinuityItem {
  kind: ContinuityKind;
  text: string;
  sourceId: number;
  sourceText: string;
}

export interface FirstValueResult {
  sources: SourceSnippet[];
  state: ContinuityItem | null;
  decisions: ContinuityItem[];
  openLoops: ContinuityItem[];
  nextAction: ContinuityItem | null;
  matchedSourceCount: number;
}

const DECISION_PATTERNS = [
  /\b(decided|agreed|approved|confirmed|selected|chose|going with|will use|we'll use|locked in)\b/i,
  /(قررنا|قررت|تم الاتفاق|اتفقنا|اخترنا|اعتمدنا|تم اعتماد|تم التأكيد)/i,
];

const OPEN_PATTERNS = [
  /\b(pending|waiting|blocked|unresolved|open item|open loop|still need|need to|needs to|must|todo|to-do|follow up|follow-up|haven't|hasn't|not yet|question)\b/i,
  /(معلق|بانتظار|غير محسوم|لم يتم|ما زال|ما زالت|نحتاج|يجب|متابعة|سؤال)/i,
  /\?\s*$/,
];

const ACTION_PATTERNS = [
  /\b(next|next step|need to|needs to|must|will|should|follow up|send|reply|review|check|call|book|schedule|submit|pay|draft|share|test|confirm)\b/i,
  /(الخطوة التالية|سوف|سأ|سنقوم|يجب|نحتاج|أرسل|ارسل|راجع|تحقق|اتصل|احجز|جدول|قدّم|قدم|ادفع|اختبر|أكد)/i,
];

const STATE_PATTERNS = [
  /\b(currently|current status|right now|now|where we are|status|as of|today|latest)\b/i,
  /(حالياً|حاليًا|الآن|الوضع الحالي|وصلنا|حتى الآن|اليوم)/i,
];

function clean(value: string) {
  return value.replace(/^[-*•\d.)\s]+/, "").replace(/\s+/g, " ").trim();
}

function splitIntoSources(content: string): SourceSnippet[] {
  const lines = content
    .split(/\r?\n+/)
    .flatMap((line) => line.split(/(?<=[.!?؟])\s+/))
    .map(clean)
    .filter((line) => line.length >= 8);

  const seen = new Set<string>();
  return lines
    .filter((line) => {
      const key = line.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 80)
    .map((text, index) => ({ id: index + 1, text }));
}

function matchesAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function toItem(kind: ContinuityKind, source: SourceSnippet): ContinuityItem {
  return {
    kind,
    text: source.text,
    sourceId: source.id,
    sourceText: source.text,
  };
}

function takeLatest(
  sources: SourceSnippet[],
  kind: ContinuityKind,
  patterns: RegExp[],
): ContinuityItem | null {
  for (let index = sources.length - 1; index >= 0; index -= 1) {
    if (matchesAny(sources[index].text, patterns)) return toItem(kind, sources[index]);
  }
  return null;
}

function collectLatest(
  sources: SourceSnippet[],
  kind: ContinuityKind,
  patterns: RegExp[],
  limit: number,
): ContinuityItem[] {
  const matches: ContinuityItem[] = [];
  for (let index = sources.length - 1; index >= 0 && matches.length < limit; index -= 1) {
    if (matchesAny(sources[index].text, patterns)) matches.push(toItem(kind, sources[index]));
  }
  return matches.reverse();
}

/**
 * A deliberately bounded first-value extractor.
 *
 * It does not summarize, infer intent, call an LLM, or upload content. It only
 * surfaces explicit state/decision/open-loop/action language already present
 * in the visitor's text and points every result back to the source fragment.
 */
export function reconstructFirstValue(content: string): FirstValueResult {
  const sources = splitIntoSources(content);
  const decisions = collectLatest(sources, "decision", DECISION_PATTERNS, 3);
  const openLoops = collectLatest(sources, "open", OPEN_PATTERNS, 4);
  const nextAction = takeLatest(sources, "action", ACTION_PATTERNS);
  const explicitState = takeLatest(sources, "state", STATE_PATTERNS);

  // If the thread contains no explicit status phrase, the latest source is the
  // safest bounded answer to "where did I leave this?". We label it as the
  // latest source, never as an inferred summary.
  const state = explicitState ?? (sources.length ? toItem("state", sources[sources.length - 1]) : null);

  const matchedIds = new Set<number>();
  [state, nextAction, ...decisions, ...openLoops].forEach((item) => {
    if (item) matchedIds.add(item.sourceId);
  });

  return {
    sources,
    state,
    decisions,
    openLoops,
    nextAction,
    matchedSourceCount: matchedIds.size,
  };
}

export function formatContinuityPacket(label: string, result: FirstValueResult) {
  const lines: string[] = [];
  if (label.trim()) lines.push(`# ${label.trim()}`, "");
  lines.push("ULOMIS CONTINUITY PACKET", "");
  lines.push("WHERE YOU LEFT IT");
  lines.push(result.state ? `- ${result.state.text} [source ${result.state.sourceId}]` : "- Not found explicitly");
  lines.push("", "DECISIONS");
  lines.push(...(result.decisions.length
    ? result.decisions.map((item) => `- ${item.text} [source ${item.sourceId}]`)
    : ["- No explicit decision detected"]));
  lines.push("", "OPEN LOOPS");
  lines.push(...(result.openLoops.length
    ? result.openLoops.map((item) => `- ${item.text} [source ${item.sourceId}]`)
    : ["- No explicit open loop detected"]));
  lines.push("", "NEXT ACTION");
  lines.push(result.nextAction ? `- ${result.nextAction.text} [source ${result.nextAction.sourceId}]` : "- No explicit next action detected");
  lines.push("", "BOUNDARY", "- Extracted locally from explicit wording only. No AI call, upload, or hidden inference.");
  return lines.join("\n");
}
