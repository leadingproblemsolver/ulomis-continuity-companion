import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "en" | "ar";

const STORAGE_KEY = "ulomis-locale";

export const LOCALE_DIR: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  ar: "rtl",
};

export const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
};

interface LocaleContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  /** True once the client has resolved the stored/preferred locale. */
  ready: boolean;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  dir: "ltr",
  setLocale: () => {},
  ready: false,
});

function isLocale(value: string | null): value is Locale {
  return value === "en" || value === "ar";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Server renders English; the init script below fixes `lang`/`dir` before
  // first paint so an Arabic visitor never sees a left-to-right flash.
  const [locale, setLocaleState] = useState<Locale>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) {
      setLocaleState(stored);
    } else if (navigator.language?.toLowerCase().startsWith("ar")) {
      setLocaleState("ar");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = LOCALE_DIR[locale];
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setLocaleState(next);
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, dir: LOCALE_DIR[locale], setLocale, ready }}>
      {children}
    </LocaleContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLocale = () => useContext(LocaleContext);

/**
 * Picks the right side of a bilingual record. Keeping content as
 * `{ en, ar }` pairs rather than flat keys means a missing Arabic string is a
 * type error at build time instead of an English word leaking into an Arabic
 * page at runtime.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useText() {
  const { locale } = useLocale();
  return useCallback((value: Record<Locale, string>) => value[locale], [locale]);
}

/** Applies the stored locale's lang/dir before first paint. */
export const localeInitScript = `(function(){try{var l=localStorage.getItem("${STORAGE_KEY}");if(l!=="en"&&l!=="ar"){l=(navigator.language||"").toLowerCase().indexOf("ar")===0?"ar":"en";}document.documentElement.lang=l;document.documentElement.dir=l==="ar"?"rtl":"ltr";}catch(e){}})();`;
