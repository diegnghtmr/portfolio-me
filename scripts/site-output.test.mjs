// Checks the built site (dist/) for the SEO and agent-facing outputs (odd T17-T20).
// Run after `pnpm build`: `pnpm test:site`.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const root = new URL("..", import.meta.url).pathname;
const dist = join(root, "dist");
const site = "https://diegnghtmr.me";
const read = (path) => readFileSync(join(dist, path), "utf8");
const locales = ["en", "es"];
const projectNames = ["StudyDeck AI", "Food Court", "Brújula", "Legajo", "Profundiza UQ", "writing-harness"];
const trainingBots = ["GPTBot", "ClaudeBot", "Google-Extended", "CCBot", "Applebot-Extended"];
// A site URL must map to a file in dist (directory URLs map to index.html).
const resolves = (url) => {
  const path = new URL(url, site).pathname;
  return existsSync(join(dist, path.endsWith("/") ? `${path}index.html` : path));
};

test("robots.txt allows search bots, blocks training bots and points at the sitemap", () => {
  const robots = read("robots.txt");
  assert.match(robots, /User-agent: \*\nAllow: \//);
  for (const bot of trainingBots) assert.match(robots, new RegExp(`User-agent: ${bot}\\nDisallow: /`), bot);
  for (const bot of ["Googlebot", "Bingbot", "OAI-SearchBot", "Claude-SearchBot", "PerplexityBot"]) {
    assert.doesNotMatch(robots, new RegExp(`User-agent: ${bot}\\nDisallow`), bot);
  }
  assert.match(robots, new RegExp(`Sitemap: ${site}/sitemap.xml`));
});

test("sitemap.xml lists both locales with complete hreflang alternates", () => {
  const sitemap = read("sitemap.xml");
  assert.match(sitemap, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
  for (const locale of locales) {
    const entry = sitemap.match(new RegExp(`<url><loc>${site}/${locale}/</loc>[\\s\\S]*?</url>`))?.[0];
    assert.ok(entry, `missing ${locale}`);
    for (const [lang, path] of [["en", "en"], ["es", "es"], ["x-default", "en"]]) {
      assert.ok(entry.includes(`<xhtml:link rel="alternate" hreflang="${lang}" href="${site}/${path}/"/>`), `${locale} ${lang}`);
    }
    assert.match(entry, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  }
});

for (const locale of locales) {
  test(`${locale}: JSON-LD graph, social meta and markdown alternate`, () => {
    const html = read(`${locale}/index.html`);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.equal(blocks.length, 1);
    const graph = JSON.parse(blocks[0][1])["@graph"];
    const byType = (type) => graph.find((node) => node["@type"] === type);
    for (const type of ["WebSite", "Person", "ProfilePage", "ItemList"]) assert.ok(byType(type), type);
    const person = byType("Person");
    assert.equal(person.name, "Diego Alejandro Flores Quintero");
    assert.ok(person.sameAs.includes("https://github.com/diegnghtmr"));
    assert.ok(person.sameAs.some((url) => url.startsWith("https://www.linkedin.com/in/")));
    assert.equal(byType("ProfilePage").inLanguage, locale);
    assert.equal(byType("ProfilePage").mainEntity["@id"], person["@id"]);
    const items = byType("ItemList").itemListElement;
    assert.deepEqual(items.map((item) => item.item.name), projectNames);

    const meta = (attr, key) => html.match(new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`))?.[1];
    const image = meta("property", "og:image");
    assert.ok(image?.startsWith(`${site}/`), "og:image absolute");
    assert.ok(resolves(image), `og:image file ${image}`);
    assert.equal(meta("property", "og:url"), `${site}/${locale}/`);
    assert.equal(meta("property", "og:locale"), locale === "en" ? "en_US" : "es_CO");
    assert.equal(meta("name", "twitter:card"), "summary_large_image");
    assert.ok(meta("property", "og:image:alt"));

    const markdown = html.match(/<link rel="alternate" type="text\/markdown" href="([^"]+)"/)?.[1];
    assert.equal(markdown, `/${locale}/index.md`);
    assert.ok(resolves(markdown));
  });

  test(`${locale}: markdown twin carries the page content`, () => {
    const markdown = read(`${locale}/index.md`);
    assert.match(markdown, /^# Diego Alejandro Flores Quintero\n/);
    for (const name of projectNames) assert.ok(markdown.includes(name), name);
    assert.ok(markdown.includes("floresquintero.da@gmail.com"));
    assert.ok(markdown.includes("basecamp/omarchy"));
  });
}

test("llms.txt follows the llmstxt.org shape and every site link resolves", () => {
  const llms = read("llms.txt");
  const lines = llms.split("\n");
  assert.equal(lines[0], "# Diego Alejandro Flores Quintero");
  assert.ok(lines.some((line) => line.startsWith("> ")), "summary blockquote");
  const links = [...llms.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((match) => match[1]);
  const own = links.filter((url) => url.startsWith(site));
  for (const path of ["/en/index.md", "/es/index.md", "/llms-full.txt", "/es/llms-full.txt", "/resume.json", "/es/resume.json", "/projects.json"]) {
    assert.ok(own.includes(`${site}${path}`), path);
  }
  for (const url of own) assert.ok(resolves(url), url);
  for (const file of ["llms-full.txt", "es/llms-full.txt"]) {
    const full = read(file);
    for (const name of projectNames) assert.ok(full.includes(name), `${file} ${name}`);
  }
});

test("resume.json follows JSON Resume, per locale", () => {
  const [en, es] = ["resume.json", "es/resume.json"].map((file) => JSON.parse(read(file)));
  for (const resume of [en, es]) {
    assert.equal(resume.basics.name, "Diego Alejandro Flores Quintero");
    assert.equal(resume.basics.email, "floresquintero.da@gmail.com");
    assert.ok(resume.basics.profiles.some((profile) => profile.network === "GitHub" && profile.username === "diegnghtmr"));
    assert.ok(resume.work.length >= 1 && resume.education.length >= 1 && resume.skills.length >= 1);
    assert.deepEqual(resume.projects.map((project) => project.name), projectNames);
  }
  assert.notEqual(en.basics.summary, es.basics.summary);
  assert.equal(en.meta.language, "en");
  assert.equal(es.meta.language, "es");
});

test("projects.json lists the six featured projects in both languages", () => {
  const data = JSON.parse(read("projects.json"));
  assert.deepEqual(data.projects.map((project) => project.name), projectNames);
  for (const project of data.projects) {
    assert.ok(project.description.en && project.description.es, project.name);
    assert.ok(project.url.startsWith("https://github.com/"), project.name);
    assert.ok(Array.isArray(project.stack) && project.stack.length > 0, project.name);
  }
});

test("vercel.json negotiates markdown and redirects the root by language", () => {
  const config = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
  for (const locale of locales) {
    const rewrite = config.rewrites.find((rule) => rule.source === `/${locale}/`);
    assert.equal(rewrite?.destination, `/${locale}/index.md`);
    assert.ok(rewrite.has.some((condition) => condition.type === "header" && condition.key === "accept" && /text\/markdown/.test(condition.value)));
  }
  const markdownHeaders = config.headers.find((rule) => rule.source === "/(.*)\\.md").headers;
  assert.ok(markdownHeaders.some((header) => header.key === "Content-Type" && header.value.startsWith("text/markdown")));
  const vary = config.headers.find((rule) => rule.source === "/(en|es)/").headers;
  assert.ok(vary.some((header) => header.key === "Vary" && header.value.includes("Accept")));
  const spanish = config.redirects.find((rule) => rule.source === "/" && rule.destination === "/es/");
  assert.ok(spanish?.has.some((condition) => condition.key === "accept-language"));
  assert.equal(spanish.permanent, false);
});
