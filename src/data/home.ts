import { siteHandle } from "../i18n";
import type { MessageKey } from "../i18n/en";
import { featuredProjectBySlug, featuredProjects as projects } from "./projects";

export { projects };
export type { CoverShape } from "./projects";

const github = `https://github.com/${siteHandle}`;
const repositories = `${github}?tab=repositories`;
export const contact = {
  email: "floresquintero.da@gmail.com",
  linkedin: "https://www.linkedin.com/in/diego-alejandro-flores-quintero/",
  linkedinHandle: "diego-alejandro-flores-quintero",
  github,
  githubHandle: siteHandle,
  cv: `${github}/resume-maker`,
  cvPdf: { en: "https://diegnghtmr.github.io/resume-maker/cv/main-en.pdf", es: "https://diegnghtmr.github.io/resume-maker/cv/main-es.pdf" },
  projects: repositories,
} as const;

type StackGroup = { label: MessageKey; tools: readonly (readonly [name: string, usedIn: string])[] };
export const stack = [
  [
    { label: "backend", tools: [["Java 25", "StudyDeck AI, Brújula, Legajo"], ["Spring Boot 4", "StudyDeck AI, Food Court, Brújula, Legajo"], ["Go", "Profundiza UQ"], ["NestJS", "Savia"], ["Keycloak", "Brújula"]] },
    { label: "dataAi", tools: [["PostgreSQL", "StudyDeck AI, Brújula, Profundiza UQ"], ["pgvector", "StudyDeck AI"], ["MCP", "StudyDeck AI, Savia"]] },
  ],
  [
    { label: "frontend", tools: [["React 19", "StudyDeck AI, Brújula, Legajo, Profundiza UQ"], ["TypeScript", "Legajo, Savia, Vale"], ["Next.js", "Savia"], ["Tailwind 4", "StudyDeck AI, Legajo, Profundiza UQ"], ["Expo", "Savia"]] },
    { label: "infra", tools: [["Docker", "Enterprise Monitoring Stack"], ["GitHub Actions", "resume-maker"], ["Testcontainers", "StudyDeck AI"]] },
  ],
] as const satisfies readonly (readonly StackGroup[])[];

export const principles = [
  { title: "contractFirst", text: "contractEvidence", project: featuredProjectBySlug("brujula") },
  { title: "moduleBoundaries", text: "moduleEvidence", project: featuredProjectBySlug("studydeck-ai") },
  { title: "concurrency", text: "concurrencyEvidence", project: featuredProjectBySlug("profundiza-uq") },
] as const satisfies readonly { title: MessageKey; text: MessageKey; project: (typeof projects)[number] }[];

export const openSource = [
  { owner: "basecamp", repo: "omarchy", description: "omarchy", kind: "desktopConfig" },
  { owner: "Gentleman-Programming", repo: "gentle-ai", description: "gentleAi", kind: "agentHarness" },
  { owner: "Gentleman-Programming", repo: "gentleman-guardian-angel", description: "guardianAngel", kind: "reviewCli" },
  { owner: "Gentleman-Programming", repo: "Gentleman-Skills", description: "gentlemanSkills", kind: "agentSkills" },
  { owner: "alyssaxuu", repo: "screenity", description: "screenity", kind: "browserExtension" },
  { owner: "nesszer", repo: "Win-CodexBar", description: "codexBar", kind: "windowsApp" },
] as const satisfies readonly { owner: string; repo: string; description: MessageKey; kind: MessageKey }[];

export const experience = [
  { dates: "freelanceDates", title: "freelance", organization: "selfEmployed", text: "freelanceDetails", current: true },
  { dates: "teachingDates", title: "teaching", organization: "university", text: "teachingDetails", current: false },
  { dates: "degreeDates", title: "degree", organization: "university", text: "degreeDetails", current: true },
] as const satisfies readonly { dates: MessageKey; title: MessageKey; organization: MessageKey; text: MessageKey; current: boolean }[];
