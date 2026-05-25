import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ar, en } from "@/lib/i18n/translations";

export type Language = "ar" | "en";

type TranslationTree = Record<string, any>;

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
  dir: "rtl" | "ltr";
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}

function lookup(obj: TranslationTree, key: string): string {
  const parts = key.split(".");
  let val: any = obj;
  for (const p of parts) {
    val = val?.[p];
    if (val === undefined) return key;
  }
  return typeof val === "string" ? val : key;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem("lang") as Language) ?? "ar";
  });

  const setLang = (l: Language) => {
    localStorage.setItem("lang", l);
    setLangState(l);
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = l;
  };

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  const translations = lang === "ar" ? ar : en;
  const t = (key: string) => lookup(translations, key);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir: lang === "ar" ? "rtl" : "ltr" }}>
      {children}
    </LanguageContext.Provider>
  );
}
