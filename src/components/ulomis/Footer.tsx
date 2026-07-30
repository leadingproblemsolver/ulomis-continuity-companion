import { UlomisMark } from "./UlomisMark";

export function Footer() {
  return (
    <footer className="border-t border-border py-10 pb-24 sm:pb-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <UlomisMark size={26} state="idle" decorative />
          <span className="font-display text-sm font-semibold">Ulomis</span>
          <span className="text-sm text-muted-foreground" dir="rtl" lang="ar">
            أولوميس
          </span>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>Your digital life, continued.</p>
          <p className="mt-1 text-xs">
            An early preview. Nothing on this page is a live product yet.
          </p>
        </div>
      </div>
    </footer>
  );
}
