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
const atlasNames = [...projectNames, "Savia", "Academic Triage", "Vale", "Saber Inverso", "doc-sentinel", "resume-maker", "Enterprise Monitoring Stack", "NexRide"];
const workRoutes = { en: "/en/work/", es: "/es/trabajo/" };
const workTitles = { en: "Work", es: "Trabajo" };
const pageRoutes = ["/en/", "/es/", ...Object.values(workRoutes)];
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

test("projects.json keeps the featured entries and adds the complete bilingual atlas", () => {
  const { projects } = JSON.parse(read("projects.json"));
  assert.deepEqual(projects.slice(0, 6).map(({ name }) => name), projectNames);
  assert.deepEqual(new Set(projects.map(({ name }) => name)), new Set(atlasNames));
  assert.equal(projects.length, 14);
  for (const project of projects) {
    assert.ok(project.description.en && project.description.es, project.name);
    assert.ok(project.kind.en && project.kind.es, project.name);
    assert.ok(project.url.startsWith("https://github.com/"), project.name);
    assert.ok(project.repositories.length > 0, project.name);
    assert.ok(Array.isArray(project.stack), project.name);
    assert.equal(project.stack.length === 0, ["doc-sentinel", "NexRide"].includes(project.name), project.name);
  }
});

for (const locale of locales) {
  const path = workRoutes[locale];
  const other = locale === "en" ? "es" : "en";
  const pageTitle = workTitles[locale];
  test(`${locale}: work index has localized metadata, navigation and 14 linked repository maps`, () => {
    const html = read(`${path.slice(1)}index.html`);
    assert.match(html, new RegExp(`<html lang="${locale}"`));
    assert.ok(html.includes(`<title>${pageTitle} | diegnghtmr</title>`));
    assert.ok(html.includes(`<link rel="canonical" href="${site}${path}"`));
    assert.ok(html.includes(`<meta property="og:url" content="${site}${path}"`));
    for (const [lang, route] of Object.entries({ ...workRoutes, "x-default": workRoutes.en })) {
      assert.ok(html.includes(`<link rel="alternate" hreflang="${lang}" href="${site}${route}"`), lang);
    }
    const header = html.match(/<header\b[^>]*data-site-nav[^>]*>[\s\S]*?<\/header>/)?.[0];
    assert.ok(header);
    assert.match(header, new RegExp(`aria-current="page"[^>]*>${pageTitle}</`));
    assert.doesNotMatch(header, /href="#(?:work|oss|about|contact)"/);
    assert.ok(header.includes(`href="/${locale}/"`));
    const tools = header.match(/class="nav-tools[^>]*>[\s\S]*/)?.[0];
    assert.match(tools, new RegExp(`data-search-trigger[\\s\\S]*href="${workRoutes[other]}"[\\s\\S]*data-theme-toggle[\\s\\S]*data-menu-toggle`));
    const rows = [...html.matchAll(/<li\b[^>]*data-project(?:[\s=>])[^]*?<\/li>/g)];
    assert.equal(rows.length, 14);
    for (const [row] of rows) {
      const links = [...row.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)];
      assert.equal(links.length, 1);
      assert.match(links[0][1], /^https:\/\/github\.com\/diegnghtmr\/[\w-]+$/);
      assert.match(links[0][0], /rel="external"/);
      assert.match(row, /<svg\b[^>]*class="repo-map\b[^>]*>[\s\S]*?<circle\b/);
    }
  });

  test(`${locale}: work index publishes a Markdown twin and linked structured data`, () => {
    const folder = path.slice(1);
    const html = read(`${folder}index.html`);
    const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])["@graph"];
    const byType = (type) => graph.find((node) => node["@type"] === type);
    assert.equal(byType("CollectionPage").url, `${site}${path}`);
    const items = byType("ItemList").itemListElement;
    assert.equal(items.length, 14);
    assert.deepEqual(new Set(items.map(({ item }) => item.name)), new Set(atlasNames));
    assert.deepEqual(byType("BreadcrumbList").itemListElement.map(({ item }) => item), [`${site}/${locale}/`, `${site}${path}`]);
    assert.ok(html.includes(`<link rel="alternate" type="text/markdown" href="${path}index.md"`));
    const twin = read(`${folder}index.md`);
    const full = read(locale === "en" ? "llms-full.txt" : "es/llms-full.txt");
    for (const name of atlasNames) assert.ok(twin.includes(name), name);
    assert.ok(full.includes(twin.trimEnd()));
    assert.ok(read("llms.txt").includes(`](${site}${path}index.md)`));
  });

  test(`${locale}: home Work links to the localized index without replacing section anchors`, () => {
    const home = read(`${locale}/index.html`);
    assert.match(home, new RegExp(`<a\\b[^>]*href="${path}"[^>]*>${locale === "en" ? "All 14 projects" : "Los 14 proyectos"}`));
    const header = home.match(/<header\b[^>]*data-site-nav[^>]*>[\s\S]*?<\/header>/)?.[0];
    assert.ok(header);
    for (const id of ["work", "oss", "about", "contact"]) assert.ok(header.includes(`href="#${id}" data-section-link`), id);
    assert.ok(header.includes("data-nav-indicator"));
  });
}

test("sitemap.xml pairs the localized atlas pages without changing the home pairs", () => {
  const xml = read("sitemap.xml");
  for (const path of Object.values(workRoutes)) {
    const entry = xml.split("</url>").find((part) => part.includes(`<loc>${site}${path}</loc>`));
    assert.ok(entry, path);
    for (const [lang, route] of Object.entries({ ...workRoutes, "x-default": workRoutes.en })) {
      assert.ok(entry.includes(`<xhtml:link rel="alternate" hreflang="${lang}" href="${site}${route}"/>`), lang);
    }
  }
});

for (const locale of locales) {
  test(`${locale}: Vercel Web Analytics and Speed Insights load without cookies`, () => {
    const html = read(`${locale}/index.html`);
    assert.match(html, /\/_vercel\/insights\/script\.js/, "Web Analytics script");
    assert.match(html, /\/_vercel\/speed-insights\/script\.js/, "Speed Insights script");
    assert.doesNotMatch(html, /document\.cookie/, "no cookie writes in the page");
    assert.match(html, /<meta name="msvalidate\.01" content="E33540A9513582A85D9BDC5B9E294509"/, "Bing Webmaster verification");
  });
}

test("middleware serves the markdown twin only to clients that ask for markdown", async () => {
  const { default: middleware, config } = await import(new URL("../middleware.js", import.meta.url));
  assert.deepEqual(config.matcher, pageRoutes);
  const call = (path, accept) => middleware(new Request(`${site}${path}`, accept ? { headers: { accept } } : {}));
  for (const path of pageRoutes) {
    for (const accept of ["text/markdown", "text/markdown, text/plain;q=0.5", "text/markdown, text/html;q=0.9"]) {
      const response = await call(path, accept);
      assert.equal(response?.headers.get("x-middleware-rewrite"), `${site}${path}index.md`, `${path} ${accept}`);
    }
    for (const accept of [undefined, "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", "*/*", "text/html, text/markdown;q=0.5"]) {
      assert.equal(await call(path, accept), undefined, `${path} ${accept}`);
    }
  }
});

test("vercel.json sets markdown headers, Vary and the root redirect by language", () => {
  const config = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
  assert.equal(config.rewrites, undefined, "static files win over rewrites on Vercel; negotiation lives in middleware.js");
  const markdownHeaders = config.headers.find((rule) => rule.source === "/(.*)\\.md").headers;
  assert.ok(markdownHeaders.some((header) => header.key === "Content-Type" && header.value.startsWith("text/markdown")));
  for (const path of pageRoutes) {
    const headers = config.headers.filter((rule) => new RegExp(`^${rule.source}$`).test(path)).flatMap((rule) => rule.headers);
    assert.ok(headers.some((header) => header.key === "Vary" && header.value.includes("Accept")), path);
  }
  const spanish = config.redirects.find((rule) => rule.source === "/" && rule.destination === "/es/");
  assert.ok(spanish?.has.some((condition) => condition.key === "accept-language"));
  assert.equal(spanish.permanent, false);
});
