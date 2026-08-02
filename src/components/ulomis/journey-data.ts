/* eslint-disable prettier/prettier */
export type Language = "en" | "ar";
export type LocalizedText = { en: string; ar: string };
export type ScenarioId = "work" | "life" | "household";
export type CorrectionChoice = "correct" | "partial" | "outdated" | "unrelated" | "missing";
export type FragmentKind = "source" | "fact" | "inference" | "stale" | "contradiction";

export type DemoFragment = {
  id: string;
  source: LocalizedText;
  time: LocalizedText;
  text: LocalizedText;
  kind: FragmentKind;
  relevant: boolean;
};

export type DemoScenario = {
  id: ScenarioId;
  label: LocalizedText;
  recognition: LocalizedText;
  threadTitle: LocalizedText;
  threadDescription: LocalizedText;
  fragments: DemoFragment[];
  previousState: LocalizedText;
  previousStateSourceIds: string[];
  currentState: LocalizedText;
  currentStateSourceIds: string[];
  objective: LocalizedText;
  objectiveSourceIds: string[];
  changes: Array<{ text: LocalizedText; sourceIds: string[] }>;
  commitments: Array<{ text: LocalizedText; owner: LocalizedText; status: LocalizedText; sourceIds: string[] }>;
  dependencies: Array<{ text: LocalizedText; owner: LocalizedText; status: LocalizedText; sourceIds: string[] }>;
  missingInformation: Array<{ text: LocalizedText; impact: LocalizedText }>;
  owners: LocalizedText[];
  decision: {
    statement: LocalizedText;
    rationale: LocalizedText;
    sourceIds: string[];
  };
  openLoop: { statement: LocalizedText; sourceIds: string[] };
  suggestedNextAction: LocalizedText;
  correctionOutcomes: Record<CorrectionChoice, { updatedState: LocalizedText; nextAction: LocalizedText }>;
  nextActionSourceIds: string[];
  uncertainItem: {
    statement: LocalizedText;
    sourceIds: string[];
    confidence: number;
  };
  returnPreview: {
    newFragment: LocalizedText;
    changed: LocalizedText;
    stillOpen: LocalizedText;
    nextAction: LocalizedText;
  };
};

export const copy = {
  brandTagline: { en: "Your digital life, continued.", ar: "حياتك الرقمية، مستمرة." },
  heroTitle: {
    en: "You already did the thinking. Why are you starting again?",
    ar: "لقد أنجزت التفكير بالفعل. فلماذا تبدأ من جديد؟",
  },
  heroBody: {
    en: "Ulomis reconnects the decisions, changes, and open questions behind an unfinished thread—so you can continue without rereading everything.",
    ar: "يعيد أولوميس وصل القرارات والتغيّرات والأسئلة المفتوحة في خيط غير مكتمل، لتتابع من دون إعادة قراءة كل شيء.",
  },
  restoreThread: { en: "Restore a thread", ar: "استعد خيطًا" },
  guidedDemo: { en: "Guided simulated example", ar: "مثال إرشادي محاكى" },
  scenarios: { en: "Choose a familiar thread", ar: "اختر خيطًا مألوفًا" },
  infoSurvived: { en: "The information survived. The thread did not.", ar: "بقيت المعلومات. لكن الخيط انقطع." },
  letRestore: { en: "Let Ulomis restore this thread", ar: "دع أولوميس يعيد وصل هذا الخيط" },
  whereLeft: { en: "Where You Left It", ar: "هنا توقفت" },
  checkReconstruction: { en: "Check this reconstruction", ar: "تحقق من هذا الاسترجاع" },
  continue: { en: "Continue from here", ar: "تابع من هنا" },
  giveReal: { en: "Give Ulomis one real thread", ar: "أعطِ أولوميس خيطًا حقيقيًا" },
  simulatedDisclosure: {
    en: "This demo uses curated, simulated fragments. It does not access your email, calendar, messages, or other apps.",
    ar: "يستخدم هذا العرض أجزاءً منسّقة ومحاكاة. ولا يصل إلى بريدك أو تقويمك أو رسائلك أو أي تطبيقات أخرى.",
  },
} satisfies Record<string, LocalizedText>;

export const scenarios: DemoScenario[] = [
  {
    id: "work",
    label: { en: "My work", ar: "عملي" },
    recognition: {
      en: "You paused a client launch decision nine days ago.",
      ar: "توقفت عن قرار إطلاق مشروع للعميل قبل تسعة أيام.",
    },
    threadTitle: { en: "Client portal launch", ar: "إطلاق بوابة العميل" },
    threadDescription: {
      en: "A launch decision scattered across email, notes, an AI chat, and the calendar.",
      ar: "قرار إطلاق موزّع بين البريد والملاحظات ومحادثة ذكاء اصطناعي والتقويم.",
    },
    fragments: [
      {
        id: "w-email-client",
        source: { en: "Client email", ar: "بريد العميل" },
        time: { en: "9 days ago", ar: "قبل 9 أيام" },
        text: { en: "The revised launch date works for us.", ar: "موعد الإطلاق المعدّل مناسب لنا." },
        kind: "source",
        relevant: true,
      },
      {
        id: "w-note-decision",
        source: { en: "Your note", ar: "ملاحظتك" },
        time: { en: "11 days ago", ar: "قبل 11 يومًا" },
        text: {
          en: "Do not launch until compliance review is complete.",
          ar: "لا تطلق البوابة قبل اكتمال مراجعة الامتثال.",
        },
        kind: "fact",
        relevant: true,
      },
      {
        id: "w-reviewer",
        source: { en: "Reviewer message", ar: "رسالة المراجع" },
        time: { en: "4 days ago", ar: "قبل 4 أيام" },
        text: {
          en: "Please send the data-retention document before final approval.",
          ar: "يرجى إرسال مستند الاحتفاظ بالبيانات قبل الموافقة النهائية.",
        },
        kind: "source",
        relevant: true,
      },
      {
        id: "w-calendar",
        source: { en: "Calendar", ar: "التقويم" },
        time: { en: "Tomorrow", ar: "غدًا" },
        text: { en: "Provisional portal launch", ar: "إطلاق مبدئي للبوابة" },
        kind: "source",
        relevant: true,
      },
      {
        id: "w-ai",
        source: { en: "AI conversation", ar: "محادثة ذكاء اصطناعي" },
        time: { en: "10 days ago", ar: "قبل 10 أيام" },
        text: {
          en: "Draft a client update immediately after the document is sent.",
          ar: "اكتب تحديثًا للعميل فور إرسال المستند.",
        },
        kind: "inference",
        relevant: true,
      },
      {
        id: "w-old-note",
        source: { en: "Old launch note", ar: "ملاحظة إطلاق قديمة" },
        time: { en: "3 weeks ago", ar: "قبل 3 أسابيع" },
        text: { en: "Target launch: last Thursday", ar: "موعد الإطلاق المستهدف: الخميس الماضي" },
        kind: "stale",
        relevant: false,
      },
    ],
    previousState: {
      en: "The portal was ready to launch after one final compliance review.",
      ar: "كانت البوابة جاهزة للإطلاق بعد مراجعة امتثال أخيرة.",
    },
    previousStateSourceIds: ["w-note-decision", "w-old-note"],
    currentState: {
      en: "Launch remains blocked until the requested document is sent and compliance approval is recorded.",
      ar: "ما زال الإطلاق متوقفًا حتى إرسال المستند المطلوب وتسجيل موافقة الامتثال.",
    },
    currentStateSourceIds: ["w-note-decision", "w-reviewer", "w-calendar"],
    objective: {
      en: "Release the client portal without bypassing the compliance decision.",
      ar: "إطلاق بوابة العميل من دون تجاوز قرار الامتثال.",
    },
    objectiveSourceIds: ["w-note-decision", "w-email-client"],
    changes: [
      {
        text: { en: "The client accepted the revised launch date.", ar: "وافق العميل على موعد الإطلاق المعدّل." },
        sourceIds: ["w-email-client"],
      },
      {
        text: { en: "The reviewer requested one additional document.", ar: "طلب المراجع مستندًا إضافيًا واحدًا." },
        sourceIds: ["w-reviewer"],
      },
    ],
    commitments: [
      {
        text: { en: "Send the data-retention document to the reviewer.", ar: "إرسال مستند الاحتفاظ بالبيانات إلى المراجع." },
        owner: { en: "You", ar: "أنت" },
        status: { en: "Open", ar: "مفتوح" },
        sourceIds: ["w-reviewer"],
      },
      {
        text: { en: "Provide final compliance approval after review.", ar: "إصدار موافقة الامتثال النهائية بعد المراجعة." },
        owner: { en: "Compliance reviewer", ar: "مراجع الامتثال" },
        status: { en: "Waiting on document", ar: "بانتظار المستند" },
        sourceIds: ["w-reviewer"],
      },
    ],
    dependencies: [
      {
        text: { en: "Portal launch depends on final compliance approval.", ar: "يعتمد إطلاق البوابة على موافقة الامتثال النهائية." },
        owner: { en: "Compliance reviewer", ar: "مراجع الامتثال" },
        status: { en: "Blocked", ar: "متوقف" },
        sourceIds: ["w-note-decision", "w-reviewer"],
      },
    ],
    missingInformation: [
      {
        text: { en: "Whether approval can arrive before the provisional launch date.", ar: "ما إذا كانت الموافقة ستصل قبل موعد الإطلاق المبدئي." },
        impact: { en: "Determines whether the calendar date remains feasible.", ar: "يحدد ما إذا كان موعد التقويم ما زال ممكنًا." },
      },
    ],
    owners: [{ en: "You", ar: "أنت" }, { en: "Compliance reviewer", ar: "مراجع الامتثال" }, { en: "Client", ar: "العميل" }],
    decision: {
      statement: { en: "Do not launch before compliance approval.", ar: "لا تطلق قبل موافقة الامتثال." },
      rationale: {
        en: "You explicitly chose risk control over the original date.",
        ar: "اخترت بوضوح ضبط المخاطر بدل الالتزام بالموعد الأصلي.",
      },
      sourceIds: ["w-note-decision", "w-old-note"],
    },
    openLoop: {
      statement: { en: "The data-retention document has not been sent.", ar: "لم يُرسل مستند الاحتفاظ بالبيانات بعد." },
      sourceIds: ["w-reviewer"],
    },
    suggestedNextAction: {
      en: "Send the requested document, then notify the client immediately.",
      ar: "أرسل المستند المطلوب، ثم أبلغ العميل فورًا.",
    },
    correctionOutcomes: {
      correct: {
        updatedState: { en: "The immediate client update is confirmed as part of the current plan.", ar: "تم تأكيد تحديث العميل فورًا كجزء من الخطة الحالية." },
        nextAction: { en: "Send the requested document, then notify the client immediately.", ar: "أرسل المستند المطلوب، ثم أبلغ العميل فورًا." },
      },
      partial: {
        updatedState: { en: "A client update is intended, but its timing depends on reviewer receipt.", ar: "يوجد تحديث مقصود للعميل، لكن توقيته يعتمد على استلام المراجع." },
        nextAction: { en: "Send the document first. Update the client after the reviewer confirms receipt.", ar: "أرسل المستند أولًا. حدّث العميل بعد أن يؤكد المراجع الاستلام." },
      },
      outdated: {
        updatedState: { en: "The earlier immediate-update draft is no longer treated as current.", ar: "لم تعد مسودة التحديث الفوري السابقة تُعامل كحالة حالية." },
        nextAction: { en: "Send the document first. Update the client after the reviewer confirms receipt.", ar: "أرسل المستند أولًا. حدّث العميل بعد أن يؤكد المراجع الاستلام." },
      },
      unrelated: {
        updatedState: { en: "The AI draft is retained as source material, not as an accepted decision.", ar: "يُحتفظ بمسودة الذكاء الاصطناعي كمادة مصدر، لا كقرار مقبول." },
        nextAction: { en: "Send the document first. Confirm the communication timing separately.", ar: "أرسل المستند أولًا. أكّد توقيت التواصل بشكل منفصل." },
      },
      missing: {
        updatedState: { en: "The communication timing remains unresolved and needs one explicit decision.", ar: "ما زال توقيت التواصل غير محسوم ويحتاج إلى قرار صريح واحد." },
        nextAction: { en: "Send the document, then decide when the client should be updated.", ar: "أرسل المستند، ثم قرر متى يجب تحديث العميل." },
      },
    },
    nextActionSourceIds: ["w-reviewer", "w-note-decision", "w-ai"],
    uncertainItem: {
      statement: {
        en: "You may have decided to notify the client immediately after sending the document.",
        ar: "ربما قررت إبلاغ العميل فور إرسال المستند.",
      },
      sourceIds: ["w-ai", "w-email-client"],
      confidence: 0.62,
    },
    returnPreview: {
      newFragment: { en: "Reviewer: Document received.", ar: "المراجع: تم استلام المستند." },
      changed: { en: "Compliance review is now active.", ar: "مراجعة الامتثال قيد التنفيذ الآن." },
      stillOpen: { en: "Final approval has not arrived.", ar: "لم تصل الموافقة النهائية بعد." },
      nextAction: { en: "Wait for approval before launching.", ar: "انتظر الموافقة قبل الإطلاق." },
    },
  },
  {
    id: "life",
    label: { en: "My life", ar: "حياتي" },
    recognition: {
      en: "You compared tutors for two weeks, then paused before booking the trial.",
      ar: "قارنت بين المدرسين لأسبوعين، ثم توقفت قبل حجز الحصة التجريبية.",
    },
    threadTitle: { en: "Choosing a maths tutor", ar: "اختيار مدرس رياضيات" },
    threadDescription: {
      en: "Preferences, messages, and rejected options spread across several days.",
      ar: "تفضيلات ورسائل وخيارات مرفوضة موزّعة على عدة أيام.",
    },
    fragments: [
      {
        id: "l-note",
        source: { en: "Your note", ar: "ملاحظتك" },
        time: { en: "13 days ago", ar: "قبل 13 يومًا" },
        text: { en: "Evening availability matters more than the lowest price.", ar: "التوفر مساءً أهم من أقل سعر." },
        kind: "fact",
        relevant: true,
      },
      {
        id: "l-whatsapp-a",
        source: { en: "Tutor A message", ar: "رسالة المدرس أ" },
        time: { en: "8 days ago", ar: "قبل 8 أيام" },
        text: { en: "I only have weekday mornings available.", ar: "المتاح لدي صباح أيام الأسبوع فقط." },
        kind: "source",
        relevant: true,
      },
      {
        id: "l-whatsapp-b",
        source: { en: "Tutor B message", ar: "رسالة المدرس ب" },
        time: { en: "5 days ago", ar: "قبل 5 أيام" },
        text: { en: "Thursday evening trial is possible; please confirm.", ar: "يمكن إجراء حصة تجريبية مساء الخميس؛ يرجى التأكيد." },
        kind: "source",
        relevant: true,
      },
      {
        id: "l-calendar",
        source: { en: "Family calendar", ar: "تقويم العائلة" },
        time: { en: "Thursday", ar: "الخميس" },
        text: { en: "School event ends at 5:30 pm.", ar: "تنتهي فعالية المدرسة الساعة 5:30 مساءً." },
        kind: "source",
        relevant: true,
      },
      {
        id: "l-screenshot",
        source: { en: "Saved screenshot", ar: "لقطة شاشة محفوظة" },
        time: { en: "2 weeks ago", ar: "قبل أسبوعين" },
        text: { en: "Tutor C profile—no verified references.", ar: "ملف المدرس ج — لا توجد مراجع موثقة." },
        kind: "stale",
        relevant: false,
      },
      {
        id: "l-inference",
        source: { en: "Ulomis inference", ar: "استنتاج أولوميس" },
        time: { en: "Needs confirmation", ar: "يحتاج تأكيدًا" },
        text: { en: "Price may be the deciding factor.", ar: "قد يكون السعر هو العامل الحاسم." },
        kind: "inference",
        relevant: true,
      },
    ],
    previousState: {
      en: "Three tutors were under consideration, with no trial booked.",
      ar: "كان هناك ثلاثة مدرسين قيد المقارنة من دون حجز حصة تجريبية.",
    },
    previousStateSourceIds: ["l-note", "l-whatsapp-a", "l-whatsapp-b", "l-screenshot"],
    currentState: {
      en: "Tutor B is the only feasible option shown, but the Thursday trial is still unconfirmed.",
      ar: "المدرس ب هو الخيار الممكن الوحيد الظاهر، لكن الحصة التجريبية يوم الخميس لم تُؤكد بعد.",
    },
    currentStateSourceIds: ["l-note", "l-whatsapp-a", "l-whatsapp-b", "l-calendar"],
    objective: { en: "Choose a reliable tutor who can meet after school.", ar: "اختيار مدرس موثوق ومتفرغ بعد المدرسة." },
    objectiveSourceIds: ["l-note", "l-calendar"],
    changes: [
      {
        text: { en: "Tutor A is no longer feasible because mornings do not work.", ar: "لم يعد المدرس أ مناسبًا لأن الفترة الصباحية لا تناسبك." },
        sourceIds: ["l-whatsapp-a", "l-note"],
      },
      {
        text: { en: "Tutor B offered a Thursday evening trial.", ar: "عرض المدرس ب حصة تجريبية مساء الخميس." },
        sourceIds: ["l-whatsapp-b"],
      },
    ],
    commitments: [
      {
        text: { en: "Confirm or decline the Thursday trial.", ar: "تأكيد الحصة التجريبية يوم الخميس أو الاعتذار عنها." },
        owner: { en: "You", ar: "أنت" },
        status: { en: "Open", ar: "مفتوح" },
        sourceIds: ["l-whatsapp-b"],
      },
    ],
    dependencies: [
      {
        text: { en: "The trial depends on enough travel time after the school event.", ar: "تعتمد الحصة التجريبية على توفر وقت كافٍ بعد فعالية المدرسة." },
        owner: { en: "Family schedule", ar: "جدول العائلة" },
        status: { en: "Needs confirmation", ar: "يحتاج تأكيدًا" },
        sourceIds: ["l-calendar", "l-whatsapp-b"],
      },
    ],
    missingInformation: [
      {
        text: { en: "Tutor B's verified references and final fee.", ar: "المراجع الموثقة للمدرس ب والسعر النهائي." },
        impact: { en: "Needed before making a longer-term commitment.", ar: "مطلوبان قبل الالتزام على المدى الأطول." },
      },
    ],
    owners: [{ en: "You", ar: "أنت" }, { en: "Tutor B", ar: "المدرس ب" }],
    decision: {
      statement: { en: "Prioritize evening availability and verified references.", ar: "أعطِ الأولوية للتوفر مساءً والمراجع الموثقة." },
      rationale: { en: "Those constraints were more important than the lowest fee.", ar: "هاتان النقطتان أهم من الحصول على أقل سعر." },
      sourceIds: ["l-note", "l-screenshot"],
    },
    openLoop: {
      statement: { en: "Tutor B is waiting for confirmation of the trial.", ar: "المدرس ب ينتظر تأكيد الحصة التجريبية." },
      sourceIds: ["l-whatsapp-b", "l-calendar"],
    },
    suggestedNextAction: { en: "Compare Tutor B's fee before replying.", ar: "قارن سعر المدرس ب قبل الرد." },
    correctionOutcomes: {
      correct: {
        updatedState: { en: "Price is confirmed as the deciding factor before booking.", ar: "تم تأكيد أن السعر هو العامل الحاسم قبل الحجز." },
        nextAction: { en: "Ask Tutor B for the final fee before replying.", ar: "اطلب من المدرس ب السعر النهائي قبل الرد." },
      },
      partial: {
        updatedState: { en: "Price matters, but evening availability remains the stronger constraint.", ar: "السعر مهم، لكن التوفر مساءً ما زال القيد الأقوى." },
        nextAction: { en: "Confirm the trial and ask for the final fee in the same message.", ar: "أكّد الحصة واطلب السعر النهائي في الرسالة نفسها." },
      },
      outdated: {
        updatedState: { en: "The price-first assumption is no longer current.", ar: "لم يعد افتراض أولوية السعر قائمًا." },
        nextAction: { en: "Confirm the Thursday trial with Tutor B.", ar: "أكّد الحصة التجريبية يوم الخميس مع المدرس ب." },
      },
      unrelated: {
        updatedState: { en: "The price inference is removed from this decision thread.", ar: "تمت إزالة استنتاج السعر من خيط القرار هذا." },
        nextAction: { en: "Confirm the Thursday trial with Tutor B.", ar: "أكّد الحصة التجريبية يوم الخميس مع المدرس ب." },
      },
      missing: {
        updatedState: { en: "Verified references remain a missing decision input.", ar: "ما زالت المراجع الموثقة مدخلًا مفقودًا للقرار." },
        nextAction: { en: "Confirm the trial and request verified references.", ar: "أكّد الحصة واطلب مراجع موثقة." },
      },
    },
    nextActionSourceIds: ["l-whatsapp-b", "l-calendar", "l-note", "l-inference"],
    uncertainItem: {
      statement: { en: "Price may be the deciding factor.", ar: "قد يكون السعر هو العامل الحاسم." },
      sourceIds: ["l-inference", "l-note"],
      confidence: 0.48,
    },
    returnPreview: {
      newFragment: { en: "Tutor B confirmed the 6:00 pm trial.", ar: "أكد المدرس ب الحصة التجريبية الساعة 6 مساءً." },
      changed: { en: "The trial is booked.", ar: "تم حجز الحصة التجريبية." },
      stillOpen: { en: "You still need to assess teaching fit.", ar: "ما زلت بحاجة إلى تقييم ملاءمة أسلوب التدريس." },
      nextAction: { en: "Attend the trial and record the decision.", ar: "احضر الحصة وسجّل القرار." },
    },
  },
  {
    id: "household",
    label: { en: "My household", ar: "منزلي" },
    recognition: {
      en: "The car registration thread is split between WhatsApp, a reminder, and one person's memory.",
      ar: "خيط تجديد تسجيل السيارة موزّع بين واتساب وتذكير وذاكرة شخص واحد.",
    },
    threadTitle: { en: "Renewing the family car registration", ar: "تجديد تسجيل سيارة العائلة" },
    threadDescription: {
      en: "A household responsibility with dates, provider messages, and one missing document.",
      ar: "مسؤولية منزلية فيها مواعيد ورسائل مقدم خدمة ومستند واحد مفقود.",
    },
    fragments: [
      {
        id: "h-reminder",
        source: { en: "Phone reminder", ar: "تذكير الهاتف" },
        time: { en: "In 12 days", ar: "بعد 12 يومًا" },
        text: { en: "Registration expires.", ar: "ينتهي تسجيل السيارة." },
        kind: "source",
        relevant: true,
      },
      {
        id: "h-provider",
        source: { en: "Inspection centre message", ar: "رسالة مركز الفحص" },
        time: { en: "6 days ago", ar: "قبل 6 أيام" },
        text: { en: "Inspection passed; certificate is valid for 30 days.", ar: "تم اجتياز الفحص؛ الشهادة صالحة لمدة 30 يومًا." },
        kind: "source",
        relevant: true,
      },
      {
        id: "h-family",
        source: { en: "Family WhatsApp", ar: "واتساب العائلة" },
        time: { en: "5 days ago", ar: "قبل 5 أيام" },
        text: { en: "The insurance document should be in the blue folder.", ar: "يفترض أن تكون وثيقة التأمين في الملف الأزرق." },
        kind: "source",
        relevant: true,
      },
      {
        id: "h-note",
        source: { en: "Your note", ar: "ملاحظتك" },
        time: { en: "4 days ago", ar: "قبل 4 أيام" },
        text: { en: "Use the online renewal route this year.", ar: "استخدم التجديد الإلكتروني هذا العام." },
        kind: "fact",
        relevant: true,
      },
      {
        id: "h-old",
        source: { en: "Old provider contact", ar: "جهة اتصال قديمة" },
        time: { en: "Last year", ar: "العام الماضي" },
        text: { en: "Call the service desk to renew.", ar: "اتصل بمكتب الخدمة للتجديد." },
        kind: "stale",
        relevant: false,
      },
      {
        id: "h-contradiction",
        source: { en: "Recent family message", ar: "رسالة عائلية حديثة" },
        time: { en: "Yesterday", ar: "أمس" },
        text: { en: "The blue folder is empty; insurance may be in email.", ar: "الملف الأزرق فارغ؛ قد تكون وثيقة التأمين في البريد." },
        kind: "contradiction",
        relevant: true,
      },
    ],
    previousState: {
      en: "The inspection was complete and the insurance document was believed to be in the blue folder.",
      ar: "اكتمل الفحص وكان الاعتقاد أن وثيقة التأمين في الملف الأزرق.",
    },
    previousStateSourceIds: ["h-provider", "h-family"],
    currentState: {
      en: "The inspection is valid, but online renewal cannot continue until the current insurance document is found.",
      ar: "الفحص صالح، لكن لا يمكن متابعة التجديد الإلكتروني حتى العثور على وثيقة التأمين الحالية.",
    },
    currentStateSourceIds: ["h-provider", "h-family", "h-contradiction", "h-note"],
    objective: { en: "Renew the registration before expiry without repeating the inspection.", ar: "تجديد التسجيل قبل انتهائه من دون إعادة الفحص." },
    objectiveSourceIds: ["h-reminder", "h-provider", "h-note"],
    changes: [
      {
        text: { en: "The inspection passed and its certificate is still valid.", ar: "تم اجتياز الفحص وما زالت الشهادة صالحة." },
        sourceIds: ["h-provider"],
      },
      {
        text: { en: "The expected insurance document is not in the blue folder.", ar: "وثيقة التأمين المتوقعة ليست في الملف الأزرق." },
        sourceIds: ["h-family", "h-contradiction"],
      },
    ],
    commitments: [
      {
        text: { en: "Locate the current insurance document and complete renewal before expiry.", ar: "العثور على وثيقة التأمين الحالية وإكمال التجديد قبل الانتهاء." },
        owner: { en: "Household coordinator", ar: "منسق شؤون المنزل" },
        status: { en: "Open", ar: "مفتوح" },
        sourceIds: ["h-reminder", "h-contradiction"],
      },
    ],
    dependencies: [
      {
        text: { en: "Online renewal depends on the current insurance PDF.", ar: "يعتمد التجديد الإلكتروني على ملف التأمين الحالي." },
        owner: { en: "Household", ar: "المنزل" },
        status: { en: "Missing", ar: "مفقود" },
        sourceIds: ["h-family", "h-contradiction"],
      },
    ],
    missingInformation: [
      {
        text: { en: "Which inbox contains the current insurance PDF.", ar: "أي صندوق بريد يحتوي على ملف التأمين الحالي." },
        impact: { en: "Blocks the online renewal path.", ar: "يوقف مسار التجديد الإلكتروني." },
      },
    ],
    owners: [{ en: "Household coordinator", ar: "منسق شؤون المنزل" }, { en: "Inspection centre", ar: "مركز الفحص" }],
    decision: {
      statement: { en: "Use the online renewal route.", ar: "استخدم مسار التجديد الإلكتروني." },
      rationale: { en: "You chose it to avoid an unnecessary service-centre visit.", ar: "اخترته لتجنب زيارة غير ضرورية إلى مركز الخدمة." },
      sourceIds: ["h-note", "h-old"],
    },
    openLoop: {
      statement: { en: "The current insurance document still needs to be found.", ar: "ما زال يجب العثور على وثيقة التأمين الحالية." },
      sourceIds: ["h-family", "h-contradiction"],
    },
    suggestedNextAction: { en: "Call the service desk about the missing document.", ar: "اتصل بمكتب الخدمة بشأن المستند المفقود." },
    correctionOutcomes: {
      correct: {
        updatedState: { en: "The blue folder remains the accepted location despite the conflicting message.", ar: "ما زال الملف الأزرق هو الموقع المقبول رغم الرسالة المتعارضة." },
        nextAction: { en: "Check the blue folder once more before changing the plan.", ar: "تحقق من الملف الأزرق مرة أخرى قبل تغيير الخطة." },
      },
      partial: {
        updatedState: { en: "The document may exist in paper or email form; both paths remain plausible.", ar: "قد توجد الوثيقة ورقيًا أو في البريد؛ وما زال المساران محتملين." },
        nextAction: { en: "Check the folder and search email before contacting the service desk.", ar: "تحقق من الملف وابحث في البريد قبل الاتصال بمكتب الخدمة." },
      },
      outdated: {
        updatedState: { en: "The blue-folder location is marked outdated.", ar: "تم تعليم موقع الملف الأزرق كحالة قديمة." },
        nextAction: { en: "Search email for the current insurance PDF, then renew online.", ar: "ابحث في البريد عن ملف التأمين الحالي، ثم جدّد إلكترونيًا." },
      },
      unrelated: {
        updatedState: { en: "The old paper-location claim is excluded from the current renewal state.", ar: "تم استبعاد ادعاء الموقع الورقي القديم من حالة التجديد الحالية." },
        nextAction: { en: "Search email for the current insurance PDF, then renew online.", ar: "ابحث في البريد عن ملف التأمين الحالي، ثم جدّد إلكترونيًا." },
      },
      missing: {
        updatedState: { en: "The responsible inbox is still unknown.", ar: "ما زال صندوق البريد المسؤول غير معروف." },
        nextAction: { en: "Ask which inbox received the policy, then search it for the PDF.", ar: "اسأل أي صندوق بريد استلم الوثيقة، ثم ابحث فيه عن الملف." },
      },
    },
    nextActionSourceIds: ["h-note", "h-family", "h-contradiction", "h-old"],
    uncertainItem: {
      statement: { en: "The paper insurance document may still be in the blue folder.", ar: "قد تظل وثيقة التأمين الورقية في الملف الأزرق." },
      sourceIds: ["h-family", "h-contradiction"],
      confidence: 0.35,
    },
    returnPreview: {
      newFragment: { en: "Insurance PDF found in email.", ar: "تم العثور على ملف التأمين في البريد." },
      changed: { en: "All required documents are now available.", ar: "جميع المستندات المطلوبة متاحة الآن." },
      stillOpen: { en: "The online renewal has not been submitted.", ar: "لم يُرسل طلب التجديد الإلكتروني بعد." },
      nextAction: { en: "Complete the online renewal today.", ar: "أكمل التجديد الإلكتروني اليوم." },
    },
  },
];

export function t(value: LocalizedText, language: Language): string {
  return value[language];
}
