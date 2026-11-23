import { atlasProjects, primaryRepository, stackFacets, surfaces, type Project } from "../data/projects";
import { caseStudyPath, type Locale } from "../i18n";
import type { CaseStudies } from "./case-studies";
import { workMessages } from "../i18n/work";

const repoBuckets = ["single", "multi"] as const;
export type RepoBucket = (typeof repoBuckets)[number];
export const atlasFacets = ["surface", "repos", "stack"] as const;
export type AtlasFacet = (typeof atlasFacets)[number];

export const repoBucket = (project: Project): RepoBucket => project.repositories.length === 1 ? "single" : "multi";
export const projectSurfaces = (project: Project) => surfaces.filter((surface) =>
  project.repositories.some((repo) => (repo.surface === "cli" ? "tool" : repo.surface) === surface),
);
export const projectHref = (locale: Locale, project: Project, studies: CaseStudies) => studies.has(project.slug)
  ? caseStudyPath(locale, project.slug)
  : primaryRepository(project).url;

export const atlasGroups = surfaces.map((surface) => ({
  surface,
  projects: atlasProjects.filter((project) => project.primarySurface === surface) as readonly Project[],
}));

export function facetOptions(locale: Locale) {
  const m = workMessages[locale];
  return {
    surface: surfaces.map((value) => ({ value, label: m.surface[value], count: atlasProjects.filter((project) => projectSurfaces(project).includes(value)).length })),
    repos: repoBuckets.map((value) => ({ value, label: m.repoBuckets[value], count: atlasProjects.filter((p) => repoBucket(p) === value).length })),
    stack: Object.entries(stackFacets).map(([value, label]) => ({ value, label, count: atlasProjects.filter((p: Project) => p.stackTags.includes(value as keyof typeof stackFacets)).length })),
  };
}
