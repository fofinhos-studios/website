import { useEffect, useState } from "preact/hooks";
import { GalaxyCanvas } from "./components/GalaxyCanvas";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { ProjectGallery } from "./components/ProjectGallery";
import type { Locale } from "./content";

type Theme = "light" | "dark";

const getInitialLocale = (): Locale => {
  const saved = localStorage.getItem("fofinhos-locale");
  if (saved === "en" || saved === "pt-BR") return saved;
  return navigator.language.toLowerCase().startsWith("pt") ? "pt-BR" : "en";
};

const getInitialTheme = (): Theme => {
  const saved = localStorage.getItem("fofinhos-theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export function App() {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = locale;
    localStorage.setItem("fofinhos-theme", theme);
    localStorage.setItem("fofinhos-locale", locale);
  }, [locale, theme]);

  return (
    <div className="site-shell">
      <GalaxyCanvas ambient />
      <Header
        locale={locale}
        setLocale={setLocale}
        theme={theme}
        setTheme={setTheme}
      />
      <main>
        <Hero locale={locale} />
        <ProjectGallery locale={locale} />
      </main>
    </div>
  );
}
