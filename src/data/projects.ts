import { siteHandle, type Locale } from "../i18n";
import type { MessageKey } from "../i18n/en";

export const surfaces = ["web", "api", "tool", "infra"] as const;
export type Surface = (typeof surfaces)[number];
export type CoverShape = "dunes" | "ripple" | "wave" | "orbit" | "capacity" | "triage";
export type CaseCoverShape = "scan" | "fixtures" | "pickup" | "sapflow" | "typeset" | "timetable" | "distribution" | "folio" | "mirrors" | "shoreline";
type CaseCover = { shape: CaseCoverShape; seed: number };
export const stackFacets = { java: "Java", typescript: "TypeScript", go: "Go", node: "Node" } as const;
export type StackFacet = keyof typeof stackFacets;
export const stackLayerOrder = ["frontend", "backend", "data", "tooling", "infra"] as const;
export type StackLayer = (typeof stackLayerOrder)[number];

const github = `https://github.com/${siteHandle}`;
const searchRepos = (query: string) => `${github}?tab=repositories&q=${query}`;
type Localized = Record<Locale, string>;
type RepoRole = "web" | "api" | "identity" | "menu" | "orders" | "traceability" | "mobile" | "mcp" | "cli" | "pipeline" | "infra";
export type Repository = ReturnType<typeof repo>;

function repo(name: string, surface: "web" | "api" | "cli" | "infra", role: RepoRole = surface, programmingLanguage?: string) {
  return { name, surface, url: `${github}/${name}`, role, ...(programmingLanguage ? { programmingLanguage } : {}) };
}

type Featured = {
  id: `p${1 | 2 | 3 | 4 | 5 | 7}`; // Stable per project: anchors and projects.json ids; never reuse a retired id (p6 was writing-harness).
  description: MessageKey;
  kind: MessageKey;
  categories: readonly string[];
  stack: string;
  href?: string;
  live?: boolean;
  shape: CoverShape;
  seed: number;
  rings?: number;
};

interface ProjectDetails {
  slug: string;
  name: string;
  purpose: Localized;
  primarySurface: Surface;
  surfaceLabel: Localized;
  stack: readonly string[];
  stackLayers?: Partial<Record<StackLayer, readonly string[]>>;
  stackTags: readonly StackFacet[];
  repositories: readonly [Repository, ...Repository[]];
  /** Primary and edge endpoints reference repository names. */
  primaryRepository: string;
  edges?: readonly (readonly [from: string, to: string])[];
}

const homeProjectSlugs = [
  "legajo", "studydeck-ai", "academic-triage", "brujula", "food-court", "profundiza-uq",
] as const;
type HomeProjectSlug = (typeof homeProjectSlugs)[number];

/** Featured projects reuse their home shape and seed. All others need case-study artwork. */
export type Project = ProjectDetails & (
  | { slug: HomeProjectSlug; featured: Featured; cover?: never }
  | { featured?: never; cover: CaseCover }
);

const webApi = { primarySurface: "web", surfaceLabel: { en: "Web + API", es: "Web + API" } } as const;
const webOnly = { primarySurface: "web", surfaceLabel: { en: "Web app", es: "Aplicación web" } } as const;
const apiOnly = { primarySurface: "api", surfaceLabel: { en: "API", es: "API" } } as const;
const toolOnly = { primarySurface: "tool", surfaceLabel: { en: "CLI", es: "CLI" } } as const;

// Editorial ranking, shared by the atlas and its machine-readable views.
export const atlasProjects = [
  {
    slug: "legajo", name: "Legajo", ...webApi,
    purpose: { en: "Similarity analysis and clustering for research abstracts.", es: "Análisis de similitud y agrupamiento de resúmenes de investigación." },
    stack: ["React 19", "Java 25", "OpenAPI"], stackTags: ["java", "typescript"],
    stackLayers: { frontend: ["React 19"], backend: ["Java 25"], tooling: ["OpenAPI"] },
    repositories: [repo("legajo-backend", "api", "api", "Java"), repo("legajo-frontend", "web", "web", "TypeScript")],
    primaryRepository: "legajo-frontend", edges: [["legajo-backend", "legajo-frontend"]],
    featured: { id: "p4", description: "legajo", kind: "systemTwo", categories: ["api", "web"], stack: "Java 25, React 19", shape: "orbit", seed: 4, live: true },
  },
  {
    slug: "studydeck-ai", name: "StudyDeck AI", ...webApi,
    purpose: { en: "Spaced-repetition decks with AI card generation, RAG and an MCP server.", es: "Mazos de repaso espaciado con generación de tarjetas por IA, RAG y un servidor MCP." },
    stack: ["Java 25", "Spring Boot", "PostgreSQL/pgvector", "React", "TypeScript"], stackTags: ["java", "typescript"],
    stackLayers: { frontend: ["React", "TypeScript"], backend: ["Java 25", "Spring Boot"], data: ["PostgreSQL/pgvector"] },
    repositories: [repo("studydeck-backend", "api", "api", "Java"), repo("studydeck-frontend", "web", "web", "TypeScript")],
    primaryRepository: "studydeck-backend", edges: [["studydeck-backend", "studydeck-frontend"]],
    featured: { id: "p1", description: "studydeck", kind: "systemTwo", categories: ["api", "web"], stack: "Java 25, pgvector, React 19", shape: "dunes", seed: 1 },
  },
  {
    slug: "academic-triage", name: "Academic Triage", ...webApi,
    purpose: { en: "Academic request triage over a Java backend contract.", es: "Clasificación de solicitudes académicas sobre un contrato de backend en Java." },
    stack: ["Angular 20", "Java 21", "Spring Boot 3.5", "MariaDB 11"], stackTags: ["java", "typescript"],
    stackLayers: { frontend: ["Angular 20"], backend: ["Java 21", "Spring Boot 3.5"], data: ["MariaDB 11"] },
    repositories: [repo("academic-triage-frontend", "web", "web", "TypeScript"), repo("academic-triage-system", "api", "api", "Java")],
    primaryRepository: "academic-triage-frontend", edges: [["academic-triage-frontend", "academic-triage-system"]],
    featured: { id: "p7", description: "academicTriage", kind: "systemTwo", categories: ["api", "web"], stack: "Angular 20, Spring Boot 3.5", href: searchRepos("academic-triage"), shape: "triage", seed: 6, live: true },
  },
  {
    slug: "the-knowledge-bay", name: "The Knowledge Bay", ...webApi,
    purpose: { en: "A learning network for sharing resources, requesting help, and studying with peers.", es: "Red de aprendizaje para compartir recursos, pedir ayuda y estudiar con otros estudiantes." },
    stack: ["React 19", "JavaScript", "Java 21", "Spring Boot 3.4", "Spring Security", "PostgreSQL 17", "Flyway"], stackTags: ["java"],
    stackLayers: { frontend: ["React 19", "JavaScript"], backend: ["Java 21", "Spring Boot 3.4", "Spring Security"], data: ["PostgreSQL 17", "Flyway"] },
    repositories: [repo("the-knowledge-bay", "web")], primaryRepository: "the-knowledge-bay",
    cover: { shape: "shoreline", seed: 16 },
  },
  {
    slug: "brujula", name: "Brújula", ...webApi,
    purpose: { en: "Academic planning for Universidad del Quindío students.", es: "Planeación académica para estudiantes de la Universidad del Quindío." },
    stack: ["Spring Modulith", "Keycloak", "OpenAPI", "React", "TypeScript"], stackTags: ["java", "typescript"],
    stackLayers: { frontend: ["React", "TypeScript"], backend: ["Spring Modulith", "Keycloak"], tooling: ["OpenAPI"] },
    repositories: [repo("brujula-backend", "api", "api", "Java"), repo("brujula-frontend", "web", "web", "TypeScript")],
    primaryRepository: "brujula-backend", edges: [["brujula-backend", "brujula-frontend"]],
    featured: { id: "p3", description: "brujula", kind: "systemTwo", categories: ["api", "web"], stack: "Spring Modulith, Keycloak", href: searchRepos("brujula"), shape: "wave", seed: 3 },
  },
  {
    slug: "food-court", name: "Food Court", ...webApi, surfaceLabel: { en: "Web + 4 services", es: "Web + 4 servicios" },
    purpose: { en: "Role-based ordering across menu, orders, identity and traceability.", es: "Pedidos por roles con servicios de menú, pedidos, identidad y trazabilidad." },
    stack: ["Spring Boot", "React", "TypeScript"], stackTags: ["java", "typescript"],
    stackLayers: { frontend: ["React", "TypeScript"], backend: ["Spring Boot"] },
    repositories: [repo("food-court-ui", "web"), repo("user-microservice", "api", "identity", "Java"), repo("food-court-microservice", "api", "menu", "Java"), repo("order-microservice", "api", "orders", "Java"), repo("traceability-microservice", "api", "traceability", "Java")],
    primaryRepository: "food-court-ui",
    edges: [["food-court-ui", "user-microservice"], ["food-court-ui", "food-court-microservice"], ["food-court-ui", "order-microservice"], ["food-court-ui", "traceability-microservice"]],
    featured: { id: "p2", description: "foodCourt", kind: "systemFive", categories: ["4 api", "web"], stack: "Spring Boot, React", href: searchRepos("food-court"), shape: "ripple", seed: 2, rings: 24 },
  },
  {
    slug: "profundiza-uq", name: "Profundiza UQ", ...webApi,
    purpose: { en: "Elective course enrollment at Universidad del Quindío.", es: "Inscripción a cursos electivos en la Universidad del Quindío." },
    stack: ["Go", "chi", "pgx", "PostgreSQL", "React", "TypeScript"], stackTags: ["go", "typescript"],
    stackLayers: { frontend: ["React", "TypeScript"], backend: ["Go", "chi"], data: ["pgx", "PostgreSQL"] },
    repositories: [repo("profundiza-uq-backend", "api", "api", "Go"), repo("profundiza-uq-frontend", "web", "web", "TypeScript")],
    primaryRepository: "profundiza-uq-backend", edges: [["profundiza-uq-backend", "profundiza-uq-frontend"]],
    featured: { id: "p5", description: "profundiza", kind: "systemTwo", categories: ["api", "web"], stack: "Go, pgx, React 19", shape: "capacity", seed: 5 },
  },
  {
    slug: "doc-sentinel", name: "doc-sentinel", ...toolOnly,
    purpose: { en: "CLI that strips document traces and detects prompt injection.", es: "CLI que elimina rastros de documentos y detecta inyecciones de instrucciones." },
    stack: ["Python"], stackTags: [], repositories: [repo("doc-sentinel", "cli", "cli", "Python")], primaryRepository: "doc-sentinel",
    stackLayers: { tooling: ["Python"] },
    cover: { shape: "scan", seed: 7 },
  },
  {
    slug: "roster-edge", name: "RosterEdge", ...webApi,
    purpose: { en: "Team management, match scheduling, and season reports for sports clubs.", es: "Gestión de equipos, programación de partidos e informes de temporada para clubes deportivos." },
    stack: ["React 19", "TypeScript", "Java 21", "Spring Boot 3.5", "PostgreSQL", "Flyway"], stackTags: ["java", "typescript"],
    stackLayers: { frontend: ["React 19", "TypeScript"], backend: ["Java 21", "Spring Boot 3.5"], data: ["PostgreSQL", "Flyway"] },
    repositories: [repo("roster-edge", "web")], primaryRepository: "roster-edge",
    cover: { shape: "fixtures", seed: 8 },
  },
  {
    slug: "nexride", name: "NexRide", ...apiOnly,
    purpose: { en: "Ride dispatch backend with pickup suggestions and composite scoring.", es: "Backend de asignación de viajes con sugerencias de recogida y una puntuación compuesta." },
    stack: ["TypeScript", "NestJS 11", "PostgreSQL/PostGIS", "Redis"], stackTags: ["typescript", "node"], repositories: [repo("NexRide", "api", "api", "TypeScript")], primaryRepository: "NexRide",
    stackLayers: { backend: ["TypeScript", "NestJS 11"], data: ["PostgreSQL/PostGIS", "Redis"] },
    cover: { shape: "pickup", seed: 9 },
  },
  {
    slug: "savia", name: "Savia", ...webApi, surfaceLabel: { en: "Web + mobile + API + MCP + CLI", es: "Web + móvil + API + MCP + CLI" },
    purpose: { en: "Personal finance across web, mobile, API, MCP and CLI.", es: "Finanzas personales con web, móvil, API, MCP y CLI." },
    stack: ["NestJS/Fastify", "Next.js", "Expo"], stackTags: ["typescript", "node"],
    stackLayers: { frontend: ["Next.js", "Expo"], backend: ["NestJS/Fastify"] },
    repositories: [repo("savia-web", "web"), repo("savia-mobile", "web", "mobile"), repo("savia-backend", "api"), repo("savia-mcp", "cli", "mcp"), repo("savia-cli", "cli", "cli", "TypeScript")],
    primaryRepository: "savia-web",
    edges: [["savia-web", "savia-backend"], ["savia-cli", "savia-backend"]],
    cover: { shape: "sapflow", seed: 10 },
  },
  {
    slug: "writing-harness", name: "writing-harness", ...toolOnly, surfaceLabel: { en: "CLI / skills", es: "CLI / skills" },
    purpose: { en: "Spanish writing rules for AI agents, with checks for prose in code.", es: "Reglas de redacción en español para agentes de IA, con verificaciones de prosa en el código." },
    stack: ["Node", "TypeScript"], stackTags: ["node", "typescript"], repositories: [repo("writing-harness", "cli", "cli", "TypeScript")], primaryRepository: "writing-harness",
    stackLayers: { tooling: ["Node", "TypeScript"] },
    cover: { shape: "typeset", seed: 11 },
  },
  {
    slug: "vale", name: "Vale", ...webOnly,
    purpose: { en: "Academic schedule planner with calendar export.", es: "Planificador de horarios académicos con exportación al calendario." },
    stack: ["TypeScript", "React", "Vite", "FullCalendar"], stackTags: ["typescript"], repositories: [repo("vale", "web", "web", "TypeScript")], primaryRepository: "vale",
    stackLayers: { frontend: ["TypeScript", "React", "FullCalendar"], tooling: ["Vite"] },
    cover: { shape: "timetable", seed: 12 },
  },
  {
    slug: "saber-inverso", name: "Saber Inverso", ...webOnly,
    purpose: { en: "Estimates Saber 11 scores from a UQ program and weighted admission score, with uncertainty.", es: "Estima puntajes de Saber 11 a partir de un programa de la UQ y su puntaje ponderado de admisión, con incertidumbre." },
    stack: ["Astro", "TypeScript", "Python", "FastAPI"], stackTags: ["typescript"], repositories: [repo("saber-inverso", "web")], primaryRepository: "saber-inverso",
    stackLayers: { frontend: ["Astro", "TypeScript"], backend: ["Python", "FastAPI"] },
    cover: { shape: "distribution", seed: 13 },
  },
  {
    slug: "resume-maker", name: "resume-maker", ...toolOnly, surfaceLabel: { en: "Build pipeline", es: "Flujo de compilación" },
    purpose: { en: "Build pipeline for publishing résumé PDFs.", es: "Flujo de compilación para publicar hojas de vida en PDF." },
    stack: ["LaTeX"], stackTags: [], repositories: [repo("resume-maker", "cli", "pipeline")], primaryRepository: "resume-maker",
    stackLayers: { tooling: ["LaTeX"] },
    cover: { shape: "folio", seed: 14 },
  },
  {
    slug: "enterprise-monitoring-stack", name: "Enterprise Monitoring Stack", primarySurface: "infra",
    surfaceLabel: { en: "Infrastructure", es: "Infraestructura" },
    purpose: { en: "Team project for containerized monitoring with redundant storage.", es: "Proyecto en equipo para monitoreo en contenedores con almacenamiento redundante." },
    stack: ["Docker", "RAID 1", "LVM", "Netdata"], stackTags: [], repositories: [repo("enterprise-monitoring-stack", "infra")],
    stackLayers: { infra: ["Docker", "RAID 1", "LVM", "Netdata"] },
    primaryRepository: "enterprise-monitoring-stack",
    cover: { shape: "mirrors", seed: 15 },
  },
] as const satisfies readonly Project[];

export function repositoryByName(project: Project, name: string): Repository {
  const repository = project.repositories.find((repo) => repo.name === name);
  if (!repository) throw new Error(`${project.slug}: unknown repository ${name}`);
  return repository;
}

export const primaryRepository = (project: Project) => repositoryByName(project, project.primaryRepository);
type FeaturedEntry = Extract<(typeof atlasProjects)[number], { featured: Featured }>;
const featuredSlugs: ReadonlySet<FeaturedEntry["slug"]> = new Set(homeProjectSlugs);

const projectCard = (project: Project & { featured: Featured }) => ({
  ...project.featured,
  slug: project.slug,
  name: project.name,
  href: project.featured.href ?? primaryRepository(project).url,
  repositories: project.repositories,
});

/** Home card anchors whose project left the featured six; links to them still reach that case study. */
export const retiredCardAnchors = [{ id: "p6", slug: "writing-harness" }] as const;

/** The home's large showcase card: the most complex system, chosen by the owner; the other five follow the ranking. */
const showcaseSlug: FeaturedEntry["slug"] = "food-court";
export const rankedFeaturedProjects = atlasProjects.flatMap((project) =>
  "featured" in project && featuredSlugs.has(project.slug) ? [projectCard(project)] : [],
);
export const featuredProjects = [
  ...rankedFeaturedProjects.filter((card) => card.slug === showcaseSlug),
  ...rankedFeaturedProjects.filter((card) => card.slug !== showcaseSlug),
];

export function featuredProjectBySlug(slug: FeaturedEntry["slug"]) {
  const project = featuredProjects.find((card) => card.slug === slug);
  if (!project) throw new Error(`${slug}: missing featured project`);
  return project;
}

// projects.json entries published before the relevance ranking (diegnghtmr.me, bcf8fdb).
// They identify each project and its published facts; home placement must never change them.
export const publishedFeedEntries = {
  "studydeck-ai": {"id": "p1", "description": {"en": "Spaced-repetition flashcards with AI card generation, document RAG and an MCP server.", "es": "Tarjetas de repaso espaciado con generación por IA, RAG sobre documentos y un servidor MCP."}, "kind": {"en": "System, 2 repos", "es": "Sistema, 2 repos"}, "categories": ["api", "web"], "stack": ["Java 25", "pgvector", "React 19"], "url": "https://github.com/diegnghtmr/studydeck-backend", "live": false},
  "food-court": {"id": "p2", "description": {"en": "Ordering platform split into identity, menu, order and traceability services plus a role-based UI.", "es": "Plataforma de pedidos dividida en servicios de identidad, menú, pedidos y trazabilidad, más una interfaz por roles."}, "kind": {"en": "System, 5 repos", "es": "Sistema, 5 repos"}, "categories": ["4 api", "web"], "stack": ["Spring Boot", "React"], "url": "https://github.com/diegnghtmr?tab=repositories&q=food-court", "live": false},
  "brujula": {"id": "p3", "description": {"en": "Academic planning for Universidad del Quindío: curriculum graph, degree progress and semester simulation.", "es": "Planeación académica para la Universidad del Quindío: grafo curricular, avance de carrera y simulación de semestres."}, "kind": {"en": "System, 2 repos", "es": "Sistema, 2 repos"}, "categories": ["api", "web"], "stack": ["Spring Modulith", "Keycloak"], "url": "https://github.com/diegnghtmr?tab=repositories&q=brujula", "live": false},
  "legajo": {"id": "p4", "description": {"en": "Text similarity and hierarchical clustering over scientific abstracts, with traces and dendrograms.", "es": "Similitud de textos y agrupamiento jerárquico sobre resúmenes científicos, con trazas y dendrogramas."}, "kind": {"en": "System, 2 repos", "es": "Sistema, 2 repos"}, "categories": ["api", "web"], "stack": ["Java 25", "React 19"], "url": "https://github.com/diegnghtmr/legajo-frontend", "live": true},
  "profundiza-uq": {"id": "p5", "description": {"en": "Elective enrollment with server-generated arrival order and per-group capacity under row-level locking.", "es": "Inscripción a electivas con orden de llegada generado en el servidor y cupos por grupo bajo bloqueo de filas."}, "kind": {"en": "System, 2 repos", "es": "Sistema, 2 repos"}, "categories": ["api", "web"], "stack": ["Go", "pgx", "React 19"], "url": "https://github.com/diegnghtmr/profundiza-uq-backend", "live": false},
  "writing-harness": {"id": "p6", "description": {"en": "Spanish writing skills plus a verifier that measures whether a text follows them. Runs on Node 22.6 with nothing installed.", "es": "Skills de redacción en español y un verificador que mide si un texto las cumple. Corre en Node 22.6 sin instalar nada."}, "kind": {"en": "Headless, 1 repo", "es": "Sin interfaz, 1 repo"}, "categories": ["cli"], "stack": ["Node", "zero deps"], "url": "https://github.com/diegnghtmr/writing-harness", "live": false},
} as const satisfies Record<string, {
  id: string; description: Record<"en" | "es", string>; kind: Record<"en" | "es", string>;
  categories: readonly string[]; stack: readonly string[]; url: string; live: boolean;
}>;
