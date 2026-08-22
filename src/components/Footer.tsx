import { GithubLogoIcon, LinkedinLogoIcon } from "@phosphor-icons/react";
import { copy, type Locale } from "../content";
import styles from "./Footer.module.css";

const linkedIn = {
  camila: "https://www.linkedin.com/in/camilabisson/",
  felipe: "https://www.linkedin.com/in/fscustodio/",
};

export function Footer({ locale }: { locale: Locale }) {
  const text = copy[locale];
  return (
    <footer className={styles.footer}>
      <div className={styles.people}>
        <a href={linkedIn.camila} target="_blank" rel="noreferrer">
          <span>💜</span>
          {text.camilaRole}
          <LinkedinLogoIcon
            aria-label={text.linkedinLabel}
            size={16}
            weight="fill"
          />
        </a>
        <a href={linkedIn.felipe} target="_blank" rel="noreferrer">
          <span>🧡</span>
          {text.felipeRole}
          <LinkedinLogoIcon
            aria-label={text.linkedinLabel}
            size={16}
            weight="fill"
          />
        </a>
      </div>
      <a
        className={styles.github}
        href="https://github.com/fofinhos-studios"
        target="_blank"
        rel="noreferrer"
        aria-label={text.githubLabel}
      >
        <GithubLogoIcon size={21} weight="fill" />
      </a>
    </footer>
  );
}
