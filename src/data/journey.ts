/**
 * The guided continuity-restoration journey.
 *
 * Everything here is written content, not generated or retrieved. The shapes
 * below are deliberately strict about two things the demo must never fudge:
 *
 *  - `EvidenceKind` forces every fragment to declare whether it is something
 *    that happened, something the user said, or something Ulomis inferred.
 *  - Every derived claim carries `from`, the fragment ids it rests on, so the
 *    "why am I seeing this" panel shows real sources and a correction can
 *    invalidate exactly what depended on the withdrawn piece.
 *
 * Arabic copy: written for this project rather than machine-translated, but
 * it has NOT been reviewed by a native Gulf speaker — see supabase/README.md
 * sibling note in DEPLOY.md. Treat `ar` strings as draft until that review.
 */

import type { Locale } from "@/lib/i18n";

export type Bilingual = Record<Locale, string>;

/** Where a fragment came from. Deliberately generic — naming real products
 *  would imply integrations that do not exist. */
export type FragmentSource = "email" | "note" | "message" | "calendar" | "ai-chat" | "document";

/** What kind of claim a piece of evidence is. Shown on every card. */
export type EvidenceKind = "fact" | "stated" | "inferred";

export interface Fragment {
  id: string;
  source: FragmentSource;
  /** Human label for the origin, e.g. "Client email". */
  origin: Bilingual;
  /** Relative time, e.g. "9 days ago". */
  when: Bilingual;
  kind: EvidenceKind;
  text: Bilingual;
  /** Whether this fragment ends up in the restored thread. Irrelevant ones
   *  stay inspectable rather than disappearing. */
  relevant: boolean;
  /** Scatter offset applied only before restoration. */
  drift: { x: number; y: number; rotate: number };
}

export interface Claim {
  text: Bilingual;
  /** Fragment ids this rests on. */
  from: string[];
}

export interface CorrectionOption {
  id: "correct" | "partly" | "outdated" | "unrelated" | "missing";
  label: Bilingual;
  /** What Ulomis says once this correction is applied. */
  response: Bilingual;
  /** Whether applying this drops the uncertain claim from the thread. */
  dropsClaim: boolean;
  /** Optional replacement next action when the correction changes it. */
  nextActionOverride?: Bilingual;
}

export interface NextActionOption {
  id: string;
  label: Bilingual;
  /** Confirmation shown once chosen. */
  confirmation: Bilingual;
  primary?: boolean;
}

export interface ContradictionSide {
  id: string;
  origin: Bilingual;
  when: Bilingual;
  text: Bilingual;
  /** What the thread says once this side is chosen as current. */
  resolution: Bilingual;
}

export interface Contradiction {
  prompt: Bilingual;
  question: Bilingual;
  sides: ContradictionSide[];
}

export interface Journey {
  id: string;
  label: Bilingual;
  /** Short name for the thread itself — the proof object's title. */
  title: Bilingual;
  /** One-line framing shown when this scenario is selected. */
  premise: Bilingual;
  fragments: Fragment[];
  /** The state before anything changed. */
  before: Claim;
  /** What moved while the user was away — the delta that proves it. */
  changes: Claim[];
  decision: Claim;
  openItem: Claim;
  nextAction: Claim;
  /** Deliberately surfaced as uncertain — the pivot of the trust test. */
  uncertain: Claim;
  corrections: CorrectionOption[];
  contradiction: Contradiction;
  nextActions: NextActionOption[];
  /** For the proof object header. */
  lastConfirmed: Bilingual;
}

// ---------------------------------------------------------------------------

export const workJourney: Journey = {
  id: "work",
  label: { en: "My work", ar: "عملي" },
  title: { en: "Client-launch decision", ar: "قرار إطلاق العميل" },
  premise: {
    en: "You paused a client-launch decision nine days ago.",
    ar: "توقّفت عن حسم قرار إطلاق العميل قبل تسعة أيام.",
  },

  fragments: [
    {
      id: "w-email",
      source: "email",
      origin: { en: "Client email", ar: "بريد من العميل" },
      when: { en: "3 days ago", ar: "قبل ٣ أيام" },
      kind: "fact",
      text: {
        en: "“The new date works for us. We'll plan the announcement around it.”",
        ar: "«التاريخ الجديد يناسبنا، وسنرتّب الإعلان على أساسه.»",
      },
      relevant: true,
      drift: { x: -14, y: -10, rotate: -4 },
    },
    {
      id: "w-reviewer",
      source: "message",
      origin: { en: "Message from the reviewer", ar: "رسالة من المراجِع" },
      when: { en: "2 days ago", ar: "قبل يومين" },
      kind: "fact",
      text: {
        en: "“One more document before I can sign off — the updated data-handling summary.”",
        ar: "«أحتاج مستنداً إضافياً قبل الموافقة: ملخّص معالجة البيانات المحدَّث.»",
      },
      relevant: true,
      drift: { x: 13, y: 8, rotate: 3.5 },
    },
    {
      id: "w-note",
      source: "note",
      origin: { en: "Your note", ar: "ملاحظتك" },
      when: { en: "9 days ago", ar: "قبل ٩ أيام" },
      kind: "stated",
      text: {
        en: "“Not launching until compliance is actually clear. Not worth the risk.”",
        ar: "«لن نطلق قبل أن تكتمل الموافقة فعلياً. المخاطرة لا تستحق.»",
      },
      relevant: true,
      drift: { x: -9, y: 13, rotate: 2.5 },
    },
    {
      id: "w-calendar",
      source: "calendar",
      origin: { en: "Calendar", ar: "التقويم" },
      when: { en: "In 4 days", ar: "بعد ٤ أيام" },
      kind: "fact",
      text: {
        en: "Launch readiness review — still on the calendar.",
        ar: "مراجعة جاهزية الإطلاق — ما زالت مثبّتة في التقويم.",
      },
      relevant: true,
      drift: { x: 15, y: -12, rotate: -3 },
    },
    {
      id: "w-chat",
      source: "ai-chat",
      origin: { en: "A chat you had", ar: "محادثة أجريتها" },
      when: { en: "9 days ago", ar: "قبل ٩ أيام" },
      kind: "stated",
      text: {
        en: "You worked through two options: delay the launch, or ship without the review.",
        ar: "بحثت خيارين: تأجيل الإطلاق، أو الإطلاق دون المراجعة.",
      },
      relevant: true,
      drift: { x: -12, y: -6, rotate: 4 },
    },
    {
      id: "w-rejected",
      source: "note",
      origin: { en: "Rejected option", ar: "خيار مستبعَد" },
      when: { en: "9 days ago", ar: "قبل ٩ أيام" },
      kind: "stated",
      text: {
        en: "“Ship first, document after” — you ruled this out the same day.",
        ar: "«نطلق أولاً ثم نوثّق» — استبعدتَه في اليوم نفسه.",
      },
      relevant: true,
      drift: { x: 10, y: 12, rotate: -2.5 },
    },
    {
      id: "w-unrelated",
      source: "email",
      origin: { en: "Newsletter", ar: "نشرة بريدية" },
      when: { en: "5 days ago", ar: "قبل ٥ أيام" },
      kind: "fact",
      text: {
        en: "An industry roundup that happened to mention the same client.",
        ar: "نشرة قطاعية ورد فيها اسم العميل نفسه بالمصادفة.",
      },
      relevant: false,
      drift: { x: -16, y: 4, rotate: 3 },
    },
  ],

  before: {
    text: {
      en: "You were choosing whether to delay the launch for one remaining compliance review.",
      ar: "كنتَ تقرّر ما إذا كنت ستؤجّل الإطلاق من أجل مراجعة امتثال واحدة متبقّية.",
    },
    from: ["w-note", "w-chat"],
  },

  changes: [
    {
      text: { en: "The client accepted the new date.", ar: "وافق العميل على التاريخ الجديد." },
      from: ["w-email"],
    },
    {
      text: {
        en: "The compliance reviewer asked for one more document — the data-handling summary.",
        ar: "طلب مراجِع الامتثال مستنداً إضافياً: ملخّص معالجة البيانات.",
      },
      from: ["w-reviewer"],
    },
  ],

  decision: {
    text: {
      en: "Don't launch until the review is complete — you ruled out shipping without it.",
      ar: "لا إطلاق قبل اكتمال المراجعة — استبعدتَ فكرة الإطلاق دونها.",
    },
    from: ["w-note", "w-rejected"],
  },

  openItem: {
    text: {
      en: "The requested document hasn't been sent yet.",
      ar: "المستند المطلوب لم يُرسَل بعد.",
    },
    from: ["w-reviewer"],
  },

  nextAction: {
    text: {
      en: "Send the data-handling summary to the reviewer before Thursday's readiness review.",
      ar: "أرسِل ملخّص معالجة البيانات إلى المراجِع قبل اجتماع مراجعة الجاهزية يوم الخميس.",
    },
    from: ["w-reviewer", "w-calendar"],
  },

  uncertain: {
    text: {
      en: "You may also have planned to notify the client only after the document is submitted.",
      ar: "قد تكون خطّطتَ أيضاً لإبلاغ العميل فقط بعد تقديم المستند.",
    },
    from: ["w-email"],
  },

  corrections: [
    {
      id: "correct",
      label: { en: "Correct", ar: "صحيح" },
      response: {
        en: "Good — I'll keep this as part of the thread.",
        ar: "جيد — سأُبقي هذا جزءاً من الخيط.",
      },
      dropsClaim: false,
    },
    {
      id: "partly",
      label: { en: "Partly right", ar: "صحيح جزئياً" },
      response: {
        en: "Noted — I'll hold this loosely rather than as settled.",
        ar: "مفهوم — سأتعامل مع هذا كاحتمال وليس كأمر محسوم.",
      },
      dropsClaim: false,
    },
    {
      id: "outdated",
      label: { en: "Outdated", ar: "قديم" },
      response: {
        en: "Understood — I've dropped this. It no longer reflects where things stand.",
        ar: "مفهوم — أزلتُ هذا. لم يعد يعكس الوضع الحالي.",
      },
      dropsClaim: true,
      nextActionOverride: {
        en: "Send the data-handling summary to the reviewer. Client notification isn't tied to it.",
        ar: "أرسِل ملخّص معالجة البيانات إلى المراجِع. إبلاغ العميل غير مرتبط بذلك.",
      },
    },
    {
      id: "unrelated",
      label: { en: "Unrelated", ar: "غير ذي صلة" },
      response: {
        en: "Removed — this wasn't part of this thread.",
        ar: "أُزيل — هذا لم يكن جزءاً من هذا الخيط.",
      },
      dropsClaim: true,
      nextActionOverride: {
        en: "Send the data-handling summary to the reviewer. Client notification isn't tied to it.",
        ar: "أرسِل ملخّص معالجة البيانات إلى المراجِع. إبلاغ العميل غير مرتبط بذلك.",
      },
    },
    {
      id: "missing",
      label: { en: "Something is missing", ar: "هناك أمر ناقص" },
      response: {
        en: "Thanks — flagged that something's missing here.",
        ar: "شكراً — سجّلتُ أن هناك أمراً ناقصاً هنا.",
      },
      dropsClaim: false,
    },
  ],

  contradiction: {
    prompt: {
      en: "Your note says the review needs to be complete before launch.",
      ar: "ملاحظتك تقول إن المراجعة يجب أن تكتمل قبل الإطلاق.",
    },
    question: {
      en: "Which reflects the current constraint?",
      ar: "أيّهما يعكس القيد الحالي؟",
    },
    sides: [
      {
        id: "note",
        origin: { en: "Your note", ar: "ملاحظتك" },
        when: { en: "9 days ago", ar: "قبل ٩ أيام" },
        text: {
          en: "Not launching until compliance is actually clear.",
          ar: "لن نطلق قبل أن تكتمل الموافقة فعلياً.",
        },
        resolution: {
          en: "The launch stays blocked until the reviewer signs off.",
          ar: "يبقى الإطلاق متوقّفاً حتى موافقة المراجِع.",
        },
      },
      {
        id: "chat",
        origin: { en: "A chat you had", ar: "محادثة أجريتها" },
        when: { en: "2 days ago", ar: "قبل يومين" },
        text: {
          en: "Maybe we soft-launch to a small group while the review finishes.",
          ar: "ربما نُطلق إطلاقاً محدوداً لمجموعة صغيرة أثناء اكتمال المراجعة.",
        },
        resolution: {
          en: "A limited soft-launch becomes possible before full sign-off, if you choose it.",
          ar: "يصبح الإطلاق المحدود ممكناً قبل الموافقة الكاملة، إذا اخترتَ ذلك.",
        },
      },
    ],
  },

  nextActions: [
    {
      id: "continue",
      label: { en: "Continue from here", ar: "تابع من هنا" },
      confirmation: {
        en: "Good — this is now where you'll pick up next time.",
        ar: "جيد — هذا هو المكان الذي ستتابع منه في المرة القادمة.",
      },
      primary: true,
    },
    {
      id: "save-later",
      label: { en: "Save for later", ar: "احفظ لوقت لاحق" },
      confirmation: {
        en: "Saved. Nothing changes until you come back to it.",
        ar: "تم الحفظ. لن يتغيّر شيء حتى تعود إليه.",
      },
    },
    {
      id: "defer",
      label: { en: "Defer", ar: "أجِّل" },
      confirmation: {
        en: "Deferred — I'll surface this again when it's relevant.",
        ar: "تم التأجيل — سأعرض هذا مجدداً عندما يصبح ذا صلة.",
      },
    },
    {
      id: "mark-complete",
      label: { en: "Mark complete", ar: "علّم كمكتمل" },
      confirmation: {
        en: "Marked complete. This thread is closed.",
        ar: "تم التعليم كمكتمل. أُغلق هذا الخيط.",
      },
    },
    {
      id: "see-source",
      label: { en: "See the source", ar: "اعرض المصدر" },
      confirmation: {
        en: "That's the reviewer's message from 2 days ago — nothing else changes.",
        ar: "هذه رسالة المراجِع من قبل يومين — لا شيء آخر يتغيّر.",
      },
    },
  ],

  lastConfirmed: { en: "2 days ago", ar: "قبل يومين" },
};

export const journeys: Journey[] = [workJourney];
export const defaultJourneyId = workJourney.id;

export function getJourney(id: string): Journey {
  return journeys.find((j) => j.id === id) ?? workJourney;
}
