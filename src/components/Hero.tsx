import { ArrowDownIcon } from "@phosphor-icons/react";
import { copy, type Locale } from "../content";
import { GalaxyCanvas } from "./GalaxyCanvas";
import styles from "./Hero.module.css";

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
        <h1 id="hero-title">{text.heroTitle}</h1>
        <a href="#projects" className={styles.cta}>
          <span>{text.heroCta}</span>
          <ArrowDownIcon size={17} weight="bold" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
