import { statSync } from "node:fs";
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { atlasProjects } from "./data/projects";
import { placeholder } from "./lib/case-study-content";

const text = z.string().trim().min(1).refine((value) => !placeholder.test(value) && !/^(?:pending|pendiente|n\/a|[-–—])$/i.test(value), "Omit unverified facts rather than supplying placeholders");
// A transcript is verbatim evidence, not editorial copy. Check for blank values without trimming.
const transcript = z.string().refine((value) => value.trim().length > 0, "Provide non-blank terminal text");
const url = z.url({ protocol: /^https?$/ });
const screenshotPath = /^\.\/shots\/[a-z0-9]+(?:-[a-z0-9]+)*\.png$/;
const link = z.strictObject({ label: text, url });
const option = z.strictObject({ label: text, reason: text, chosen: z.boolean().optional() });
const decision = z.strictObject({
  question: text,
  options: z.array(option).min(2).refine((options) => options.filter(({ chosen }) => chosen).length === 1, "Exactly one option must be chosen"),
  consequence: text,
  evidence: z.array(link).min(1).max(3),
  quote: text.optional(),
});

const nodeId = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const architecture = z.strictObject({
  system: text,
  caption: text.optional(),
  nodes: z.array(z.strictObject({
    id: nodeId,
    kind: z.enum(["container", "store", "external"]),
    label: text,
    name: text,
    repo: text.optional(),
    tech: text.optional(),
    does: z.string().trim().max(48).pipe(text),
    col: z.number().int().min(0).max(3),
    row: z.number().int().min(0).max(4),
  })).min(2).max(10),
  edges: z.array(z.strictObject({
    from: nodeId,
    to: nodeId,
    protocol: text.optional(),
    verb: z.string().trim().max(28).pipe(text),
    evidence: url,
  })),
}).superRefine(({ nodes, edges }, ctx) => {
  const ids = new Set<string>();
  nodes.forEach(({ id }, i) => {
    if (ids.has(id)) ctx.addIssue({ code: "custom", path: ["nodes", i, "id"], message: `Duplicate architecture node id: ${id}` });
    ids.add(id);
  });
  edges.forEach((edge, i) => {
    for (const key of ["from", "to"] as const) {
      if (!ids.has(edge[key])) ctx.addIssue({ code: "custom", path: ["edges", i, key], message: `Unknown architecture node: ${edge[key]}` });
    }
  });
});

const caseStudies = defineCollection({
  loader: glob({
    base: "./src/content/case-studies",
    pattern: "*/{en,es}.md",
    generateId: ({ entry, base, data }) => {
      const [slug] = entry.split("/");
      if (data.project !== slug || !atlasProjects.some((project) => project.slug === slug)) {
        throw new Error(`${entry}: project must match its folder and the project catalog`);
      }
      // Astro resolves image() at build time. Check the capture budget separately,
      // including on builds where frontmatter has been cached but a PNG changed.
      const demonstration = data.demonstration as { kind?: unknown; screenshots?: unknown } | undefined;
      if (demonstration?.kind === "screenshots" && Array.isArray(demonstration.screenshots)) {
        for (const shot of demonstration.screenshots) {
          const src: unknown = shot?.src;
          if (typeof src !== "string" || !screenshotPath.test(src)) {
            throw new Error(`${entry}: screenshot src must be a relative ./shots/<kebab-case>.png path`);
          }
          try {
            if (statSync(new URL(`${slug}/${src.slice(2)}`, base)).size <= 600_000) continue;
          } catch {
            throw new Error(`${entry}: missing screenshot ${src}`);
          }
          throw new Error(`${entry}: screenshot ${src} exceeds 600 KB`);
        }
      }
      return entry.replace(/\.md$/, "");
    },
  }),
  schema: ({ image }) => z.strictObject({
    project: z.string().refine((slug) => atlasProjects.some((project) => project.slug === slug), "Unknown project slug"),
    summary: z.string().trim().min(1).max(160).pipe(text),
    role: text.optional(),
    timeframe: z.string().regex(/^\d{4}(?:[–-]\d{4})?$/).refine((value) => value.length === 4 || value.slice(0, 4) <= value.slice(-4), "Timeframe years must be chronological").optional(),
    team: z.number().int().min(2).optional(),
    demo: z.strictObject({ url, note: text.optional() }).optional(),
    demonstration: z.discriminatedUnion("kind", [
      z.strictObject({ kind: z.literal("screenshots"), screenshots: z.array(z.strictObject({
        src: image(),
        alt: text,
        caption: text,
      })).min(3).max(5) }),
      z.strictObject({ kind: z.literal("terminal"), terminal: z.strictObject({
        caption: text,
        source: z.enum(["run", "readme"]),
        steps: z.array(z.strictObject({
          command: transcript,
          output: transcript,
        })).min(1),
      }) }),
    ]),
    decisions: z.array(decision).min(2).max(3),
    results: z.array(z.strictObject({ label: text, detail: text, url: url.optional() })).min(1).optional(),
    limitations: z.array(text).min(1).optional(),
    architecture: architecture.optional(),
  }).superRefine(({ project, architecture }, ctx) => {
    const catalog = atlasProjects.find(({ slug }) => slug === project);
    if (!architecture || !catalog) return;
    const repositories = new Set<string>(catalog.repositories.map(({ name }) => name));
    const represented = new Set<string>();
    architecture.nodes.forEach(({ kind, name, repo }, i) => {
      if (!repo) return;
      if (!repositories.has(repo)) {
        ctx.addIssue({ code: "custom", path: ["architecture", "nodes", i, "repo"], message: `Unknown project repository: ${repo}` });
      }
      if (kind === "container") {
        represented.add(repo);
        if (name !== repo) ctx.addIssue({ code: "custom", path: ["architecture", "nodes", i, "name"], message: `Repository container name must be ${repo}` });
      }
    });
    for (const repo of repositories) {
      if (!represented.has(repo)) ctx.addIssue({ code: "custom", path: ["architecture", "nodes"], message: `Missing architecture container for repository: ${repo}` });
    }
  }),
});

export const collections = { caseStudies };
