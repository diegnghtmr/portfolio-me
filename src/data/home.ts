import { siteHandle } from "../i18n";
import type { MessageKey } from "../i18n/en";

type ProjectId = `p${1 | 2 | 3 | 4 | 5 | 6}`;
export type CoverShape = "dunes" | "ripple" | "wave" | "orbit" | "sphere";
type Project = {
  id: ProjectId;
  name: string;
  description: MessageKey;
  kind: MessageKey;
  categories: readonly string[];
  stack: string;
  href: string;
  live?: boolean;
} & ({ shape: CoverShape; seed: number } | { terminal: true; stackLabel: MessageKey });

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

export const projects = [
  { id: "p1", name: "StudyDeck AI", description: "studydeck", kind: "systemTwo", categories: ["api", "web"], stack: "Java 25, pgvector, React 19", href: `${github}/studydeck-backend`, shape: "dunes", seed: 1 },
  { id: "p2", name: "Food Court", description: "foodCourt", kind: "systemFive", categories: ["4 api", "web"], stack: "Spring Boot, React", href: `${repositories}&q=food-court`, shape: "ripple", seed: 2 },
  { id: "p3", name: "Brújula", description: "brujula", kind: "systemTwo", categories: ["api", "web"], stack: "Spring Modulith, Keycloak", href: `${repositories}&q=brujula`, shape: "wave", seed: 3 },
  { id: "p4", name: "Legajo", description: "legajo", kind: "systemTwo", categories: ["api", "web"], stack: "Java 25, React 19", href: `${github}/legajo-frontend`, shape: "orbit", seed: 4, live: true },
  { id: "p5", name: "Profundiza UQ", description: "profundiza", kind: "systemTwo", categories: ["api", "web"], stack: "Go, pgx, React 19", href: `${github}/profundiza-uq-backend`, shape: "sphere", seed: 5 },
  { id: "p6", name: "writing-harness", description: "writingHarness", kind: "headless", categories: ["cli"], stack: "Node, zero deps", stackLabel: "noDeps", href: `${github}/writing-harness`, terminal: true },
] as const satisfies readonly Project[];

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
  { title: "contractFirst", text: "contractEvidence", project: projects[2] },
  { title: "moduleBoundaries", text: "moduleEvidence", project: projects[0] },
  { title: "concurrency", text: "concurrencyEvidence", project: projects[4] },
] as const satisfies readonly { title: MessageKey; text: MessageKey; project: Project }[];

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
