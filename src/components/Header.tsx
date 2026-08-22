import { MoonStarsIcon, SunIcon, TranslateIcon } from "@phosphor-icons/react";
import type { Dispatch, StateUpdater } from "preact/hooks";
import { copy, type Locale } from "../content";
import styles from "./Header.module.css";

type Theme = "light" | "dark";

type HeaderProps = {
  locale: Locale;
  setLocale: Dispatch<StateUpdater<Locale>>;
  theme: Theme;
  setTheme: Dispatch<StateUpdater<Theme>>;
};

export function Header({ locale, setLocale, theme, setTheme }: HeaderProps) {
  const text = copy[locale];
  const isDark = theme === "dark";

  return (
    <header className={styles.header}>
      <a className={styles.mark} href="#top" aria-label="Fofinhos Studio">
        <span aria-hidden="true">💜</span>
        <span aria-hidden="true">🧡</span>
        <span className={styles.srOnly}>Fofinhos Studio</span>
      </a>
      <nav className={styles.controls} aria-label="Site controls">
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => setLocale(locale === "en" ? "pt-BR" : "en")}
          aria-label={text.languageLabel}
          title={text.languageLabel}
        >
          <TranslateIcon size={18} weight="bold" aria-hidden="true" />
          <span className={styles.locale}>{locale === "en" ? "PT" : "EN"}</span>
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label={text.themeLabel}
          title={isDark ? text.lightTheme : text.darkTheme}
        >
          {isDark ? (
            <SunIcon size={18} weight="fill" aria-hidden="true" />
          ) : (
            <MoonStarsIcon size={18} weight="fill" aria-hidden="true" />
          )}
        </button>
      </nav>
    </header>
  );
}
