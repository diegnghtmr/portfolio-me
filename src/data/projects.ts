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
  surfaces: readonly Surface[];
  surfaceLabel: Localized;
  stack: readonly string[];
  stackTags: readonly StackFacet[];
  repositories: readonly [Repository, ...Repository[]];
  /** Defaults to the first repository; edges also refer to repository indices. */
  primaryRepository?: number;
  edges?: readonly (readonly [number, number])[];
  caseStudy: boolean;
  featured?: Featured;
}

const webApi = { primarySurface: "web", surfaces: ["web", "api"], surfaceLabel: { en: "Web + API", es: "Web + API" } } as const;
const webOnly = { primarySurface: "web", surfaces: ["web"], surfaceLabel: { en: "Web app", es: "Aplicación web" } } as const;
const apiOnly = { primarySurface: "api", surfaces: ["api"], surfaceLabel: { en: "API", es: "API" } } as const;
const toolOnly = { primarySurface: "tool", surfaces: ["tool"], surfaceLabel: { en: "CLI", es: "CLI" } } as const;
const pair = [[0, 1]] as const;

// The atlas and the original six cards select different copy from the same records.
export const atlasProjects = [
  {
    slug: "studydeck-ai", name: "StudyDeck AI", ...webApi,
    purpose: { en: "Spaced-repetition decks with AI card generation, RAG and an MCP server.", es: "Mazos de repaso espaciado con generación de tarjetas por IA, RAG y un servidor MCP." },
    stack: ["Java 25", "Spring Boot", "PostgreSQL/pgvector", "React"], stackTags: ["java"],
    repositories: [repo("studydeck-backend", "api", "api", "Java"), repo("studydeck-frontend", "web")], edges: pair, caseStudy: false,
    featured: { id: "p1", description: "studydeck", kind: "systemTwo", categories: ["api", "web"], stack: "Java 25, pgvector, React 19", shape: "dunes", seed: 1 },
  },
  {
    slug: "food-court", name: "Food Court", ...webApi, surfaceLabel: { en: "Web + 4 services", es: "Web + 4 servicios" },
    purpose: { en: "Role-based ordering across menu, orders, identity and traceability.", es: "Pedidos por roles con servicios de menú, pedidos, identidad y trazabilidad." },
    stack: ["Spring Boot", "React", "TypeScript"], stackTags: ["java", "typescript"],
    repositories: [repo("food-court-ui", "web"), repo("user-microservice", "api", "identity", "Java"), repo("food-court-microservice", "api", "menu", "Java"), repo("order-microservice", "api", "orders", "Java"), repo("traceability-microservice", "api", "traceability", "Java")],
    edges: [[0, 1], [0, 2], [0, 3], [0, 4]], caseStudy: false,
    featured: { id: "p2", description: "foodCourt", kind: "systemFive", categories: ["4 api", "web"], stack: "Spring Boot, React", href: searchRepos("food-court"), shape: "ripple", seed: 2 },
  },
  {
    slug: "brujula", name: "Brújula", ...webApi,
    purpose: { en: "Academic planning for Universidad del Quindío students.", es: "Planeación académica para estudiantes de la Universidad del Quindío." },
    stack: ["Spring Modulith", "Keycloak", "OpenAPI"], stackTags: ["java"],
    repositories: [repo("brujula-backend", "api", "api", "Java"), repo("brujula-frontend", "web")], edges: pair, caseStudy: false,
    featured: { id: "p3", description: "brujula", kind: "systemTwo", categories: ["api", "web"], stack: "Spring Modulith, Keycloak", href: searchRepos("brujula"), shape: "wave", seed: 3 },
  },
  {
    slug: "legajo", name: "Legajo", ...webApi,
    purpose: { en: "Similarity analysis and clustering for research abstracts.", es: "Análisis de similitud y agrupamiento de resúmenes de investigación." },
    stack: ["React 19", "Java 25", "OpenAPI"], stackTags: ["java", "typescript"],
    repositories: [repo("legajo-backend", "api", "api", "Java"), repo("legajo-frontend", "web", "web", "TypeScript")], primaryRepository: 1, edges: pair, caseStudy: false,
    featured: { id: "p4", description: "legajo", kind: "systemTwo", categories: ["api", "web"], stack: "Java 25, React 19", shape: "orbit", seed: 4, live: true },
  },
  {
    slug: "profundiza-uq", name: "Profundiza UQ", ...webApi,
    purpose: { en: "Elective course enrollment.", es: "Inscripción a cursos electivos." },
    stack: ["Go", "chi", "pgx", "PostgreSQL", "React"], stackTags: ["go"],
    repositories: [repo("profundiza-uq-backend", "api", "api", "Go"), repo("profundiza-uq-frontend", "web")], edges: pair, caseStudy: false,
    featured: { id: "p5", description: "profundiza", kind: "systemTwo", categories: ["api", "web"], stack: "Go, pgx, React 19", shape: "capacity", seed: 5 },
  },
  {
    slug: "writing-harness", name: "writing-harness", ...toolOnly, surfaceLabel: { en: "CLI / skills", es: "CLI / skills" },
    purpose: { en: "Spanish writing rules for AI agents, with checks for prose in code.", es: "Reglas de redacción en español para agentes de IA, con verificaciones de prosa en el código." },
    stack: ["Node"], stackTags: ["node"], repositories: [repo("writing-harness", "cli", "cli", "JavaScript")], caseStudy: false,
    featured: { id: "p6", description: "writingHarness", kind: "headless", categories: ["cli"], stack: "Node, zero deps", stackLabel: "noDeps", terminal: true },
  },
  {
    slug: "savia", name: "Savia", ...webApi, surfaceLabel: { en: "Web + mobile + API + MCP", es: "Web + móvil + API + MCP" },
    purpose: { en: "Health and wellbeing system across web, mobile, API and MCP. In progress.", es: "Sistema de salud y bienestar con web, móvil, API y MCP. En desarrollo." },
    stack: ["NestJS/Fastify", "Next.js", "Expo"], stackTags: ["typescript", "node"],
    repositories: [repo("savia-web", "web"), repo("savia-mobile", "web", "mobile"), repo("savia-backend", "api"), repo("savia-mcp", "cli", "mcp")],
    edges: [[0, 2], [1, 2], [2, 3]], caseStudy: false,
  },
  {
    slug: "academic-triage", name: "Academic Triage", ...webApi,
    purpose: { en: "Academic request triage over a Java backend contract.", es: "Clasificación de solicitudes académicas sobre un contrato de backend en Java." },
    stack: ["Angular 20", "Java"], stackTags: ["java", "typescript"],
    repositories: [repo("academic-triage-frontend", "web"), repo("academic-triage-system", "api", "api", "Java")], edges: pair, caseStudy: false,
  },
  {
    slug: "vale", name: "Vale", ...webOnly,
    purpose: { en: "Academic schedule planner with calendar export.", es: "Planificador de horarios académicos con exportación al calendario." },
    stack: ["TypeScript"], stackTags: ["typescript"], repositories: [repo("vale", "web")], caseStudy: false,
  },
  {
    slug: "saber-inverso", name: "Saber Inverso", ...webOnly,
    purpose: { en: "Estimates Saber 11 scores from UQ admission weights, with uncertainty.", es: "Estima puntajes de Saber 11 a partir de las ponderaciones de admisión de la UQ, con incertidumbre." },
    stack: ["Astro", "TypeScript"], stackTags: ["typescript"], repositories: [repo("saber-inverso", "web")], caseStudy: false,
  },
  {
    slug: "doc-sentinel", name: "doc-sentinel", ...toolOnly,
    purpose: { en: "CLI that strips document traces and detects prompt injection.", es: "CLI que elimina rastros de documentos y detecta inyecciones de instrucciones." },
    stack: [], stackTags: [], repositories: [repo("doc-sentinel", "cli")], caseStudy: false,
  },
  {
    slug: "resume-maker", name: "resume-maker", ...toolOnly, surfaceLabel: { en: "Build pipeline", es: "Flujo de compilación" },
    purpose: { en: "Build pipeline for publishing résumé PDFs.", es: "Flujo de compilación para publicar hojas de vida en PDF." },
    stack: ["LaTeX"], stackTags: [], repositories: [repo("resume-maker", "cli", "pipeline")], caseStudy: false,
  },
  {
    slug: "enterprise-monitoring-stack", name: "Enterprise Monitoring Stack", primarySurface: "infra", surfaces: ["infra"],
    surfaceLabel: { en: "Infrastructure", es: "Infraestructura" },
    purpose: { en: "Team project for containerized monitoring with redundant storage.", es: "Proyecto en equipo para monitoreo en contenedores con almacenamiento redundante." },
    stack: ["Docker", "RAID 1", "LVM", "Netdata"], stackTags: [], repositories: [repo("enterprise-monitoring-stack", "infra")], caseStudy: false,
  },
  {
    slug: "nexride", name: "NexRide", ...apiOnly,
    purpose: { en: "Ride dispatch backend with pickup suggestions and composite scoring.", es: "Backend de asignación de viajes con sugerencias de recogida y una puntuación compuesta." },
    stack: [], stackTags: [], repositories: [repo("NexRide", "api")], caseStudy: false,
  },
] as const satisfies readonly Project[];

export const primaryRepository = (project: Project) => project.repositories[project.primaryRepository ?? 0] ?? project.repositories[0];
const featuredHref = (project: Project & { featured: Featured }) => project.featured.href ?? primaryRepository(project).url;
const [studyDeck, foodCourt, brujula, legajo, profundiza, writingHarness] = atlasProjects;
const projectCard = <T extends Project & { featured: Featured }>(project: T) => ({
  ...project.featured as T["featured"],
  name: project.name,
  href: featuredHref(project),
  repositories: project.repositories,
});

export const featuredProjects = [projectCard(studyDeck), projectCard(foodCourt), projectCard(brujula), projectCard(legajo), projectCard(profundiza), projectCard(writingHarness)] as const;
