/**
 * Trust principles.
 *
 * These are behavioural commitments, stated in terms of what Ulomis does and
 * doesn't do. Nothing here claims an infrastructure or security property the
 * product hasn't built yet.
 */
export interface TrustPrinciple {
  title: string;
  body: string;
}

export const principles: TrustPrinciple[] = [
  {
    title: "You control it",
    body: "A thread starts when you start one and closes when you close it. Continuity is something you keep, not something kept on you.",
  },
  {
    title: "It shows its reasoning",
    body: "Every connection Ulomis makes can be opened up and read. If you can't see why two things were joined, they shouldn't have been.",
  },
  {
    title: "It keeps a thread, not a profile",
    body: "Ulomis holds the shape of what you were doing so you can resume it. Building a picture of who you are is a different product, and not this one.",
  },
  {
    title: "It stays quiet unless it's relevant",
    body: "Surfacing context you didn't need is a cost, not a feature. Most of the time the right behaviour is to stay out of the way entirely.",
  },
  {
    title: "Nothing is asserted that you didn't say",
    body: "Settled points, open loops, and corrections come from your own material. Ulomis does not invent the middle to make a thread look complete.",
  },
  {
    title: "You can always correct it",
    body: "When Ulomis joins the wrong threads, you take the piece back out and everything resting on it changes. Being wrong has to be cheap to fix.",
  },
];
