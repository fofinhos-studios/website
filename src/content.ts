export type Locale = "en" | "pt-BR";

type Copy = {
  navProjects: string;
  languageLabel: string;
  heroTitle: string;
  heroCta: string;
  visitProject: string;
  camilaRole: string;
  felipeRole: string;
  githubLabel: string;
  linkedinLabel: string;
};

export const copy: Record<Locale, Copy> = {
  en: {
    navProjects: "Projects",
    languageLabel: "Change language",
    heroTitle: "Fofinhos Studio",
    heroCta: "Projects",
    visitProject: "Visit project",
    camilaRole: "Camila · Designer",
    felipeRole: "Felipe · Developer",
    githubLabel: "Visit Fofinhos Studio on GitHub",
    linkedinLabel: "Visit LinkedIn",
  },
  "pt-BR": {
    navProjects: "Projetos",
    languageLabel: "Mudar idioma",
    heroTitle: "Fofinhos Studio",
    heroCta: "Projetos",
    visitProject: "Visitar projeto",
    camilaRole: "Camila · Designer",
    felipeRole: "Felipe · Programador",
    githubLabel: "Visitar Fofinhos Studio no GitHub",
    linkedinLabel: "Visitar LinkedIn",
  },
};

export type Project = {
  id: "minigemu" | "asobi" | "hon" | "salary";
  url: string;
  logo: string;
  title: string;
  repository: string;
  description: Record<Locale, string>;
  tag: Record<Locale, string>;
};

export const projects: Project[] = [
  {
    id: "minigemu",
    url: "https://minigemu.fofinhos.studio/",
    logo: "/project-logos/minigemu.svg",
    title: "minigēmu",
    repository: "minigemu",
    description: {
      en: "Save daily game results and follow your activity, accuracy, and win rates.",
      "pt-BR":
        "Salve resultados de jogos diários e acompanhe sua atividade, precisão e taxa de vitórias.",
    },
    tag: { en: "Daily game tracker", "pt-BR": "Rastreador de jogos diários" },
  },
  {
    id: "asobi",
    url: "https://asobi.fofinhos.studio/",
    logo: "/project-logos/asobi.svg",
    title: "asobi",
    repository: "asobi",
    description: {
      en: "Turn your game backlog into a schedule that fits your available time.",
      "pt-BR":
        "Transforme seu backlog de jogos em um plano para o tempo que você tem.",
    },
    tag: { en: "Backlog planner", "pt-BR": "Planejador de backlog" },
  },
  {
    id: "hon",
    url: "https://hon.fofinhos.studio/",
    logo: "/project-logos/hon.svg",
    title: "hon",
    repository: "hon",
    description: {
      en: "Plan books and audiobooks around your reading days and goals.",
      "pt-BR":
        "Planeje livros e audiolivros de acordo com seus dias e metas de leitura.",
    },
    tag: { en: "Reading planner", "pt-BR": "Planejador de leitura" },
  },
  {
    id: "salary",
    url: "https://salary.fofinhos.studio/",
    logo: "/project-logos/salary.svg",
    title: "tiny salary",
    repository: "salary",
    description: {
      en: "Compare hourly, monthly, and annual salaries across currencies.",
      "pt-BR": "Compare salários por hora, mês ou ano em diferentes moedas.",
    },
    tag: { en: "Salary calculator", "pt-BR": "Calculadora salarial" },
  },
];
