import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type React from "react";

export type PublicLanguage = "es" | "en";

type LanguageContextValue = {
  language: PublicLanguage;
  setLanguage: (language: PublicLanguage) => void;
  pick: (spanish: string, english: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function languageFromUrl(): PublicLanguage {
  return new URLSearchParams(window.location.search).get("lang") === "en" ? "en" : "es";
}

function updateMeta(selector: string, content: string) {
  document.querySelector<HTMLMetaElement>(selector)?.setAttribute("content", content);
}

function updateLink(rel: string, href: string, hrefLang?: string) {
  const selector = hrefLang ? `link[rel="${rel}"][hreflang="${hrefLang}"]` : `link[rel="${rel}"]:not([hreflang])`;
  let link = document.querySelector<HTMLLinkElement>(selector);
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    if (hrefLang) link.hreflang = hrefLang;
    document.head.appendChild(link);
  }
  link.href = href;
}

export function PublicLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<PublicLanguage>(languageFromUrl);

  const setLanguage = (nextLanguage: PublicLanguage) => {
    const url = new URL(window.location.href);
    if (nextLanguage === "en") url.searchParams.set("lang", "en");
    else url.searchParams.delete("lang");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    setLanguageState(nextLanguage);
  };

  useEffect(() => {
    const title = language === "en" ? "Pacifica Cleaning | Professional cleaning in Guanacaste" : "Pacifica Cleaning | Limpieza profesional en Guanacaste";
    const description = language === "en"
      ? "Professional residential, deep, recurring and vacation-rental cleaning services in Guanacaste, Costa Rica."
      : "Servicios profesionales de limpieza residencial, profunda, recurrente y para propiedades vacacionales en Guanacaste, Costa Rica.";
    document.documentElement.lang = language;
    document.title = title;
    updateMeta('meta[name="description"]', description);
    updateMeta('meta[property="og:title"]', title);
    updateMeta('meta[property="og:description"]', description);
    updateMeta('meta[property="og:locale"]', language === "en" ? "en_US" : "es_CR");
    updateMeta('meta[name="twitter:title"]', title);
    updateMeta('meta[name="twitter:description"]', description);
    const canonical = new URL(window.location.href);
    canonical.hash = "";
    updateLink("canonical", canonical.toString());
    const spanish = new URL(canonical);
    spanish.searchParams.delete("lang");
    const english = new URL(canonical);
    english.searchParams.set("lang", "en");
    updateLink("alternate", spanish.toString(), "es");
    updateLink("alternate", english.toString(), "en");
    updateLink("alternate", spanish.toString(), "x-default");
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    pick: (spanish, english) => language === "en" ? english : spanish
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function usePublicLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("usePublicLanguage must be used inside PublicLanguageProvider");
  return context;
}
