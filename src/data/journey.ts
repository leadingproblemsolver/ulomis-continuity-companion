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
  /** Scene 9 — a short, static preview of what a future return would show.
   *  Not a second demo: one new fragment and the state it produces. */
  returnPreview: {
    previousState: Bilingual;
    newFragment: { origin: Bilingual; text: Bilingual };
    changed: Bilingual;
    stillOpen: Bilingual;
    nextAction: Bilingual;
  };
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

  returnPreview: {
    previousState: {
      en: "You sent the data-handling summary and chose “Continue from here.”",
      ar: "أرسلتَ ملخّص معالجة البيانات واخترتَ «تابع من هنا».",
    },
    newFragment: {
      origin: { en: "Reviewer message · new", ar: "رسالة المراجِع · جديدة" },
      text: {
        en: "“Received, thanks. I'll sign off after Thursday's review.”",
        ar: "«استلمتُه، شكراً. سأوافق بعد اجتماع الخميس.»",
      },
    },
    changed: {
      en: "The reviewer confirmed receipt. Sign-off is expected after Thursday's meeting.",
      ar: "أكّد المراجِع استلام المستند. يُتوقَّع التوقيع بعد اجتماع الخميس.",
    },
    stillOpen: {
      en: "Final sign-off hasn't landed yet.",
      ar: "الموافقة النهائية لم تصدر بعد.",
    },
    nextAction: {
      en: "Wait for sign-off, then confirm the launch date with the client.",
      ar: "انتظر الموافقة، ثم أكِّد تاريخ الإطلاق مع العميل.",
    },
  },
};

// ---------------------------------------------------------------------------

export const lifeJourney: Journey = {
  id: "life",
  label: { en: "My life", ar: "حياتي" },
  title: { en: "The move", ar: "الانتقال" },
  premise: {
    en: "You paused choosing a moving van six days ago.",
    ar: "توقّفت عن اختيار شاحنة النقل قبل ستة أيام.",
  },

  fragments: [
    {
      id: "l-quote",
      source: "email",
      origin: { en: "New quote", ar: "عرض سعر جديد" },
      when: { en: "3 days ago", ar: "قبل ٣ أيام" },
      kind: "fact",
      text: {
        en: "“The larger van is now $38 less than your last quote.”",
        ar: "«الشاحنة الكبيرة أصبحت أرخص بـ٣٨ دولاراً عن عرضك السابق.»",
      },
      relevant: true,
      drift: { x: -13, y: -9, rotate: -3.5 },
    },
    {
      id: "l-partner",
      source: "message",
      origin: { en: "Message from your partner", ar: "رسالة من شريكك" },
      when: { en: "2 days ago", ar: "قبل يومين" },
      kind: "fact",
      text: {
        en: "“Did you book the van yet? Moving day's close.”",
        ar: "«هل حجزتَ الشاحنة بعد؟ يوم الانتقال اقترب.»",
      },
      relevant: true,
      drift: { x: 14, y: 9, rotate: 3 },
    },
    {
      id: "l-note",
      source: "note",
      origin: { en: "Your note", ar: "ملاحظتك" },
      when: { en: "6 days ago", ar: "قبل ٦ أيام" },
      kind: "stated",
      text: {
        en: "“Not the small van — it won't fit the desk.”",
        ar: "«ليست الشاحنة الصغيرة — لن يتّسع فيها المكتب.»",
      },
      relevant: true,
      drift: { x: -8, y: 12, rotate: 2 },
    },
    {
      id: "l-calendar",
      source: "calendar",
      origin: { en: "Calendar", ar: "التقويم" },
      when: { en: "In 5 days", ar: "بعد ٥ أيام" },
      kind: "fact",
      text: {
        en: "Moving day — still on the calendar.",
        ar: "يوم الانتقال — ما زال مثبّتاً في التقويم.",
      },
      relevant: true,
      drift: { x: 15, y: -11, rotate: -2.5 },
    },
    {
      id: "l-chat",
      source: "ai-chat",
      origin: { en: "A chat you had", ar: "محادثة أجريتها" },
      when: { en: "6 days ago", ar: "قبل ٦ أيام" },
      kind: "stated",
      text: {
        en: "You compared two van sizes and what each could actually hold.",
        ar: "قارنتَ بين حجمَي شاحنتين وما يتّسع في كلٍّ منهما فعلياً.",
      },
      relevant: true,
      drift: { x: -11, y: -6, rotate: 3.5 },
    },
    {
      id: "l-rejected",
      source: "note",
      origin: { en: "Rejected option", ar: "خيار مستبعَد" },
      when: { en: "6 days ago", ar: "قبل ٦ أيام" },
      kind: "stated",
      text: {
        en: "“Smaller van, cheaper” — ruled out the same day, doesn't fit the desk.",
        ar: "«الشاحنة الصغيرة، أرخص» — استُبعدت في اليوم نفسه، لا تتّسع للمكتب.",
      },
      relevant: true,
      drift: { x: 9, y: 11, rotate: -3 },
    },
    {
      id: "l-unrelated",
      source: "email",
      origin: { en: "Sale email", ar: "بريد عرض ترويجي" },
      when: { en: "4 days ago", ar: "قبل ٤ أيام" },
      kind: "fact",
      text: {
        en: "A furniture sale email that happened to mention desks.",
        ar: "بريد عن تخفيضات أثاث ورد فيه ذكر المكاتب بالمصادفة.",
      },
      relevant: false,
      drift: { x: -15, y: 5, rotate: 2.5 },
    },
  ],

  before: {
    text: {
      en: "You were choosing between the smaller, cheaper van and the larger one that actually fits the desk.",
      ar: "كنتَ تختار بين الشاحنة الصغيرة الأرخص والشاحنة الكبيرة التي يتّسع فيها المكتب فعلاً.",
    },
    from: ["l-note", "l-chat"],
  },

  changes: [
    {
      text: {
        en: "The larger van's price dropped by $38 in a new quote.",
        ar: "انخفض سعر الشاحنة الكبيرة بمقدار ٣٨ دولاراً في عرض جديد.",
      },
      from: ["l-quote"],
    },
    {
      text: {
        en: "Moving day is now five days away, not eight.",
        ar: "أصبح يوم الانتقال بعد خمسة أيام، لا ثمانية.",
      },
      from: ["l-calendar"],
    },
  ],

  decision: {
    text: {
      en: "Book the larger van — it's the one that fits everything you actually need to move.",
      ar: "احجز الشاحنة الكبيرة — هي التي يتّسع فيها كل ما تحتاج فعلاً نقله.",
    },
    from: ["l-note", "l-rejected"],
  },

  openItem: {
    text: {
      en: "The larger van hasn't been booked yet.",
      ar: "الشاحنة الكبيرة لم تُحجز بعد.",
    },
    from: ["l-partner"],
  },

  nextAction: {
    text: {
      en: "Book the larger van before moving day.",
      ar: "احجز الشاحنة الكبيرة قبل يوم الانتقال.",
    },
    from: ["l-partner", "l-calendar"],
  },

  uncertain: {
    text: {
      en: "You may also have planned to ask a friend to help load the desk.",
      ar: "قد تكون خطّطتَ أيضاً لطلب مساعدة صديق في تحميل المكتب.",
    },
    from: ["l-chat"],
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
        en: "Book the larger van before moving day. Getting help with the desk isn't tied to that.",
        ar: "احجز الشاحنة الكبيرة قبل يوم الانتقال. طلب المساعدة في المكتب غير مرتبط بذلك.",
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
        en: "Book the larger van before moving day. Getting help with the desk isn't tied to that.",
        ar: "احجز الشاحنة الكبيرة قبل يوم الانتقال. طلب المساعدة في المكتب غير مرتبط بذلك.",
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
      en: "Your note says the smaller van won't fit the desk.",
      ar: "ملاحظتك تقول إن الشاحنة الصغيرة لن يتّسع فيها المكتب.",
    },
    question: {
      en: "Which reflects the current plan?",
      ar: "أيّهما يعكس الخطة الحالية؟",
    },
    sides: [
      {
        id: "note",
        origin: { en: "Your note", ar: "ملاحظتك" },
        when: { en: "6 days ago", ar: "قبل ٦ أيام" },
        text: {
          en: "Not the small van — it won't fit the desk.",
          ar: "ليست الشاحنة الصغيرة — لن يتّسع فيها المكتب.",
        },
        resolution: {
          en: "The larger van stays the plan; nothing changes.",
          ar: "تبقى الشاحنة الكبيرة هي الخطة؛ لا شيء يتغيّر.",
        },
      },
      {
        id: "chat",
        origin: { en: "A chat you had", ar: "محادثة أجريتها" },
        when: { en: "3 days ago", ar: "قبل ٣ أيام" },
        text: {
          en: "Maybe the desk could ship separately by courier instead.",
          ar: "ربما يمكن شحن المكتب منفصلاً عبر شركة توصيل بدلاً من ذلك.",
        },
        resolution: {
          en: "Shipping the desk separately becomes an option, if you choose it — the van decision no longer depends on it.",
          ar: "يصبح شحن المكتب منفصلاً خياراً متاحاً، إذا اخترتَه — ولن يعتمد قرار الشاحنة عليه بعد ذلك.",
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
        en: "That's your partner's message from 2 days ago — nothing else changes.",
        ar: "هذه رسالة شريكك من قبل يومين — لا شيء آخر يتغيّر.",
      },
    },
  ],

  lastConfirmed: { en: "2 days ago", ar: "قبل يومين" },

  returnPreview: {
    previousState: {
      en: "You booked the larger van and chose “Continue from here.”",
      ar: "حجزتَ الشاحنة الكبيرة واخترتَ «تابع من هنا».",
    },
    newFragment: {
      origin: { en: "Message from the mover · new", ar: "رسالة من شركة النقل · جديدة" },
      text: {
        en: "“Confirmed for Thursday, 9am pickup.”",
        ar: "«تأكيد الحجز ليوم الخميس، الاستلام الساعة ٩ صباحاً.»",
      },
    },
    changed: {
      en: "The booking is confirmed for Thursday morning.",
      ar: "تأكّد الحجز صباح الخميس.",
    },
    stillOpen: {
      en: "The desk still needs to be wrapped before then.",
      ar: "لا يزال المكتب بحاجة إلى تغليف قبل ذلك.",
    },
    nextAction: {
      en: "Wrap the desk the night before pickup.",
      ar: "غلِّف المكتب مساء اليوم السابق للاستلام.",
    },
  },
};

// ---------------------------------------------------------------------------

export const householdJourney: Journey = {
  id: "household",
  label: { en: "My household", ar: "منزلي" },
  title: { en: "The repair follow-up", ar: "متابعة الإصلاح" },
  premise: {
    en: "You paused following up on a repair two weeks ago.",
    ar: "توقّفت عن متابعة إصلاح قبل أسبوعين.",
  },

  fragments: [
    {
      id: "h-landlord",
      source: "email",
      origin: { en: "Landlord's reply", ar: "رد المالك" },
      when: { en: "15 days ago", ar: "قبل ١٥ يوماً" },
      kind: "fact",
      text: {
        en: "“Got your message — I'll get someone out this week.”",
        ar: "«استلمتُ رسالتك — سأرسل أحداً هذا الأسبوع.»",
      },
      relevant: true,
      drift: { x: -14, y: -9, rotate: -3 },
    },
    {
      id: "h-followup",
      source: "message",
      origin: { en: "Your reminder", ar: "رسالة التذكير منك" },
      when: { en: "2 days ago", ar: "قبل يومين" },
      kind: "fact",
      text: {
        en: "“Just checking in — nobody's come by yet.” Sent, no reply.",
        ar: "«أتابع فقط — لم يأتِ أحد بعد.» أُرسلت، بلا رد.",
      },
      relevant: true,
      drift: { x: 13, y: 8, rotate: 3.5 },
    },
    {
      id: "h-note",
      source: "note",
      origin: { en: "Your note", ar: "ملاحظتك" },
      when: { en: "15 days ago", ar: "قبل ١٥ يوماً" },
      kind: "stated",
      text: {
        en: "“Give it two weeks, then follow up again if no one's come.”",
        ar: "«أمهله أسبوعين، ثم أتابع مجدداً إن لم يأتِ أحد.»",
      },
      relevant: true,
      drift: { x: -9, y: 12, rotate: 2.5 },
    },
    {
      id: "h-calendar",
      source: "calendar",
      origin: { en: "Calendar", ar: "التقويم" },
      when: { en: "Today", ar: "اليوم" },
      kind: "fact",
      text: {
        en: "“Follow up on repair” — the two-week reminder you set.",
        ar: "«متابعة الإصلاح» — التذكير الذي ضبطتَه بعد أسبوعين.",
      },
      relevant: true,
      drift: { x: 15, y: -11, rotate: -2.5 },
    },
    {
      id: "h-chat",
      source: "ai-chat",
      origin: { en: "A chat you had", ar: "محادثة أجريتها" },
      when: { en: "2 days ago", ar: "قبل يومين" },
      kind: "stated",
      text: {
        en: "You considered mentioning the tenant board if there's no response this time.",
        ar: "فكّرتَ في ذكر مجلس المستأجرين إذا لم يصلك رد هذه المرة.",
      },
      relevant: true,
      drift: { x: -12, y: -6, rotate: 4 },
    },
    {
      id: "h-rejected",
      source: "note",
      origin: { en: "Rejected option", ar: "خيار مستبعَد" },
      when: { en: "15 days ago", ar: "قبل ١٥ يوماً" },
      kind: "stated",
      text: {
        en: "“Call every few days” — ruled out; one clear message is enough for now.",
        ar: "«الاتصال كل بضعة أيام» — استُبعد؛ رسالة واحدة واضحة تكفي الآن.",
      },
      relevant: true,
      drift: { x: 10, y: 12, rotate: -2.5 },
    },
    {
      id: "h-unrelated",
      source: "email",
      origin: { en: "Building newsletter", ar: "نشرة المبنى" },
      when: { en: "6 days ago", ar: "قبل ٦ أيام" },
      kind: "fact",
      text: {
        en: "A building newsletter mentioning an unrelated lobby repaint.",
        ar: "نشرة عن المبنى تذكر طلاء ردهة المدخل، بلا صلة بموضوعك.",
      },
      relevant: false,
      drift: { x: -16, y: 4, rotate: 3 },
    },
  ],

  before: {
    text: {
      en: "You were waiting to see if the landlord would send someone before following up again.",
      ar: "كنتَ تنتظر لترى إن كان المالك سيرسل أحداً قبل أن تتابع مجدداً.",
    },
    from: ["h-note"],
  },

  changes: [
    {
      text: {
        en: "Fifteen days passed without a repair visit.",
        ar: "مرّ خمسة عشر يوماً دون زيارة إصلاح.",
      },
      from: ["h-calendar"],
    },
    {
      text: {
        en: "You already sent one reminder, and it's gone unanswered.",
        ar: "أرسلتَ بالفعل تذكيراً واحداً، ولم يُرَدّ عليه.",
      },
      from: ["h-followup"],
    },
  ],

  decision: {
    text: {
      en: "Follow up in writing rather than calling repeatedly.",
      ar: "تابع كتابياً بدلاً من الاتصال المتكرر.",
    },
    from: ["h-rejected", "h-note"],
  },

  openItem: {
    text: {
      en: "The repair still hasn't happened.",
      ar: "الإصلاح لم يحدث بعد.",
    },
    from: ["h-landlord"],
  },

  nextAction: {
    text: {
      en: "Send one more written follow-up, and mention the tenant board if there's no response.",
      ar: "أرسِل متابعة كتابية أخرى، واذكر مجلس المستأجرين إن لم يصلك رد.",
    },
    from: ["h-followup", "h-chat"],
  },

  uncertain: {
    text: {
      en: "You may also have decided to loop in a neighbor who mentioned the same issue.",
      ar: "قد تكون قرّرتَ أيضاً إشراك جار ذكر المشكلة نفسها.",
    },
    from: ["h-chat"],
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
        en: "Send one more written follow-up. Looping in a neighbor isn't tied to that.",
        ar: "أرسِل متابعة كتابية أخرى. إشراك الجار غير مرتبط بذلك.",
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
        en: "Send one more written follow-up. Looping in a neighbor isn't tied to that.",
        ar: "أرسِل متابعة كتابية أخرى. إشراك الجار غير مرتبط بذلك.",
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
      en: "Your note says one clear message is enough for now.",
      ar: "ملاحظتك تقول إن رسالة واحدة واضحة تكفي الآن.",
    },
    question: {
      en: "Which reflects where things stand?",
      ar: "أيّهما يعكس الوضع الحالي؟",
    },
    sides: [
      {
        id: "note",
        origin: { en: "Your note", ar: "ملاحظتك" },
        when: { en: "15 days ago", ar: "قبل ١٥ يوماً" },
        text: {
          en: "One clear message is enough for now.",
          ar: "رسالة واحدة واضحة تكفي الآن.",
        },
        resolution: {
          en: "The plan stays the same — one more written follow-up, nothing louder yet.",
          ar: "تبقى الخطة كما هي — متابعة كتابية أخرى، دون تصعيد بعد.",
        },
      },
      {
        id: "chat",
        origin: { en: "A chat you had", ar: "محادثة أجريتها" },
        when: { en: "2 days ago", ar: "قبل يومين" },
        text: {
          en: "Maybe it's time to mention the tenant board sooner rather than waiting.",
          ar: "ربما آن الأوان لذكر مجلس المستأجرين الآن بدلاً من الانتظار.",
        },
        resolution: {
          en: "Mentioning the tenant board moves up to this message, if you choose it.",
          ar: "يصبح ذكر مجلس المستأجرين جزءاً من هذه الرسالة، إذا اخترتَ ذلك.",
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
        en: "That's your reminder from 2 days ago — nothing else changes.",
        ar: "هذه رسالة التذكير منك من قبل يومين — لا شيء آخر يتغيّر.",
      },
    },
  ],

  lastConfirmed: { en: "2 days ago", ar: "قبل يومين" },

  returnPreview: {
    previousState: {
      en: "You sent the written follow-up and chose “Continue from here.”",
      ar: "أرسلتَ المتابعة الكتابية واخترتَ «تابع من هنا».",
    },
    newFragment: {
      origin: { en: "Landlord's reply · new", ar: "رد المالك · جديد" },
      text: {
        en: "“Someone will come Friday, between 9 and 12.”",
        ar: "«سيأتي أحد يوم الجمعة، بين الساعة ٩ و١٢.»",
      },
    },
    changed: {
      en: "The landlord finally gave a specific day and window.",
      ar: "حدّد المالك أخيراً يوماً ووقتاً محددَين.",
    },
    stillOpen: {
      en: "You still need to be home Friday morning.",
      ar: "لا يزال عليك التواجد في المنزل صباح الجمعة.",
    },
    nextAction: {
      en: "Confirm you'll be available Friday morning.",
      ar: "أكِّد أنك ستكون متاحاً صباح الجمعة.",
    },
  },
};

export const journeys: Journey[] = [workJourney, lifeJourney, householdJourney];
export const defaultJourneyId = workJourney.id;

export function getJourney(id: string): Journey {
  return journeys.find((j) => j.id === id) ?? workJourney;
}
