import { ArrowDownIcon, LinkedinLogoIcon } from "@phosphor-icons/react";
import { copy, type Locale } from "../content";
import { GalaxyCanvas } from "./GalaxyCanvas";
import styles from "./Hero.module.css";

const linkedIn = {
  camila: "https://www.linkedin.com/in/camilabisson/",
  felipe: "https://www.linkedin.com/in/fscustodio/",
};

export function Hero({ locale }: { locale: Locale }) {
  const text = copy[locale];
  return (
    <section className={styles.hero} id="top" aria-labelledby="hero-title">
      <GalaxyCanvas />
      <div className={styles.fallbackHearts} aria-hidden="true">
        <i />
        <i />
      </div>
      <div className={styles.content}>
        <div className={styles.identity}>
          <h1 id="hero-title">{text.heroTitle}</h1>
          <div className={styles.people}>
            <a
              href={linkedIn.camila}
              target="_blank"
              rel="noreferrer"
              aria-label={`${text.linkedinLabel}: ${text.camilaRole}`}
            >
              <span aria-hidden="true">💜</span>
              <span>{text.camilaRole}</span>
              <LinkedinLogoIcon size={15} weight="fill" aria-hidden="true" />
            </a>
            <a
              href={linkedIn.felipe}
              target="_blank"
              rel="noreferrer"
              aria-label={`${text.linkedinLabel}: ${text.felipeRole}`}
            >
              <span aria-hidden="true">🧡</span>
              <span>{text.felipeRole}</span>
              <LinkedinLogoIcon size={15} weight="fill" aria-hidden="true" />
            </a>
          </div>
        </div>
        <a href="#projects" className={styles.cta}>
          <span>{text.heroCta}</span>
          <ArrowDownIcon size={17} weight="bold" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
