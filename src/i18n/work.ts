import type { AtlasFacet, RepoBucket } from "../lib/work";
import type { Repository, Surface } from "../data/projects";
import type { Locale } from "./index";

type WorkMessages = {
  eyebrow: string;
  intro: string;
  home: string;
  index: string;
  searchHint: string;
  map: string;
  mapKey: string;
  connects: (from: string, to: string) => string;
  github: string;
  surface: Record<Surface, string>;
  genre: Record<Surface, string>;
  roles: Record<Repository["role"], string>;
  repoBuckets: Record<RepoBucket, string>;
  facet: Record<AtlasFacet, string>;
  filters: string;
  filterToggle: (count: number) => string;
  breakdown: string;
  active: string;
  remove: string;
  clear: string;
  clearAll: string;
  empty: string;
  emptyHint: (total: number) => string;
  projects: (count: number) => string;
  results: (count: number, total: number) => string;
  repos: (count: number) => string;
};

const en: WorkMessages = {
  eyebrow: "Systems atlas",
  intro: "Case studies ranked by relevance. Filter by surface, repository count or technology.",
  home: "Home",
  index: "Work index",
  searchHint: "Try a project name or technology.",
  map: "Repository maps",
  mapKey: "Each dot is a repo. Lines connect related repos.",
  connects: (from, to) => `${from} connects to ${to}`,
  github: "Opens the repository on GitHub",
  surface: { web: "Web apps", api: "APIs & services", tool: "Tools & CLIs", infra: "Infrastructure" },
  genre: { web: "Products with a UI", api: "Services & APIs", tool: "Tools & CLIs", infra: "Infrastructure" },
  roles: { web: "Web", api: "API", identity: "Identity", menu: "Menu", orders: "Orders", traceability: "Traceability", mobile: "Mobile", mcp: "MCP", cli: "CLI", pipeline: "Build pipeline", infra: "Infrastructure" },
  repoBuckets: { single: "Single repo", multi: "Multi-repo" },
  facet: { surface: "Includes surface", repos: "Repositories", stack: "Stack" },
  filters: "Filter projects",
  filterToggle: (count) => `Filters (${count})`,
  breakdown: "Projects by primary surface",
  active: "Active filters",
  remove: "Remove filter:",
  clear: "Clear",
  clearAll: "Clear all filters",
  empty: "No matching projects",
  emptyHint: (total) => `Remove a filter or use Clear to show all ${total} projects.`,
  projects: (count) => `${count} ${count === 1 ? "project" : "projects"}`,
  results: (count, total) => `${count} of ${total} projects`,
  repos: (count) => `${count} ${count === 1 ? "repo" : "repos"}`,
};

const es: WorkMessages = {
  eyebrow: "Atlas de sistemas",
  intro: "Casos de estudio ordenados por relevancia. Filtra por superficie, número de repositorios o tecnología.",
  home: "Inicio",
  index: "Índice de trabajo",
  searchHint: "Prueba con el nombre de un proyecto o una tecnología.",
  map: "Mapas de repositorios",
  mapKey: "Cada punto es un repositorio. Las líneas conectan repositorios relacionados.",
  connects: (from, to) => `${from} se conecta con ${to}`,
  github: "Abre el repositorio en GitHub",
  surface: { web: "Aplicaciones web", api: "API y servicios", tool: "Herramientas y CLI", infra: "Infraestructura" },
  genre: { web: "Productos con interfaz", api: "Servicios y API", tool: "Herramientas y CLI", infra: "Infraestructura" },
  roles: { web: "Web", api: "API", identity: "Identidad", menu: "Menú", orders: "Pedidos", traceability: "Trazabilidad", mobile: "Móvil", mcp: "MCP", cli: "CLI", pipeline: "Flujo de compilación", infra: "Infraestructura" },
  repoBuckets: { single: "Un repositorio", multi: "Varios repositorios" },
  facet: { surface: "Incluye superficie", repos: "Repositorios", stack: "Tecnologías" },
  filters: "Filtrar proyectos",
  filterToggle: (count) => `Filtros (${count})`,
  breakdown: "Proyectos por superficie principal",
  active: "Filtros activos",
  remove: "Quitar filtro:",
  clear: "Limpiar",
  clearAll: "Limpiar todos los filtros",
  empty: "Ningún proyecto coincide",
  emptyHint: (total) => `Quita un filtro o usa Limpiar para mostrar los ${total} proyectos.`,
  projects: (count) => `${count} ${count === 1 ? "proyecto" : "proyectos"}`,
  results: (count, total) => `${count} de ${total} proyectos`,
  repos: (count) => `${count} ${count === 1 ? "repo" : "repos"}`,
};

export const workMessages = { en, es } satisfies Record<Locale, WorkMessages>;
