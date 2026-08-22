export type Locale = "en" | "pt-BR";

type Copy = {
  navProjects: string;
  languageLabel: string;
  themeLabel: string;
  lightTheme: string;
  darkTheme: string;
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
    themeLabel: "Change theme",
    lightTheme: "Use light theme",
    darkTheme: "Use dark theme",
    heroTitle: "Fofinhos Studio",
    heroCta: "Projects",
    visitProject: "Visit project",
    camilaRole: "Camila · Designer",
    felipeRole: "Felipe · Programmer",
    githubLabel: "Visit Fofinhos Studio on GitHub",
    linkedinLabel: "Visit LinkedIn",
  },
  "pt-BR": {
    navProjects: "Projetos",
    languageLabel: "Mudar idioma",
    themeLabel: "Mudar tema",
    lightTheme: "Usar tema claro",
    darkTheme: "Usar tema escuro",
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
  id: "minigemu" | "gamingclock" | "hon";
  url: string;
  accent: "orange" | "purple" | "both";
  title: string;
  repository: string;
  description: Record<Locale, string>;
  tag: Record<Locale, string>;
};

export const projects: Project[] = [
  {
    id: "minigemu",
    url: "https://minigemu.fofinhos.studio/",
    accent: "orange",
    title: "Minigemu",
    repository: "daily-game-tracker",
    description: {
      en: "Track Wordle, Gamedle, Framed, and other daily games in one place.",
      "pt-BR":
        "Acompanhe Wordle, Gamedle, Framed e outros jogos diários em um só lugar.",
    },
    tag: { en: "Daily game tracker", "pt-BR": "Rastreador de jogos diários" },
  },
  {
    id: "gamingclock",
    url: "https://gamingclock.fofinhos.studio/",
    accent: "purple",
    title: "GamingClock",
    repository: "gamingclock",
    description: {
      en: "Schedule games from your backlog and finish them.",
      "pt-BR": "Agende jogos do seu backlog e termine-os.",
    },
    tag: { en: "Backlog planner", "pt-BR": "Planejador de backlog" },
  },
  {
    id: "hon",
    url: "https://hon.fofinhos.studio",
    accent: "both",
    title: "Hon",
    repository: "hon",
    description: {
      en: "Plan your reading.",
      "pt-BR": "Planeje suas leituras.",
    },
    tag: { en: "Reading planner", "pt-BR": "Planejador de leitura" },
  },
];
