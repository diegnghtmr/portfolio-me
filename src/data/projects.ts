import { siteHandle, type Locale } from "../i18n";
import type { MessageKey } from "../i18n/en";

export const surfaces = ["web", "api", "tool", "infra"] as const;
export type Surface = (typeof surfaces)[number];
export type CoverShape = "dunes" | "ripple" | "wave" | "orbit" | "sphere" | "capacity";
export const stackFacets = { java: "Java", typescript: "TypeScript", go: "Go", node: "Node" } as const;
export type StackFacet = keyof typeof stackFacets;

const github = `https://github.com/${siteHandle}`;
const searchRepos = (query: string) => `${github}?tab=repositories&q=${query}`;
type Localized = Record<Locale, string>;
type RepoRole = "web" | "api" | "identity" | "menu" | "orders" | "traceability" | "mobile" | "mcp" | "cli" | "pipeline" | "infra";
export type Repository = ReturnType<typeof repo>;

function repo(name: string, surface: "web" | "api" | "cli" | "infra", role: RepoRole = surface, programmingLanguage?: string) {
  return { name, surface, url: `${github}/${name}`, role, ...(programmingLanguage ? { programmingLanguage } : {}) };
}

type Featured = {
  id: `p${1 | 2 | 3 | 4 | 5 | 6}`;
  description: MessageKey;
  kind: MessageKey;
  categories: readonly string[];
  stack: string;
  href?: string;
  live?: boolean;
} & ({ shape: CoverShape; seed: number } | { terminal: true; stackLabel: MessageKey });

export interface Project {
  slug: string;
  name: string;
  purpose: Localized;
  primarySurface: Surface;
  surfaceLabel: Localized;
  stack: readonly string[];
  stackTags: readonly StackFacet[];
  repositories: readonly [Repository, ...Repository[]];
  /** Primary and edge endpoints reference repository names. */
  primaryRepository: string;
  edges?: readonly (readonly [from: string, to: string])[];
  featured?: Featured;
}

const webApi = { primarySurface: "web", surfaceLabel: { en: "Web + API", es: "Web + API" } } as const;
const webOnly = { primarySurface: "web", surfaceLabel: { en: "Web app", es: "Aplicación web" } } as const;
const apiOnly = { primarySurface: "api", surfaceLabel: { en: "API", es: "API" } } as const;
const toolOnly = { primarySurface: "tool", surfaceLabel: { en: "CLI", es: "CLI" } } as const;

// The atlas and the original six cards select different copy from the same records.
export const atlasProjects = [
  {
    slug: "studydeck-ai", name: "StudyDeck AI", ...webApi,
    purpose: { en: "Spaced-repetition decks with AI card generation, RAG and an MCP server.", es: "Mazos de repaso espaciado con generación de tarjetas por IA, RAG y un servidor MCP." },
    stack: ["Java 25", "Spring Boot", "PostgreSQL/pgvector", "React", "TypeScript"], stackTags: ["java", "typescript"],
    repositories: [repo("studydeck-backend", "api", "api", "Java"), repo("studydeck-frontend", "web", "web", "TypeScript")],
    primaryRepository: "studydeck-backend", edges: [["studydeck-backend", "studydeck-frontend"]],
    featured: { id: "p1", description: "studydeck", kind: "systemTwo", categories: ["api", "web"], stack: "Java 25, pgvector, React 19", shape: "dunes", seed: 1 },
  },
  {
    slug: "food-court", name: "Food Court", ...webApi, surfaceLabel: { en: "Web + 4 services", es: "Web + 4 servicios" },
    purpose: { en: "Role-based ordering across menu, orders, identity and traceability.", es: "Pedidos por roles con servicios de menú, pedidos, identidad y trazabilidad." },
    stack: ["Spring Boot", "React", "TypeScript"], stackTags: ["java", "typescript"],
    repositories: [repo("food-court-ui", "web"), repo("user-microservice", "api", "identity", "Java"), repo("food-court-microservice", "api", "menu", "Java"), repo("order-microservice", "api", "orders", "Java"), repo("traceability-microservice", "api", "traceability", "Java")],
    primaryRepository: "food-court-ui",
    edges: [["food-court-ui", "user-microservice"], ["food-court-ui", "food-court-microservice"], ["food-court-ui", "order-microservice"], ["food-court-ui", "traceability-microservice"]],
    featured: { id: "p2", description: "foodCourt", kind: "systemFive", categories: ["4 api", "web"], stack: "Spring Boot, React", href: searchRepos("food-court"), shape: "ripple", seed: 2 },
  },
  {
    slug: "brujula", name: "Brújula", ...webApi,
    purpose: { en: "Academic planning for Universidad del Quindío students.", es: "Planeación académica para estudiantes de la Universidad del Quindío." },
    stack: ["Spring Modulith", "Keycloak", "OpenAPI", "React", "TypeScript"], stackTags: ["java", "typescript"],
    repositories: [repo("brujula-backend", "api", "api", "Java"), repo("brujula-frontend", "web", "web", "TypeScript")],
    primaryRepository: "brujula-backend", edges: [["brujula-backend", "brujula-frontend"]],
    featured: { id: "p3", description: "brujula", kind: "systemTwo", categories: ["api", "web"], stack: "Spring Modulith, Keycloak", href: searchRepos("brujula"), shape: "wave", seed: 3 },
  },
  {
    slug: "legajo", name: "Legajo", ...webApi,
    purpose: { en: "Similarity analysis and clustering for research abstracts.", es: "Análisis de similitud y agrupamiento de resúmenes de investigación." },
    stack: ["React 19", "Java 25", "OpenAPI"], stackTags: ["java", "typescript"],
    repositories: [repo("legajo-backend", "api", "api", "Java"), repo("legajo-frontend", "web", "web", "TypeScript")],
    primaryRepository: "legajo-frontend", edges: [["legajo-backend", "legajo-frontend"]],
    featured: { id: "p4", description: "legajo", kind: "systemTwo", categories: ["api", "web"], stack: "Java 25, React 19", shape: "orbit", seed: 4, live: true },
  },
  {
    slug: "profundiza-uq", name: "Profundiza UQ", ...webApi,
    purpose: { en: "Elective course enrollment at Universidad del Quindío.", es: "Inscripción a cursos electivos en la Universidad del Quindío." },
    stack: ["Go", "chi", "pgx", "PostgreSQL", "React", "TypeScript"], stackTags: ["go", "typescript"],
    repositories: [repo("profundiza-uq-backend", "api", "api", "Go"), repo("profundiza-uq-frontend", "web", "web", "TypeScript")],
    primaryRepository: "profundiza-uq-backend", edges: [["profundiza-uq-backend", "profundiza-uq-frontend"]],
    featured: { id: "p5", description: "profundiza", kind: "systemTwo", categories: ["api", "web"], stack: "Go, pgx, React 19", shape: "capacity", seed: 5 },
  },
  {
    slug: "writing-harness", name: "writing-harness", ...toolOnly, surfaceLabel: { en: "CLI / skills", es: "CLI / skills" },
    purpose: { en: "Spanish writing rules for AI agents, with checks for prose in code.", es: "Reglas de redacción en español para agentes de IA, con verificaciones de prosa en el código." },
    stack: ["Node", "TypeScript"], stackTags: ["node", "typescript"], repositories: [repo("writing-harness", "cli", "cli", "TypeScript")], primaryRepository: "writing-harness",
    featured: { id: "p6", description: "writingHarness", kind: "headless", categories: ["cli"], stack: "Node, zero deps", stackLabel: "noDeps", terminal: true },
  },
  {
    slug: "savia", name: "Savia", ...webApi, surfaceLabel: { en: "Web + mobile + API + MCP", es: "Web + móvil + API + MCP" },
    purpose: { en: "Personal finance across web, mobile, API and MCP. In progress.", es: "Finanzas personales con web, móvil, API y MCP. En desarrollo." },
    stack: ["NestJS/Fastify", "Next.js", "Expo"], stackTags: ["typescript", "node"],
    repositories: [repo("savia-web", "web"), repo("savia-mobile", "web", "mobile"), repo("savia-backend", "api"), repo("savia-mcp", "cli", "mcp")],
    primaryRepository: "savia-web",
    edges: [["savia-web", "savia-backend"]],
  },
  {
    slug: "academic-triage", name: "Academic Triage", ...webApi,
    purpose: { en: "Academic request triage over a Java backend contract.", es: "Clasificación de solicitudes académicas sobre un contrato de backend en Java." },
    stack: ["Angular 20", "Java 21", "Spring Boot 3.5", "MariaDB 11"], stackTags: ["java", "typescript"],
    repositories: [repo("academic-triage-frontend", "web", "web", "TypeScript"), repo("academic-triage-system", "api", "api", "Java")],
    primaryRepository: "academic-triage-frontend", edges: [["academic-triage-frontend", "academic-triage-system"]],
  },
  {
    slug: "vale", name: "Vale", ...webOnly,
    purpose: { en: "Academic schedule planner with calendar export.", es: "Planificador de horarios académicos con exportación al calendario." },
    stack: ["TypeScript", "React", "Vite", "FullCalendar"], stackTags: ["typescript"], repositories: [repo("vale", "web", "web", "TypeScript")], primaryRepository: "vale",
  },
  {
    slug: "saber-inverso", name: "Saber Inverso", ...webApi,
    purpose: { en: "Estimates Saber 11 scores from a UQ program and weighted admission score, with uncertainty.", es: "Estima puntajes de Saber 11 a partir de un programa de la UQ y su puntaje ponderado de admisión, con incertidumbre." },
    stack: ["Astro", "TypeScript", "Python", "FastAPI"], stackTags: ["typescript"], repositories: [repo("saber-inverso", "web")], primaryRepository: "saber-inverso",
  },
  {
    slug: "doc-sentinel", name: "doc-sentinel", ...toolOnly,
    purpose: { en: "CLI that strips document traces and detects prompt injection.", es: "CLI que elimina rastros de documentos y detecta inyecciones de instrucciones." },
    stack: ["Python"], stackTags: [], repositories: [repo("doc-sentinel", "cli", "cli", "Python")], primaryRepository: "doc-sentinel",
  },
  {
    slug: "resume-maker", name: "resume-maker", ...toolOnly, surfaceLabel: { en: "Build pipeline", es: "Flujo de compilación" },
    purpose: { en: "Build pipeline for publishing résumé PDFs.", es: "Flujo de compilación para publicar hojas de vida en PDF." },
    stack: ["LaTeX"], stackTags: [], repositories: [repo("resume-maker", "cli", "pipeline")], primaryRepository: "resume-maker",
  },
  {
    slug: "enterprise-monitoring-stack", name: "Enterprise Monitoring Stack", primarySurface: "infra",
    surfaceLabel: { en: "Infrastructure", es: "Infraestructura" },
    purpose: { en: "Team project for containerized monitoring with redundant storage.", es: "Proyecto en equipo para monitoreo en contenedores con almacenamiento redundante." },
    stack: ["Docker", "RAID 1", "LVM", "Netdata"], stackTags: [], repositories: [repo("enterprise-monitoring-stack", "infra")],
    primaryRepository: "enterprise-monitoring-stack",
  },
  {
    slug: "nexride", name: "NexRide", ...apiOnly,
    purpose: { en: "Ride dispatch backend with pickup suggestions and composite scoring.", es: "Backend de asignación de viajes con sugerencias de recogida y una puntuación compuesta." },
    stack: ["TypeScript", "NestJS 11", "PostgreSQL/PostGIS", "Redis"], stackTags: ["typescript", "node"], repositories: [repo("NexRide", "api", "api", "TypeScript")], primaryRepository: "NexRide",
  },
] as const satisfies readonly Project[];

export function repositoryByName(project: Project, name: string): Repository {
  const repository = project.repositories.find((repo) => repo.name === name);
  if (!repository) throw new Error(`${project.slug}: unknown repository ${name}`);
  return repository;
}

export const primaryRepository = (project: Project) => repositoryByName(project, project.primaryRepository);
const featuredHref = (project: Project & { featured: Featured }) => project.featured.href ?? primaryRepository(project).url;
const [studyDeck, foodCourt, brujula, legajo, profundiza, writingHarness] = atlasProjects;
const projectCard = <T extends Project & { featured: Featured }>(project: T) => ({
  ...project.featured as T["featured"],
  slug: project.slug,
  name: project.name,
  href: featuredHref(project),
  repositories: project.repositories,
});

export const featuredProjects = [projectCard(studyDeck), projectCard(foodCourt), projectCard(brujula), projectCard(legajo), projectCard(profundiza), projectCard(writingHarness)] as const;
