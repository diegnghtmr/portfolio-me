import { isDeepStrictEqual } from "node:util";
import { getCollection, type CollectionEntry } from "astro:content";
import { atlasProjects, type Project } from "../data/projects";
import type { Locale } from "../i18n";
import { caseBodySections } from "./case-study-content";

export type CaseEntry = CollectionEntry<"caseStudies">;
export type CaseData = CaseEntry["data"];
export type Architecture = NonNullable<CaseData["architecture"]>;
export type CaseStudy = { project: Project; entries: Record<Locale, CaseEntry> };
export type CaseStudies = ReadonlyMap<string, CaseStudy>;

function architectureSignature(architecture?: Architecture) {
  if (!architecture) return;
  // Compare only the non-translatable fields. Ordering in the source is not semantic.
  return {
    nodes: new Map(architecture.nodes.map(({ id, kind, name, repo, tech, col, row }) => [id, { kind, name, repo, tech, col, row }])),
    edges: architecture.edges.map(({ from, to, protocol, evidence }) => JSON.stringify([from, to, protocol, evidence])).sort(),
  };
}

export async function getCaseStudies(): Promise<CaseStudies> {
  const entries = new Map((await getCollection("caseStudies")).map((entry) => [entry.id, entry]));
  const studies = new Map<string, CaseStudy>();
  // Keep catalog order for navigation, and validate even an unpublished single-locale entry.
  for (const project of atlasProjects) {
    const en = entries.get(`${project.slug}/en`);
    const es = entries.get(`${project.slug}/es`);
    for (const [locale, entry] of [["en", en], ["es", es]] as const) {
      if (!entry) continue;
      const file = entry.filePath ?? entry.id;
      caseBodySections(entry.body ?? "", locale, file);
      const headings = entry.rendered?.metadata?.headings;
      if (!Array.isArray(headings) || headings.filter((heading: unknown) =>
        typeof heading === "object" && heading !== null && "depth" in heading &&
        typeof heading.depth === "number" && heading.depth < 3).length !== 2) {
        throw new Error(`${file}: the body may contain only its two required top-level sections`);
      }
      const demo = entry.data.demonstration;
      if (demo.kind !== "screenshots") continue;
      for (const { src } of demo.screenshots) {
        if (src.format !== "png" || src.width !== 1440 || src.height !== 900) {
          throw new Error(`${file}: each screenshot must be a 1440×900 PNG`);
        }
      }
    }
    if (en && es) {
      if (!isDeepStrictEqual(architectureSignature(en.data.architecture), architectureSignature(es.data.architecture))) {
        throw new Error(`${project.slug}: architecture must agree across locales (node ids, kinds, names, repositories, technologies, positions, and edge endpoints, protocols and evidence)`);
      }
      studies.set(project.slug, { project, entries: { en, es } });
    }
  }
  return studies;
}

export async function caseStudyPaths() {
  return [...(await getCaseStudies()).values()].map((study) => ({ params: { slug: study.project.slug }, props: { study } }));
}
