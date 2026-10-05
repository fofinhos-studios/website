import { useEffect, useState } from "preact/hooks";
import { GalaxyCanvas } from "./components/GalaxyCanvas";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { ProjectGallery } from "./components/ProjectGallery";
import type { Locale } from "./content";

const getInitialLocale = (): Locale => {
  const saved = localStorage.getItem("fofinhos-locale");
  if (saved === "en" || saved === "pt-BR") return saved;
  return navigator.language.toLowerCase().startsWith("pt") ? "pt-BR" : "en";
};

export function App() {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem("fofinhos-locale", locale);
  }, [locale]);

  return (
    <div className="site-shell">
      <GalaxyCanvas ambient />
      <Header locale={locale} setLocale={setLocale} />
      <main>
        <Hero locale={locale} />
        <ProjectGallery locale={locale} />
      </main>
    </div>
  );
}
