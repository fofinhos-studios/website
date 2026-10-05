import { GithubLogoIcon, TranslateIcon } from "@phosphor-icons/react";
import type { Dispatch, StateUpdater } from "preact/hooks";
import { copy, type Locale } from "../content";
import styles from "./Header.module.css";

type HeaderProps = {
  locale: Locale;
  setLocale: Dispatch<StateUpdater<Locale>>;
};

export function Header({ locale, setLocale }: HeaderProps) {
  const text = copy[locale];

  return (
    <header className={styles.header}>
      <nav className={styles.controls} aria-label="Site links and controls">
        <a
          className={styles.iconButton}
          href="https://github.com/fofinhos-studios"
          target="_blank"
          rel="noreferrer"
          aria-label={text.githubLabel}
          title={text.githubLabel}
        >
          <GithubLogoIcon size={18} weight="fill" aria-hidden="true" />
        </a>
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
      </nav>
    </header>
  );
}
