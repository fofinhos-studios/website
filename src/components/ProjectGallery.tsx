import { copy, type Locale, projects } from "../content";
import styles from "./ProjectGallery.module.css";

function ProjectPlaceholder({
  accent,
  title,
}: {
  accent: "orange" | "purple" | "both";
  title: string;
}) {
  return (
    <div
      className={`${styles.placeholder} ${styles[accent]}`}
      aria-hidden="true"
    >
      <div className={styles.orbit} />
      <div className={styles.planet} />
      <span>{title.slice(0, 1)}</span>
      <i />
      <i />
      <i />
    </div>
  );
}

export function ProjectGallery({ locale }: { locale: Locale }) {
  const text = copy[locale];
  return (
    <section
      className={styles.projects}
      id="projects"
      aria-labelledby="projects-title"
    >
      <h2 className={styles.srOnly} id="projects-title">
        {text.navProjects}
      </h2>
      <div className={styles.grid}>
        {projects.map((project) => (
          <a
            className={styles.card}
            href={project.url}
            target="_blank"
            rel="noreferrer"
            aria-label={`${text.visitProject}: ${project.title}`}
            key={project.id}
          >
            <ProjectPlaceholder accent={project.accent} title={project.title} />
            <div className={styles.cardBody}>
              <p className={styles.tag}>{project.tag[locale]}</p>
              <h3>{project.title}</h3>
              <p className={styles.description}>
                {project.description[locale]}
              </p>
              <span className={styles.repo}>/{project.repository}</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
