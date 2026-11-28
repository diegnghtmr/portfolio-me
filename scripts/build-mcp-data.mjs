// Package only the already-rendered public assets. No Astro or network I/O at request time.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Shared by the snapshot build and the HTTP handler so both count the actual JSON-RPC encoding.
export const maxResponseBytes = 64 * 1024;
export const textResult = (text) => ({ content: [{ type: "text", text }] });
export const jsonResult = (value) => textResult(JSON.stringify(value));
export const fitsResponse = (result, id) =>
  Buffer.byteLength(JSON.stringify({ jsonrpc: "2.0", id, result })) <= maxResponseBytes;

export function localizedProject({ description, kind, studies, ...project }, locale) {
  return { ...project, description: description[locale], kind: kind[locale],
    ...(studies ? { caseStudy: studies[locale].url } : {}) };
}

export function getProjectResult(project, locale, requestId) {
  const record = localizedProject(project, locale);
  if (!project.studies) return { result: jsonResult(record), markdownOmitted: false };
  const result = jsonResult({ ...record, markdown: project.studies[locale].markdown });
  if (fitsResponse(result, requestId)) return { result, markdownOmitted: false };
  return { markdownOmitted: true, result: jsonResult({
    ...record,
    markdownOmitted: "Case-study Markdown omitted because the MCP response would exceed 64 KiB. See caseStudy for the full study.",
  }) };
}

function buildSnapshot() {
  // Astro's build hook passes the directory it actually wrote (honours --outDir).
  const dist = process.argv[2] ? pathToFileURL(`${process.argv[2].replace(/\/$/, "")}/`) : new URL("../dist/", import.meta.url);
  const output = new URL("../api/_generated/", import.meta.url);
  const read = (path) => readFileSync(new URL(path, dist), "utf8");
  const locales = ["en", "es"];
  const workPaths = { en: "en/work/", es: "es/trabajo/" };
  const profiles = {
    en: JSON.parse(read("resume.json")),
    es: JSON.parse(read("es/resume.json")),
  };
  const feed = JSON.parse(read("projects.json"));
  const site = feed.owner.site;

  // The atlas JSON-LD has the public, stable slug even when a project has no case study,
  // or the feed keeps a previously published ID such as p1.
  function atlasItems(locale) {
    const path = workPaths[locale];
    const entries = [...read(`${path}index.html`).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .flatMap(([, json]) => JSON.parse(json)["@graph"] ?? []);
    const list = entries.find((entry) => entry["@type"] === "ItemList" && entry["@id"] === `${site}${path}#projects`);
    if (!list || list.itemListElement.length !== feed.projects.length) {
      throw new Error(`MCP snapshot: ${locale} work index and projects.json disagree on the publication inventory`);
    }
    return list.itemListElement.map(({ item }, index) => {
      const id = new URL(item["@id"]);
      const slug = id.hash.slice(1);
      if (id.href !== `${site}${path}#${slug}` || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
          item.name !== feed.projects[index].name) {
        throw new Error(`MCP snapshot: invalid or mismatched ${locale} work index item at position ${index + 1}`);
      }
      return { slug, url: item.url };
    });
  }

  const atlas = { en: atlasItems("en"), es: atlasItems("es") };
  const projects = feed.projects.map(({ caseStudy, ...project }, index) => {
    const { slug, url } = atlas.en[index];
    if (atlas.es[index].slug !== slug || (caseStudy && caseStudy !== url)) {
      throw new Error(`MCP snapshot: inconsistent published links for ${slug}`);
    }
    if (!caseStudy) return { ...project, slug };
    const studies = Object.fromEntries(locales.map((locale) => {
      const path = `${workPaths[locale]}${slug}/`;
      const localizedUrl = atlas[locale][index].url;
      if (localizedUrl !== `${site}${path}`) {
        throw new Error(`MCP snapshot: invalid ${locale} case-study URL for ${slug}`);
      }
      return [locale, { url: localizedUrl, markdown: read(`${path}index.md`) }];
    }));
    return { ...project, slug, studies };
  });
  if (new Set(projects.map(({ slug }) => slug)).size !== projects.length) {
    throw new Error("MCP snapshot: duplicate project slug");
  }
  for (const project of projects) {
    if (!project.studies) continue;
    for (const locale of locales) {
      // A one-byte ID reports studies that exceed the limit even with the smallest envelope.
      // At request time the real ID is included, so a larger envelope is bounded too.
      if (getProjectResult(project, locale, 0).markdownOmitted) {
        console.warn(`MCP snapshot: get_project ${project.slug} (${locale}) exceeds 64 KiB with Markdown`);
      }
    }
  }
  mkdirSync(output, { recursive: true });
  const snapshot = JSON.stringify({ profiles, projects });
  writeFileSync(new URL("portfolio.json", output), snapshot);
  console.log(`MCP snapshot: ${projects.length} projects, ${Buffer.byteLength(snapshot)} bytes`);
}

if (import.meta.main) buildSnapshot();
