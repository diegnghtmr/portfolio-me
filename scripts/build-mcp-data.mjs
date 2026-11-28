// Package only the already-rendered public assets. No Astro or network I/O at request time.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

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
mkdirSync(output, { recursive: true });
const snapshot = JSON.stringify({ profiles, projects });
writeFileSync(new URL("portfolio.json", output), snapshot);
console.log(`MCP snapshot: ${projects.length} projects, ${Buffer.byteLength(snapshot)} bytes`);
