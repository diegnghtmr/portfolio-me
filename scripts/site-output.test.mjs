// Checks the built site (dist/) for the SEO and agent-facing outputs (odd T17-T20).
// Run after `pnpm build`: `pnpm test:site`.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");
const site = "https://diegnghtmr.me";
const read = (path) => readFileSync(join(dist, path), "utf8");
const locales = ["en", "es"];
// Card ids are stable per project (home anchors, projects.json); the ranking never reassigns them.
const featuredIds = ["p4", "p1", "p7", "p3", "p2", "p5"];
const atlasNames = [
  "Legajo", "StudyDeck AI", "Academic Triage", "Brújula", "Food Court", "Profundiza UQ", "doc-sentinel", "NexRide",
  "Savia", "writing-harness", "Vale", "Saber Inverso", "resume-maker", "Enterprise Monitoring Stack",
];
const projectNames = atlasNames.slice(0, 6);
const workRoutes = { en: "/en/work/", es: "/es/trabajo/" };
const workTitles = { en: "Work", es: "Trabajo" };
const pageRoutes = ["/en/", "/es/", ...Object.values(workRoutes)];
const caseDir = join(root, "src/content/case-studies");
// The production contract must not shrink if a locale file goes missing.
const publishedSlugs = [
  "academic-triage", "brujula", "doc-sentinel", "enterprise-monitoring-stack", "food-court", "legajo", "nexride",
  "profundiza-uq", "resume-maker", "saber-inverso", "savia", "studydeck-ai", "vale", "writing-harness",
];
const caseRoute = (locale, slug) => `${workRoutes[locale]}${slug}/`;
const caseRoutes = publishedSlugs.flatMap((slug) => locales.map((locale) => caseRoute(locale, slug)));
const trainingBots = ["GPTBot", "ClaudeBot", "Google-Extended", "CCBot", "Applebot-Extended"];
const github = "https://github.com/diegnghtmr";
const repoUrl = (name) => `${github}/${name}`;
const repoSearch = (name) => `${github}?tab=repositories&q=${name}`;
const foodServices = ["user-microservice", "food-court-microservice", "order-microservice", "traceability-microservice"];
const featuredContracts = [
  [["api", "web"], [["legajo-backend", "api", "Java"], ["legajo-frontend", "web", "TypeScript"]], ["Java 25", "React 19"], repoUrl("legajo-frontend"), true],
  [["api", "web"], [["studydeck-backend", "api", "Java"], ["studydeck-frontend", "web", "TypeScript"]], ["Java 25", "pgvector", "React 19"], repoUrl("studydeck-backend")],
  [["api", "web"], [["academic-triage-frontend", "web", "TypeScript"], ["academic-triage-system", "api", "Java"]], ["Angular 20", "Spring Boot 3.5"], repoSearch("academic-triage"), true],
  [["api", "web"], [["brujula-backend", "api", "Java"], ["brujula-frontend", "web", "TypeScript"]], ["Spring Modulith", "Keycloak"], repoSearch("brujula")],
  [["4 api", "web"], [["food-court-ui", "web"], ...foodServices.map((name) => [name, "api", "Java"])], ["Spring Boot", "React"], repoSearch("food-court")],
  [["api", "web"], [["profundiza-uq-backend", "api", "Go"], ["profundiza-uq-frontend", "web", "TypeScript"]], ["Go", "pgx", "React 19"], repoUrl("profundiza-uq-backend")],
];
// projects.json entries as published before the relevance ranking (diegnghtmr.me at bcf8fdb).
const publishedProjects = [
{"id":"p1","name":"StudyDeck AI","description":{"en":"Spaced-repetition flashcards with AI card generation, document RAG and an MCP server.","es":"Tarjetas de repaso espaciado con generación por IA, RAG sobre documentos y un servidor MCP."},"kind":{"en":"System, 2 repos","es":"Sistema, 2 repos"},"categories":["api","web"],"repositories":[{"name":"studydeck-backend","surface":"api","url":"https://github.com/diegnghtmr/studydeck-backend","role":"api","programmingLanguage":"Java"},{"name":"studydeck-frontend","surface":"web","url":"https://github.com/diegnghtmr/studydeck-frontend","role":"web","programmingLanguage":"TypeScript"}],"stack":["Java 25","pgvector","React 19"],"url":"https://github.com/diegnghtmr/studydeck-backend","live":false,"caseStudy":"https://diegnghtmr.me/en/work/studydeck-ai/"},
{"id":"p2","name":"Food Court","description":{"en":"Ordering platform split into identity, menu, order and traceability services plus a role-based UI.","es":"Plataforma de pedidos dividida en servicios de identidad, menú, pedidos y trazabilidad, más una interfaz por roles."},"kind":{"en":"System, 5 repos","es":"Sistema, 5 repos"},"categories":["4 api","web"],"repositories":[{"name":"food-court-ui","surface":"web","url":"https://github.com/diegnghtmr/food-court-ui","role":"web"},{"name":"user-microservice","surface":"api","url":"https://github.com/diegnghtmr/user-microservice","role":"identity","programmingLanguage":"Java"},{"name":"food-court-microservice","surface":"api","url":"https://github.com/diegnghtmr/food-court-microservice","role":"menu","programmingLanguage":"Java"},{"name":"order-microservice","surface":"api","url":"https://github.com/diegnghtmr/order-microservice","role":"orders","programmingLanguage":"Java"},{"name":"traceability-microservice","surface":"api","url":"https://github.com/diegnghtmr/traceability-microservice","role":"traceability","programmingLanguage":"Java"}],"stack":["Spring Boot","React"],"url":"https://github.com/diegnghtmr?tab=repositories&q=food-court","live":false,"caseStudy":"https://diegnghtmr.me/en/work/food-court/"},
{"id":"p3","name":"Brújula","description":{"en":"Academic planning for Universidad del Quindío: curriculum graph, degree progress and semester simulation.","es":"Planeación académica para la Universidad del Quindío: grafo curricular, avance de carrera y simulación de semestres."},"kind":{"en":"System, 2 repos","es":"Sistema, 2 repos"},"categories":["api","web"],"repositories":[{"name":"brujula-backend","surface":"api","url":"https://github.com/diegnghtmr/brujula-backend","role":"api","programmingLanguage":"Java"},{"name":"brujula-frontend","surface":"web","url":"https://github.com/diegnghtmr/brujula-frontend","role":"web","programmingLanguage":"TypeScript"}],"stack":["Spring Modulith","Keycloak"],"url":"https://github.com/diegnghtmr?tab=repositories&q=brujula","live":false,"caseStudy":"https://diegnghtmr.me/en/work/brujula/"},
{"id":"p4","name":"Legajo","description":{"en":"Text similarity and hierarchical clustering over scientific abstracts, with traces and dendrograms.","es":"Similitud de textos y agrupamiento jerárquico sobre resúmenes científicos, con trazas y dendrogramas."},"kind":{"en":"System, 2 repos","es":"Sistema, 2 repos"},"categories":["api","web"],"repositories":[{"name":"legajo-backend","surface":"api","url":"https://github.com/diegnghtmr/legajo-backend","role":"api","programmingLanguage":"Java"},{"name":"legajo-frontend","surface":"web","url":"https://github.com/diegnghtmr/legajo-frontend","role":"web","programmingLanguage":"TypeScript"}],"stack":["Java 25","React 19"],"url":"https://github.com/diegnghtmr/legajo-frontend","live":true,"caseStudy":"https://diegnghtmr.me/en/work/legajo/"},
{"id":"p5","name":"Profundiza UQ","description":{"en":"Elective enrollment with server-generated arrival order and per-group capacity under row-level locking.","es":"Inscripción a electivas con orden de llegada generado en el servidor y cupos por grupo bajo bloqueo de filas."},"kind":{"en":"System, 2 repos","es":"Sistema, 2 repos"},"categories":["api","web"],"repositories":[{"name":"profundiza-uq-backend","surface":"api","url":"https://github.com/diegnghtmr/profundiza-uq-backend","role":"api","programmingLanguage":"Go"},{"name":"profundiza-uq-frontend","surface":"web","url":"https://github.com/diegnghtmr/profundiza-uq-frontend","role":"web","programmingLanguage":"TypeScript"}],"stack":["Go","pgx","React 19"],"url":"https://github.com/diegnghtmr/profundiza-uq-backend","live":false,"caseStudy":"https://diegnghtmr.me/en/work/profundiza-uq/"},
{"id":"p6","name":"writing-harness","description":{"en":"Spanish writing skills plus a verifier that measures whether a text follows them. Runs on Node 22.6 with nothing installed.","es":"Skills de redacción en español y un verificador que mide si un texto las cumple. Corre en Node 22.6 sin instalar nada."},"kind":{"en":"Headless, 1 repo","es":"Sin interfaz, 1 repo"},"categories":["cli"],"repositories":[{"name":"writing-harness","surface":"cli","url":"https://github.com/diegnghtmr/writing-harness","role":"cli","programmingLanguage":"TypeScript"}],"stack":["Node","zero deps"],"url":"https://github.com/diegnghtmr/writing-harness","live":false,"caseStudy":"https://diegnghtmr.me/en/work/writing-harness/"},
{"id":"savia","name":"Savia","description":{"en":"Personal finance across web, mobile, API and MCP. In progress.","es":"Finanzas personales con web, móvil, API y MCP. En desarrollo."},"kind":{"en":"Web + mobile + API + MCP","es":"Web + móvil + API + MCP"},"categories":["web","api","cli"],"repositories":[{"name":"savia-web","surface":"web","url":"https://github.com/diegnghtmr/savia-web","role":"web"},{"name":"savia-mobile","surface":"web","url":"https://github.com/diegnghtmr/savia-mobile","role":"mobile"},{"name":"savia-backend","surface":"api","url":"https://github.com/diegnghtmr/savia-backend","role":"api"},{"name":"savia-mcp","surface":"cli","url":"https://github.com/diegnghtmr/savia-mcp","role":"mcp"}],"stack":["NestJS/Fastify","Next.js","Expo"],"url":"https://github.com/diegnghtmr/savia-web","live":false,"caseStudy":"https://diegnghtmr.me/en/work/savia/"},
{"id":"academic-triage","name":"Academic Triage","description":{"en":"Academic request triage over a Java backend contract.","es":"Clasificación de solicitudes académicas sobre un contrato de backend en Java."},"kind":{"en":"Web + API","es":"Web + API"},"categories":["web","api"],"repositories":[{"name":"academic-triage-frontend","surface":"web","url":"https://github.com/diegnghtmr/academic-triage-frontend","role":"web","programmingLanguage":"TypeScript"},{"name":"academic-triage-system","surface":"api","url":"https://github.com/diegnghtmr/academic-triage-system","role":"api","programmingLanguage":"Java"}],"stack":["Angular 20","Java 21","Spring Boot 3.5","MariaDB 11"],"url":"https://github.com/diegnghtmr/academic-triage-frontend","live":false,"caseStudy":"https://diegnghtmr.me/en/work/academic-triage/"},
{"id":"vale","name":"Vale","description":{"en":"Academic schedule planner with calendar export.","es":"Planificador de horarios académicos con exportación al calendario."},"kind":{"en":"Web app","es":"Aplicación web"},"categories":["web"],"repositories":[{"name":"vale","surface":"web","url":"https://github.com/diegnghtmr/vale","role":"web","programmingLanguage":"TypeScript"}],"stack":["TypeScript","React","Vite","FullCalendar"],"url":"https://github.com/diegnghtmr/vale","live":false,"caseStudy":"https://diegnghtmr.me/en/work/vale/"},
{"id":"saber-inverso","name":"Saber Inverso","description":{"en":"Estimates Saber 11 scores from a UQ program and weighted admission score, with uncertainty.","es":"Estima puntajes de Saber 11 a partir de un programa de la UQ y su puntaje ponderado de admisión, con incertidumbre."},"kind":{"en":"Web app","es":"Aplicación web"},"categories":["web"],"repositories":[{"name":"saber-inverso","surface":"web","url":"https://github.com/diegnghtmr/saber-inverso","role":"web"}],"stack":["Astro","TypeScript","Python","FastAPI"],"url":"https://github.com/diegnghtmr/saber-inverso","live":false,"caseStudy":"https://diegnghtmr.me/en/work/saber-inverso/"},
{"id":"doc-sentinel","name":"doc-sentinel","description":{"en":"CLI that strips document traces and detects prompt injection.","es":"CLI que elimina rastros de documentos y detecta inyecciones de instrucciones."},"kind":{"en":"CLI","es":"CLI"},"categories":["cli"],"repositories":[{"name":"doc-sentinel","surface":"cli","url":"https://github.com/diegnghtmr/doc-sentinel","role":"cli","programmingLanguage":"Python"}],"stack":["Python"],"url":"https://github.com/diegnghtmr/doc-sentinel","live":false,"caseStudy":"https://diegnghtmr.me/en/work/doc-sentinel/"},
{"id":"resume-maker","name":"resume-maker","description":{"en":"Build pipeline for publishing résumé PDFs.","es":"Flujo de compilación para publicar hojas de vida en PDF."},"kind":{"en":"Build pipeline","es":"Flujo de compilación"},"categories":["cli"],"repositories":[{"name":"resume-maker","surface":"cli","url":"https://github.com/diegnghtmr/resume-maker","role":"pipeline"}],"stack":["LaTeX"],"url":"https://github.com/diegnghtmr/resume-maker","live":false,"caseStudy":"https://diegnghtmr.me/en/work/resume-maker/"},
{"id":"enterprise-monitoring-stack","name":"Enterprise Monitoring Stack","description":{"en":"Team project for containerized monitoring with redundant storage.","es":"Proyecto en equipo para monitoreo en contenedores con almacenamiento redundante."},"kind":{"en":"Infrastructure","es":"Infraestructura"},"categories":["infra"],"repositories":[{"name":"enterprise-monitoring-stack","surface":"infra","url":"https://github.com/diegnghtmr/enterprise-monitoring-stack","role":"infra"}],"stack":["Docker","RAID 1","LVM","Netdata"],"url":"https://github.com/diegnghtmr/enterprise-monitoring-stack","live":false,"caseStudy":"https://diegnghtmr.me/en/work/enterprise-monitoring-stack/"},
{"id":"nexride","name":"NexRide","description":{"en":"Ride dispatch backend with pickup suggestions and composite scoring.","es":"Backend de asignación de viajes con sugerencias de recogida y una puntuación compuesta."},"kind":{"en":"API","es":"API"},"categories":["api"],"repositories":[{"name":"NexRide","surface":"api","url":"https://github.com/diegnghtmr/NexRide","role":"api","programmingLanguage":"TypeScript"}],"stack":["TypeScript","NestJS 11","PostgreSQL/PostGIS","Redis"],"url":"https://github.com/diegnghtmr/NexRide","live":false,"caseStudy":"https://diegnghtmr.me/en/work/nexride/"}
];
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
const workRows = (html) => [...html.matchAll(/(<li\b[^>]*\sdata-project(?:\s[^>]*|)>)([\s\S]*?)<\/li>/g)];
const commandProjects = (html) => {
  const group = html.match(/<li\b[^>]*aria-labelledby="command-group-projects"[^>]*>[\s\S]*?<\/ul>/)?.[0];
  assert.ok(group, "project command group");
  return [...group.matchAll(/<li\b[^>]*role="option"[^>]*>/g)].map(([tag]) => ({
    name: attr(tag, "data-command-label"), target: attr(tag, "data-command-target"), stack: attr(tag, "data-command-stack"),
  }));
};
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
    assert.deepEqual(items.map(({ item, position }) => [item.name, position]), projectNames.map((name, i) => [name, i + 1]));

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
  assert.deepEqual([...llms.matchAll(/^- \[(.+) \(EN\)\]\(/gm)].map(([, name]) => name), atlasNames);
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
  assert.deepEqual(projects.map(({ name }) => name), atlasNames);
  assert.equal(projects.length, 14);
  for (const project of projects) {
    assert.ok(project.description.en && project.description.es, project.name);
    assert.ok(project.kind.en && project.kind.es, project.name);
    assert.ok(project.url.startsWith("https://github.com/"), project.name);
    assert.ok(project.repositories.length > 0, project.name);
    assert.ok(Array.isArray(project.stack) && project.stack.length > 0, project.name);
  }
  const docSentinel = projects.find(({ name }) => name === "doc-sentinel");
  assert.deepEqual(docSentinel.stack, ["Python"]);
  assert.equal(docSentinel.repositories[0].programmingLanguage, "Python");
  const nexRide = projects.find(({ name }) => name === "NexRide");
  assert.deepEqual(nexRide.stack, ["TypeScript", "NestJS 11", "PostgreSQL/PostGIS", "Redis"]);
  assert.equal(nexRide.repositories[0].programmingLanguage, "TypeScript");
});

test("projects.json keeps every previously published entry unchanged; the ranking changes only the order", () => {
  const { projects } = JSON.parse(read("projects.json"));
  // Snapshot of projects.json as published before the ranking (diegnghtmr.me at bcf8fdb).
  const published = publishedProjects;
  assert.deepEqual(projects.map(({ id }) => id).sort(), published.map(({ id }) => id).sort());
  for (const entry of published) assert.deepEqual(projects.find(({ id }) => id === entry.id), entry, entry.id);
  assert.deepEqual(projects.map(({ name }) => name), atlasNames);
  const specializedRoles = new Map([
    ...foodServices.map((name, index) => [name, ["identity", "menu", "orders", "traceability"][index]]),
    ["savia-mobile", "mobile"], ["savia-mcp", "mcp"], ["resume-maker", "pipeline"],
  ]);
  for (const project of projects) {
    for (const { name, surface, role } of project.repositories) {
      assert.equal(role, specializedRoles.get(name) ?? surface, name);
    }
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
      const slug = attr(row.match(/<li\b[^>]*>/)[0], "id");
      if (publishedSlugs.includes(slug)) {
        assert.equal(links[0][1], caseRoute(locale, slug));
        assert.doesNotMatch(links[0][0], /rel="external"/);
      } else {
        assert.match(links[0][1], /^https:\/\/github\.com\/diegnghtmr\/[\w-]+$/);
        assert.match(links[0][0], /rel="external"/);
      }
      assert.match(row, /<svg\b[^>]*class="repo-map\b[^>]*>[\s\S]*?<circle\b/);
    }
  });

  test(`${locale}: the work index renders all projects as one ranked list`, () => {
    const html = read(`${path.slice(1)}index.html`);
    const list = html.match(/<ol\b[^>]*class="atlas-projects"[^>]*>[\s\S]*?<\/ol>/)?.[0];
    assert.ok(list, "a single ordered results list");
    const rows = workRows(list);
    assert.deepEqual(rows.map(([, , body]) => body.match(/<h3\b[^>]*>([^<]+)<\/h3>/)[1]), atlasNames);
    assert.equal(workRows(html).length, rows.length);
  });

  test(`${locale}: the work command menu searches all project names and stacks and targets their rows`, () => {
    const html = read(`${path.slice(1)}index.html`);
    const options = commandProjects(html);
    assert.equal(options.length, 14);
    assert.deepEqual(options.map(({ name }) => name), atlasNames);
    const rows = workRows(html);
    const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])["@graph"];
    const items = graph.find((node) => node["@type"] === "ItemList").itemListElement.map(({ item }) => item);
    for (const { name, target, stack } of options) {
      const item = items.find((item) => item.name === name);
      assert.equal(target, new URL(item["@id"]).hash, name);
      const row = rows.find(([, tag]) => attr(tag, "id") === target.slice(1));
      assert.ok(row, target);
      assert.match(row[2], new RegExp(`<h3\\b[^>]*>${name}</h3>`));
      assert.equal(stack, item.keywords ?? undefined, name);
    }
    assert.equal(options.find(({ name }) => name === "Saber Inverso").target, "#saber-inverso");
    assert.match(options.find(({ name }) => name === "Profundiza UQ").stack, /^Go\b/);
  });

  test(`${locale}: Includes surface counts repositories and the results breakdown counts primary surfaces`, () => {
    const html = read(`${path.slice(1)}index.html`);
    const rows = workRows(html);
    const savia = rows.find(([, , body]) => /<h3\b[^>]*>Savia<\/h3>/.test(body));
    assert.ok(savia);
    assert.equal(attr(savia[1], "data-surface"), "web api tool");
    assert.deepEqual([...html.matchAll(/data-breakdown="(\w+)"[^>]*>(\d+)<\/strong>/g)].map(([, surface, count]) => [surface, Number(count)]),
      [["web", 9], ["api", 1], ["tool", 3], ["infra", 1]]);
    const tools = rows.filter(([, tag]) => attr(tag, "data-surface").split(" ").includes("tool"));
    assert.deepEqual(tools.map(([, , body]) => body.match(/<h3\b[^>]*>([^<]+)<\/h3>/)[1]).sort(),
      ["Savia", "doc-sentinel", "resume-maker", "writing-harness"]);
    const facet = html.match(/<button\b[^>]*data-facet="surface"[^>]*value="tool"[^>]*>[\s\S]*?<\/button>/)?.[0];
    assert.match(facet, /data-facet-count>4<\/span>/);
  });

  test(`${locale}: primary links and repository map edges match their named repositories`, () => {
    const rows = workRows(read(`${path.slice(1)}index.html`));
    const byName = new Map(rows.map(([, , body]) => [body.match(/<h3\b[^>]*>([^<]+)<\/h3>/)[1], body]));
    const fallbacks = {
      "StudyDeck AI": repoUrl("studydeck-backend"), "Food Court": repoUrl("food-court-ui"), Brújula: repoUrl("brujula-backend"),
      Legajo: repoUrl("legajo-frontend"), "Profundiza UQ": repoUrl("profundiza-uq-backend"), Savia: repoUrl("savia-web"),
      "Academic Triage": repoUrl("academic-triage-frontend"), Vale: repoUrl("vale"), "Saber Inverso": repoUrl("saber-inverso"),
      NexRide: repoUrl("NexRide"), "writing-harness": repoUrl("writing-harness"), "doc-sentinel": repoUrl("doc-sentinel"),
      "resume-maker": repoUrl("resume-maker"), "Enterprise Monitoring Stack": repoUrl("enterprise-monitoring-stack"),
    };
    const bySlug = new Map(rows.map(([, tag, body]) => [attr(tag, "id"), body]));
    for (const [slug, row] of bySlug) {
      const name = row.match(/<h3\b[^>]*>([^<]+)<\/h3>/)[1];
      assert.equal(attr(row.match(/<a\b[^>]*>/)[0], "href"), publishedSlugs.includes(slug) ? caseRoute(locale, slug) : fallbacks[name], name);
    }
    const edgesFor = (name) => {
      const row = byName.get(name);
      const nodes = new Map([...row.matchAll(/<circle\b[^>]*>/g)].map(([tag]) => [`${attr(tag, "cx")} ${attr(tag, "cy")}`, attr(tag, "data-repository")]));
      return [...row.matchAll(/<path\b[^>]*\sd="M(\d+ \d+) Q[\d.]+ [\d.]+ (\d+ \d+)"/g)]
        .map(([, from, to]) => [nodes.get(from), nodes.get(to)]);
    };
    assert.deepEqual(edgesFor("Food Court"), foodServices.map((name) => ["food-court-ui", name]));
    assert.deepEqual(edgesFor("Savia"), [["savia-web", "savia-backend"]]);
  });

  test(`${locale}: repository map accessible labels describe roles and connections`, () => {
    const rows = workRows(read(`${path.slice(1)}index.html`));
    const labelFor = (name) => {
      const row = rows.find(([, , body]) => body.includes(`>${name}</h3>`));
      return attr(row[2].match(/<svg\b[^>]*>/)[0], "aria-label");
    };
    const connects = locale === "en" ? "connects to" : "se conecta con";
    const foodRoles = locale === "en" ? ["Identity", "Menu", "Orders", "Traceability"] : ["Identidad", "Menú", "Pedidos", "Trazabilidad"];
    assert.equal(labelFor("Food Court"), `Web: food-court-ui; ${foodServices.map((name, i) => `${foodRoles[i]}: ${name}`).join("; ")}. food-court-ui ${connects} ${foodServices.join(", ")}.`);
    const mobile = locale === "en" ? "Mobile" : "Móvil";
    assert.equal(labelFor("Savia"), `Web: savia-web; ${mobile}: savia-mobile; API: savia-backend; MCP: savia-mcp. savia-web ${connects} savia-backend.`);
    assert.equal(labelFor("Saber Inverso"), "Web: saber-inverso");
  });

  test(`${locale}: dossiers label paired, branched and isolated repositories without mapping a single repo`, () => {
    const chapter = (slug) => read(`${caseRoute(locale, slug).slice(1)}index.html`)
      .match(/<section\b[^>]*id="architecture"[^>]*>[\s\S]*?<\/section>/)[0];
    const mapFor = (slug) => chapter(slug).match(/<figure\b[^>]*class="case-repo-map"[^>]*>([\s\S]*?)<\/figure>/)?.[1];
    const caption = locale === "en" ? "Repository map" : "Mapa de repositorios";
    const connects = locale === "en" ? "connects to" : "se conecta con";
    const mobile = locale === "en" ? "Mobile" : "Móvil";
    const foodRoles = locale === "en" ? ["Identity", "Menu", "Orders", "Traceability"] : ["Identidad", "Menú", "Pedidos", "Trazabilidad"];
    const check = (slug, description, connected, detached = []) => {
      if (/^architecture:/m.test(caseSource(slug, locale))) {
        assert.match(chapter(slug), /class="case-arch"/);
        assert.equal(mapFor(slug), undefined);
        return;
      }
      const map = mapFor(slug);
      assert.ok(map, slug);
      assert.ok(map.includes(`<figcaption>${caption}</figcaption>`), slug);
      const graphic = map.match(/<[^>]*\srole="img"[^>]*>/)?.[0];
      assert.ok(graphic, slug);
      assert.equal(attr(graphic, "aria-label"), description, slug);
      const rows = [...map.matchAll(/<div\b[^>]*class="map-network( map-detached)?"[^>]*>([\s\S]*?)<\/div>/g)];
      assert.deepEqual(rows.map(([, isolated, row]) => [Boolean(isolated), [...row.matchAll(
        /<span\b[^>]*class="map-name"[^>]*>([^<]+)<\/span>\s*<span\b[^>]*class="map-role"[^>]*>([^<]+)<\/span>/g,
      )].map(([, name, role]) => [name, role])]), [[false, connected], ...(detached.length ? [[true, detached]] : [])], slug);
    };
    check("brujula", `API: brujula-backend; Web: brujula-frontend. brujula-backend ${connects} brujula-frontend.`,
      [["brujula-backend", "API"], ["brujula-frontend", "Web"]]);
    check("food-court", `Web: food-court-ui; ${foodServices.map((name, i) => `${foodRoles[i]}: ${name}`).join("; ")}. food-court-ui ${connects} ${foodServices.join(", ")}.`,
      [["food-court-ui", "Web"], ...foodServices.map((name, i) => [name, foodRoles[i]])]);
    check("savia", `Web: savia-web; ${mobile}: savia-mobile; API: savia-backend; MCP: savia-mcp. savia-web ${connects} savia-backend.`,
      [["savia-web", "Web"], ["savia-backend", "API"]], [["savia-mobile", mobile], ["savia-mcp", "MCP"]]);
    for (const slug of publishedSlugs) assertDiagramGeometry(chapter(slug), locale, slug);
    assert.equal(mapFor("writing-harness"), undefined);
    assert.match(chapter("writing-harness"), /<a href="https:\/\/github\.com\/diegnghtmr\/writing-harness"[^>]*><strong>writing-harness<\/strong>/);
  });

  test(`${locale}: work index publishes a Markdown twin and linked structured data`, () => {
    const folder = path.slice(1);
    const html = read(`${folder}index.html`);
    const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])["@graph"];
    const byType = (type) => graph.find((node) => node["@type"] === type);
    assert.equal(byType("CollectionPage").url, `${site}${path}`);
    const items = byType("ItemList").itemListElement;
    assert.equal(items.length, 14);
    assert.deepEqual(items.map(({ item, position }) => [item.name, position]), atlasNames.map((name, i) => [name, i + 1]));
    assert.deepEqual(byType("BreadcrumbList").itemListElement.map(({ item }) => item), [`${site}/${locale}/`, `${site}${path}`]);
    assert.ok(html.includes(`<link rel="alternate" type="text/markdown" href="${path}index.md"`));
    const twin = read(`${folder}index.md`);
    const full = read(locale === "en" ? "llms-full.txt" : "es/llms-full.txt");
    assert.deepEqual([...twin.matchAll(/^#{2,3} \[(.+)\]\(/gm)].map(([, name]) => name), atlasNames);
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
    assert.deepEqual(commandProjects(home), projectNames.map((name, i) => ({ name, target: `#${featuredIds[i]}`, stack: undefined })));
  });

  test(`${locale}: retired home anchor #p6 still leads to the writing-harness case study`, () => {
    const home = read(`${locale}/index.html`);
    assert.match(home, new RegExp(`<p class="retired-card" id="p6"[^>]*><a href="${caseRoute(locale, "writing-harness")}" data-retired-card[^>]*>writing-harness `));
    assert.match(home, /decodeURIComponent\(id\)[\s\S]*location\.replace\(link\.href\)/);
    assert.equal([...home.matchAll(/\sid="p6"/g)].length, 1);
  });

  test(`${locale}: home cards follow the top-six ranking and keep principle evidence linked by project`, () => {
    const home = read(`${locale}/index.html`);
    const cards = [...home.matchAll(/<li class="card" id="(p\d)"[^>]*>\s*<a\b[^>]*>\s*<div\b[^>]*data-bayer="([^"]+)"[^>]*>\s*<\/div>\s*<h3\b[^>]*>([^<]+)([\s\S]*?)<\/h3>/g)];
    assert.deepEqual(cards.map(([, id, shape, name, titleSuffix]) => [id, shape, name.trim(), titleSuffix.includes('class="status"')]),
      projectNames.map((name, i) => [featuredIds[i], ["orbit", "dunes", "sphere", "wave", "ripple", "capacity"][i], name, featuredContracts[i][4] ?? false]));
    const principles = home.match(/<section\b[^>]*aria-labelledby="principles-heading"[^>]*>[\s\S]*?<\/section>/)[0];
    assert.deepEqual([...principles.matchAll(/<a href="#(p\d)"[^>]*><span\b[^>]*><small[^>]*>[^<]*<\/small>([^<]+)<\/span>/g)]
      .map(([, id, name]) => [id, name]), [["p3", "Brújula"], ["p1", "StudyDeck AI"], ["p5", "Profundiza UQ"]]);
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
  const call = (path, accept) => middleware(new Request(`${site}${path}`, accept ? { headers: { accept } } : {}));
  for (const path of [...pageRoutes, ...caseRoutes]) {
    assert.ok(config.matcher.some((pattern) => new RegExp(`^${pattern}$`).test(path)), path);
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
  for (const path of [...pageRoutes, ...caseRoutes]) {
    const headers = config.headers.filter((rule) => new RegExp(`^${rule.source}$`).test(path)).flatMap((rule) => rule.headers);
    assert.ok(headers.some((header) => header.key === "Vary" && header.value.includes("Accept")), path);
  }
  const spanish = config.redirects.find((rule) => rule.source === "/" && rule.destination === "/es/");
  assert.ok(spanish?.has.some((condition) => condition.key === "accept-language"));
  assert.equal(spanish.permanent, false);
});

test("S25: only the dither PNGs and SVG favicon get the non-immutable asset cache policy", () => {
  const { headers } = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
  const cacheHeaders = (path) => headers.filter(({ source }) => new RegExp(`^${source}$`).test(path))
    .flatMap((rule) => rule.headers).filter(({ key }) => key.toLowerCase() === "cache-control")
    .map(({ value }) => value);
  const policy = "public, max-age=86400, stale-while-revalidate=604800";
  for (const file of readdirSync(join(dist, "dither")).filter((file) => file.endsWith(".png"))) {
    assert.deepEqual(cacheHeaders(`/dither/${file}`), [policy], file);
  }
  assert.deepEqual(cacheHeaders("/favicon.svg"), [policy]);
  for (const path of ["/favicon.ico", "/dither/a.jpg", "/en/", "/en/index.md"]) {
    assert.deepEqual(cacheHeaders(path), [], path);
  }
});

test("S25: the hero retains intrinsically sized, decorative poster images for both themes", () => {
  for (const locale of locales) {
    const figure = read(`${locale}/index.html`).match(/<figure\b[^>]*class="[^"]*\bhero-poster\b[^"]*"[^>]*>[\s\S]*?<\/figure>/)?.[0];
    assert.ok(figure, locale);
    assert.match(figure, /aria-hidden="true"/);
    assert.deepEqual([...figure.matchAll(/<img\b[^>]*>/g)].map(([tag]) =>
      [attr(tag, "src"), attr(tag, "width"), attr(tag, "height"), attr(tag, "alt")]), [
      ["/dither/hero-poster-dark.png", "150", "110", ""],
      ["/dither/hero-poster-light.png", "150", "110", ""],
    ]);
  }
});

test("S25: home and dossier defer sections after their first, and the footer", () => {
  for (const locale of locales) {
    const home = read(`${locale}/index.html`);
    const dossier = read(`${caseRoute(locale, "writing-harness")}index.html`);
    assert.match(home, /<main\b[^>]*class="home-sections"[^>]*id="main"/);
    assert.match(home, /\.home-sections\s*>\s*section:not\(:first-child\)/);
    for (const id of ["demonstration", "architecture", "decisions", "next-project"]) {
      const chapter = [...dossier.matchAll(/<section\b[^>]*>/g)].map(([tag]) => tag).find((tag) => attr(tag, "id") === id);
      assert.match(attr(chapter ?? "", "class"), /\bdefer-render\b/, id);
    }
    assert.doesNotMatch(dossier.match(/<section\b[^>]*id="problem"[^>]*>/)?.[0] ?? "", /defer-render/);
    for (const html of [home, dossier]) {
      assert.match(html, /<footer\b[^>]*class="[^"]*\bdefer-render\b/);
      assert.match(html, /content-visibility:\s*auto\b/);
      assert.match(html, /contain-intrinsic-(?:block-)?size:\s*auto\b/);
    }
  }
});

test("S25: the footer lets the portrait script choose the sole image URL", () => {
  for (const locale of locales) {
    const html = read(`${locale}/index.html`);
    const figure = html.match(/<figure\b[^>]*\bdata-portrait="[^"]+"[^>]*>[\s\S]*?<\/figure>/)?.[0];
    assert.ok(figure, locale);
    const markup = figure.replace(/<noscript>[\s\S]*?<\/noscript>/g, "");
    assert.equal([...markup.matchAll(/<img\b/g)].length, 1);
    assert.doesNotMatch(markup, /<img\b[^>]*\bsrc="\/dither\/portrait-/);
    assert.match(figure, /<noscript>\s*<img\b[^>]*\bsrc="\/dither\/portrait-dark-0\.png"/);
  }
});

const dossierSlugs = (output, locale, extension) => {
  const folder = join(output, workRoutes[locale]);
  return readdirSync(folder, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(folder, entry.name, `index.${extension}`)))
    .map((entry) => entry.name).sort();
};

function assertDossierInventory(output, expected) {
  for (const locale of locales) {
    for (const extension of ["html", "md"]) assert.deepEqual(dossierSlugs(output, locale, extension), expected, `${locale} ${extension}`);
  }
}

test("production publishes exactly the 14 pinned dossiers in HTML and Markdown in both locales", () => {
  assertDossierInventory(dist, publishedSlugs);
  const catalog = JSON.parse(read("projects.json")).projects;
  assert.deepEqual(catalog.flatMap(({ caseStudy }) => caseStudy ? [caseStudy] : []).sort(),
    publishedSlugs.map((slug) => `${site}${caseRoute("en", slug)}`));
});

const caseSource = (slug, locale) => readFileSync(join(caseDir, slug, `${locale}.md`), "utf8");

const fixtureSource = (slug, locale) => caseSource(slug, locale).replace(/^architecture:[^\n]*\n(?:^[ \t][^\n]*\n|^\n)*/m, "");

function buildCaseFixture(t, english = fixtureSource("writing-harness", "en"), extra = {}) {
  const fixture = mkdtempSync(join(tmpdir(), "portfolio-case-"));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  // Run the real Astro config, loader and routes, with their own output and caches.
  for (const file of ["astro.config.mjs", "package.json", "tsconfig.json"]) cpSync(join(root, file), join(fixture, file));
  cpSync(join(root, "src"), join(fixture, "src"), {
    recursive: true,
    filter: (path) => path !== caseDir && !basename(path).startsWith("."),
  });
  const dependencies = JSON.parse(readFileSync(join(fixture, "package.json"), "utf8"));
  for (const name of Object.keys({ ...dependencies.dependencies, ...dependencies.devDependencies })) {
    const target = join(fixture, "node_modules", name);
    mkdirSync(dirname(target), { recursive: true });
    symlinkSync(join(root, "node_modules", name), target, "junction");
  }
  for (const [path, content] of Object.entries({
    "writing-harness/en.md": english,
    "writing-harness/es.md": fixtureSource("writing-harness", "es"),
    ...extra,
  })) {
    const file = join(fixture, "src/content/case-studies", path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
  const build = spawnSync(process.execPath, [join(fixture, "node_modules/astro/bin/astro.mjs"), "build"], {
    cwd: fixture, encoding: "utf8", env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
  });
  assert.ifError(build.error);
  const output = join(fixture, "dist");
  return { build, output, read: (path) => readFileSync(join(output, path), "utf8") };
}

const assertBuilt = ({ build }) => {
  assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);
  assert.equal(build.stderr, "");
};
const writingDossier = (extension) => `${caseRoute("en", "writing-harness")}index.${extension}`;

test("terminal commands and output preserve literal placeholder-like words", (t) => {
  const command = "  onboarding --prompt TBD  ";
  const output = "Press Enter to confirm\npending";
  const english = fixtureSource("writing-harness", "en")
    .replace("command: node src/cli.ts evals/fixtures/sucio.txt", `command: ${JSON.stringify(command)}`)
    .replace(/(output: \|-\n)[\s\S]*?(?=\n      - command:)/, `$1${output.split("\n").map((line) => `          ${line}`).join("\n")}`);
  const fixture = buildCaseFixture(t, english);
  assertBuilt(fixture);
  const html = fixture.read(writingDossier("html"));
  assert.ok(html.includes(`<pre class="terminal-command"><code><span>$ </span>${command}</code></pre>`));
  assert.ok(html.includes(`<pre data-terminal-output><code>${output}</code></pre>`));
  assert.ok(fixture.read(writingDossier("md")).includes(`\`\`\`\n$ ${command}\n${output}\n\`\`\``));
  assertNoEditorialPlaceholders(fixture.output);
});

test("the build still rejects editorial placeholders in a terminal caption", (t) => {
  const english = fixtureSource("writing-harness", "en").replace(/^    caption: .*$/m, "    caption: Pending");
  const { build, output } = buildCaseFixture(t, english);
  assert.equal(build.status, 1, build.stdout);
  assert.match(build.stderr, /terminal\.caption: Omit unverified facts rather than supplying placeholders/);
  assert.ok(!existsSync(join(output, writingDossier("html"))));
  assert.ok(!existsSync(join(output, writingDossier("md"))));
});

test("fenced heading-like lines survive in the dossier HTML and Markdown without adding sections", (t) => {
  const code = "````text\n```\n## Not a section\n````";
  const tildeCode = "~~~text\n## Also not a section\n~~~";
  const english = fixtureSource("writing-harness", "en").replace("\n## How it works\n", `\n${code}\n\n## How it works\n`)
    + `\n${tildeCode}\n`;
  const fixture = buildCaseFixture(t, english);
  assertBuilt(fixture);
  const html = fixture.read(writingDossier("html"));
  for (const [chapter, line] of [["problem", "## Not a section"], ["architecture", "## Also not a section"]]) {
    const section = html.match(new RegExp(`<section\\b[^>]*id="${chapter}"[^>]*>([\\s\\S]*?)</section>`))?.[1];
    assert.ok(section, chapter);
    const codeBlock = section.match(/<pre\b[^>]*>[\s\S]*?<\/pre>/)?.[0];
    assert.ok(codeBlock?.includes(line), line);
    assert.equal([...section.matchAll(/<h2\b/g)].length, 1, chapter);
  }
  const twin = fixture.read(writingDossier("md"));
  assert.ok(twin.includes(`\n${code}\n\n## Demonstration\n`));
  assert.ok(twin.includes(`\n${tildeCode}\n\n### Repositories\n`));
});

test("a single-locale case study stays unpublished and links to GitHub from both work indexes", (t) => {
  const slug = "doc-sentinel";
  const fixture = buildCaseFixture(t, undefined, { [`${slug}/en.md`]: caseSource(slug, "en") });
  assertBuilt(fixture);
  const xml = fixture.read("sitemap.xml");
  const { projects } = JSON.parse(fixture.read("projects.json"));
  const project = projects.find(({ id }) => id === slug);
  assert.ok(project, "the catalog still lists the project");
  assert.ok(!Object.hasOwn(project, "caseStudy"));
  for (const locale of locales) {
    const route = caseRoute(locale, slug);
    assert.ok(!xml.includes(`${site}${route}`), route);
    assert.ok(xml.includes(`<loc>${site}${caseRoute(locale, "writing-harness")}</loc>`));
    assert.ok(!projects.some(({ caseStudy }) => caseStudy === `${site}${route}`));
    const row = workRows(fixture.read(`${workRoutes[locale]}index.html`)).find(([, tag]) => attr(tag, "id") === slug);
    assert.ok(row, `${locale} work-index row`);
    const links = row[2].match(/<a\b[^>]*>/g);
    assert.equal(links?.length, 1);
    assert.equal(attr(links[0], "href"), repoUrl(slug));
    assert.equal(attr(links[0], "rel"), "external");
  }
  assertDossierInventory(fixture.output, ["writing-harness"]);
  // Unlike the old source-derived check, the production checker must fail if
  // this source tree is missing a dossier it was expected to publish.
  assert.throws(() => assertDossierInventory(fixture.output, [slug, "writing-harness"]), { message: /^en html/ });
});

test("the Markdown twin keeps both plain-text paragraphs inside their list item", (t) => {
  const english = fixtureSource("writing-harness", "en")
    .replace(/^        reason: .*$/m, "        reason: |-\n          First reason paragraph.\n\n          Second reason paragraph.")
    .replace(/^    consequence: .*$/m, "    consequence: |-\n      First consequence paragraph.\n\n      Second consequence paragraph.")
    .replace(/^    detail: .*$/m, "    detail: |-\n      First result paragraph.\n\n      Second result paragraph.")
    .replace(/(^limitations:\n)  - .*$/m, "$1  - |-\n    First limitation paragraph.\n\n    Second limitation paragraph.");
  const fixture = buildCaseFixture(t, english);
  assertBuilt(fixture);
  const twin = fixture.read(writingDossier("md"));
  for (const block of [
    "- **Repeat the base in each tone guide** (Not chosen): First reason paragraph.\n\n  Second reason paragraph.\n- **Give the layers explicit precedence**",
    "**Consequence:** First consequence paragraph.\n\nSecond consequence paragraph.\n\n**Evidence:**",
    "- **Core test run**: First result paragraph.\n\n  Second result paragraph.\n- [Coverage registry]",
    "- First limitation paragraph.\n\n  Second limitation paragraph.\n- The source corpus is not included",
  ]) assert.ok(twin.includes(block), block);
});

test("the Markdown twin serializes evidence destinations without raw spaces", (t) => {
  const url = "https://example.com/technical notes/café (v2).html?mode=quick test#section one";
  const english = fixtureSource("writing-harness", "en").replace(/^        url: .*$/m, `        url: ${JSON.stringify(url)}`);
  const fixture = buildCaseFixture(t, english);
  assertBuilt(fixture);
  const twin = fixture.read(writingDossier("md"));
  const destination = twin.match(/\[Precedence in the README\]\(([^)\s]+)\)/)?.[1];
  assert.equal(destination, "https://example.com/technical%20notes/caf%C3%A9%20%28v2%29.html?mode=quick%20test#section%20one");
});

function assertDiagramGeometry(html, locale, slug) {
  const context = `${locale} ${slug}`;
  const svgs = [...html.matchAll(/<svg\b[^>]*class="arch-diagram"[^>]*>[\s\S]*?<\/svg>/g)];
  const frames = [...html.matchAll(/(<div\b[^>]*class="arch-frame"[^>]*>)\s*<svg\b[^>]*class="arch-diagram"/g)];
  const dense = ["food-court", "enterprise-monitoring-stack"].includes(slug);
  const variants = dense ? ["wide"] : ["wide", "narrow"];
  assert.equal(svgs.length, variants.length, `${context}: dense diagrams must omit the narrow variant`);
  assert.deepEqual(frames.map(([, tag]) => [attr(tag, "role"), attr(tag, "tabindex"), attr(tag, "aria-label")]),
    svgs.map(([svg]) => ["region", "0", svg.match(/<title\b[^>]*>([^<]+)<\/title>/)[1]]), `${context}: diagram frames must be focusable and named`);
  assert.deepEqual(svgs.map(([svg]) => svg.match(/aria-labelledby="[^"]+-arch-(wide|narrow)-title"/)[1]), variants, context);
  for (const [i, [svg]] of svgs.entries()) {
    const labels = [...svg.matchAll(/<rect\b[^>]*class="arch-label-box\b[^>]*>/g)].map(([tag]) =>
      ["x", "y", "width", "height"].map((name) => Number(attr(tag, name))));
    assert.equal(labels.length, [...svg.matchAll(/marker-end="url\(/g)].length, `${context}: one inline box per flow`);
    const nodeGroups = [...svg.matchAll(/(<g\b[^>]*data-node-kind="(\w+)"[^>]*>)([\s\S]*?)<\/g>/g)];
    const boxes = nodeGroups.map(([, tag, kind, body]) => {
      const xy = attr(tag, "transform").match(/translate\(([-\d.]+) ([-\d.]+)\)/).slice(1).map(Number);
      if (kind === "store") {
        const [, width, bottom] = body.match(/S([\d.]+) 4 \1 10V([\d.]+)C/);
        return [...xy, Number(width), Number(bottom) + 10];
      }
      const panel = body.match(/<rect\b[^>]*class="arch-panel\b[^>]*>/)[0];
      return [...xy, Number(attr(panel, "width")), Number(attr(panel, "height"))];
    });
    assert.ok(boxes.length >= 2 && [...boxes, ...labels].every((rect) => rect.every(Number.isFinite)), context);
    const boundary = svg.match(/<rect\b[^>]*class="arch-boundary\b[^>]*>/)[0];
    const right = Number(attr(boundary, "x")) + Number(attr(boundary, "width"));
    const bottom = Number(attr(boundary, "y")) + Number(attr(boundary, "height"));
    const externals = boxes.filter((_, index) => nodeGroups[index][2] === "external");
    if (dense || (i === 0 && externals.length && externals.every(([x]) => x >= right))) {
      assert.ok([...boxes, ...labels].every(([, y, , h]) => y + h <= bottom + 1e-6), `${context}: side-by-side diagrams must end at the system boundary's bottom edge`);
    }
    for (const [x, y, w, h] of labels) for (const [nx, ny, nw, nh] of boxes) {
      assert.ok(x + w <= nx || nx + nw <= x || y + h <= ny || ny + nh <= y, `${context}: flow label intersects node`);
    }
    if (i === 0) {
      const ids = [...svg.matchAll(/<g\b[^>]*data-node-id="([^"]+)"/g)].map(([, id]) => id);
      const column = (id) => boxes[ids.indexOf(id)][0];
      const chains = {
        "food-court": [["frontend", "orders", "catalog", "catalog-db"], ["frontend", "orders", "traceability", "trace-db"], ["frontend", "orders", "identity", "user-db"], ["frontend", "orders", "orders-db"]],
        "studydeck-ai": [["frontend", "backend", "postgres"]],
        savia: [["web", "backend", "postgres"], ["web", "backend", "files"]],
      };
      for (const chain of chains[slug] ?? []) for (let j = 1; j < chain.length; j++) {
        assert.ok(column(chain[j - 1]) < column(chain[j]), `${context}: ${chain[j - 1]} → ${chain[j]} must advance left to right`);
      }
      if (slug === "savia") {
        for (const peer of ["mobile", "mcp"]) assert.equal(column(peer), column("web"), `${context}: ${peer} in first column`);
        for (const dependency of ["auth", "jwt-keys"]) assert.ok(column(dependency) > right, `${context}: ${dependency} right of the system boundary`);
      }
    }
  }
}

const architectureEvidence = "https://example.com/fixture/architecture";
const fixtureArchitecture = {
  system: "Fixture system", caption: "A fixture for the container diagram.",
  nodes: [
    { id: "checker", kind: "container", label: "CLI", name: "writing-harness", repo: "writing-harness", tech: "Node", does: "Checks writing", col: 0, row: 0 },
    { id: "rules", kind: "store", label: "Data store", name: "Rule files", does: "Stores rules", col: 1, row: 0 },
    { id: "runner", kind: "external", label: "External dependency", name: "Shell runner", does: "Runs checks", col: 0, row: 1 },
  ],
  edges: [
    { from: "checker", to: "rules", protocol: "Files", verb: "Reads guidelines", evidence: architectureEvidence },
    { from: "runner", to: "checker", verb: "Starts the CLI", evidence: architectureEvidence },
  ],
};
const withArchitecture = (locale, architecture = fixtureArchitecture) =>
  fixtureSource("writing-harness", locale).replace("---\n", `---\narchitecture: ${JSON.stringify(architecture)}\n`);
const archFixture = (t, english, spanish = fixtureArchitecture) =>
  buildCaseFixture(t, withArchitecture("en", english), { "writing-harness/es.md": withArchitecture("es", spanish) });

test("architecture renders accessible responsive SVGs with a store and an external outside the system", (t) => {
  const spanish = structuredClone(fixtureArchitecture);
  spanish.system = "Sistema de prueba";
  spanish.nodes[0].does = "Verifica textos";
  spanish.edges[0].verb = "Lee las guías";
  const terminal = (locale) => fixtureSource("writing-harness", locale).match(/^demonstration:\n(?:^[ \t][^\n]*\n)+/m)[0];
  const fallback = (locale) => fixtureSource("studydeck-ai", locale).replace(/^demonstration:\n(?:^[ \t][^\n]*\n)+/m, terminal(locale));
  const fixture = buildCaseFixture(t, withArchitecture("en"), {
    "writing-harness/es.md": withArchitecture("es", spanish),
    "studydeck-ai/en.md": fallback("en"), "studydeck-ai/es.md": fallback("es"),
  });
  assertBuilt(fixture);
  for (const locale of locales) {
    const html = fixture.read(`${caseRoute(locale, "writing-harness")}index.html`);
    const figure = html.match(/<figure class="case-arch"[^>]*>[\s\S]*?<\/figure>/)?.[0];
    assert.ok(figure);
    assert.ok(html.indexOf('class="case-repos"') > html.indexOf(figure));
    const svgs = [...figure.matchAll(/<svg\b[^>]*role="img"[^>]*>[\s\S]*?<\/svg>/g)];
    assert.equal(svgs.length, 2);
    const data = locale === "en" ? fixtureArchitecture : spanish;
    for (const [svg] of svgs) {
      assert.match(svg, /aria-labelledby="([^"]+)"[\s\S]*<title id="\1">[^<]+<\/title>/);
      const desc = svg.match(/aria-describedby="([^"]+)"[\s\S]*<desc id="\1">([^<]+)<\/desc>/)?.[2];
      assert.ok(desc);
      for (const { name, does } of data.nodes) assert.ok(desc.includes(name) && desc.includes(does));
      for (const { from, to, protocol, verb } of data.edges) {
        const name = (id) => data.nodes.find((node) => node.id === id).name;
        assert.ok(desc.split("\n").some((line) => line.includes(`${name(from)} → ${name(to)}`) && line.includes(verb) && (!protocol || line.includes(protocol))));
      }
      const boundary = svg.match(/<rect\b[^>]*class="arch-boundary[^>]*>/)?.[0];
      const store = svg.match(/<g\b[^>]*data-node-kind="store"[^>]*>[\s\S]*?<\/g>/)?.[0];
      const external = svg.match(/<g\b[^>]*data-node-kind="external"[^>]*>/)?.[0];
      assert.ok(boundary && store && external);
      assert.match(store, /<path\b[^>]*d="M[^\"]*C/);
      const [, x, y] = attr(external, "transform").match(/translate\(([-\d.]+) ([-\d.]+)\)/).map(Number);
      assert.ok(x > Number(attr(boundary, "x")) + Number(attr(boundary, "width")) || y > Number(attr(boundary, "y")) + Number(attr(boundary, "height")));
      assert.match(svg, /stroke-dasharray="4 4"/);
      assert.match(svg, /marker-end="url\(#[^)]+\)"/);
    }
    assert.ok(!figure.includes(architectureEvidence));
    assert.match(figure, /<figcaption class="case-caption">A fixture for the container diagram\.<\/figcaption>/);
    const fallbackHtml = fixture.read(`${caseRoute(locale, "studydeck-ai")}index.html`);
    const fallbackMap = fallbackHtml.match(/<figure class="case-repo-map">[\s\S]*?<\/figure>/)?.[0];
    assert.ok(fallbackMap);
    assert.match(fallbackMap, /class="repo-map-labeled"/);
    const graphic = fallbackMap.match(/<[^>]*\srole="img"[^>]*>/)?.[0];
    assert.ok(graphic);
    const connects = locale === "en" ? "connects to" : "se conecta con";
    assert.equal(attr(graphic, "aria-label"), `API: studydeck-backend; Web: studydeck-frontend. studydeck-backend ${connects} studydeck-frontend.`);
    assert.doesNotMatch(fallbackHtml, /class="case-arch"/);
  }
  const twin = fixture.read(writingDossier("md"));
  assert.match(twin, /### Architecture\n\n- writing-harness \(CLI, Node\): Checks writing\n- Rule files \(Data store\): Stores rules\n- Shell runner \(External dependency\): Runs checks\n- writing-harness → Rule files \(Files\): Reads guidelines\n- Shell runner → writing-harness: Starts the CLI/);
  assert.ok(fixture.read("llms-full.txt").includes(twin.trimEnd()));
  assert.ok(!twin.includes(architectureEvidence));
});

const extraFixtureNodes = (count) => Array.from({ length: count }, (_, i) => ({
  id: `store-${i}`, kind: "store", label: "Data store", name: `Store ${i}`, does: "Stores input", col: i % 2 + 2, row: Math.floor(i / 2),
}));

test("a four-column architecture supports ten nodes", (t) => {
  const data = structuredClone(fixtureArchitecture);
  data.nodes.push(...extraFixtureNodes(7));
  const fixture = archFixture(t, data, data);
  assertBuilt(fixture);
  assert.equal([...fixture.read(writingDossier("html")).matchAll(/data-node-kind=/g)].length, 20);
});

for (const [name, change, message] of [
  ["unknown edge endpoint", (data) => { data.edges[0].to = "missing"; }, /architecture\.edges\.0\.to: Unknown architecture node: missing/],
  ["missing repository container", (data) => { delete data.nodes[0].repo; }, /architecture\.nodes: Missing architecture container for repository: writing-harness/],
  ["unknown repository", (data) => { data.nodes[0].repo = "different-repo"; }, /architecture\.nodes\.0\.repo: Unknown project repository: different-repo/],
  ["duplicate node id", (data) => { data.nodes[1].id = "checker"; }, /architecture\.nodes\.1\.id: Duplicate architecture node id: checker/],
  ["eleven nodes", (data) => { data.nodes.push(...extraFixtureNodes(8)); }, /architecture\.nodes: .*<=10/i],
]) {
  test(`the build rejects architecture with ${name}`, (t) => {
    const data = structuredClone(fixtureArchitecture);
    change(data);
    const { build, output } = archFixture(t, data);
    assert.equal(build.status, 1, build.stdout);
    assert.match(build.stderr, message);
    for (const extension of ["html", "md"]) assert.ok(!existsSync(join(output, writingDossier(extension))));
  });
}

test("paired architecture rejects structural drift between locales", (t) => {
  const spanish = structuredClone(fixtureArchitecture);
  spanish.nodes[1].col = 2;
  const { build, output } = archFixture(t, fixtureArchitecture, spanish);
  assert.equal(build.status, 1, build.stdout);
  assert.match(build.stderr, /writing-harness: architecture must agree across locales/);
  for (const extension of ["html", "md"]) assert.ok(!existsSync(join(output, writingDossier(extension))));
});

test("case-study stack groups are localized and cover exactly the flat stack inventory", () => {
  const layerLabels = {
    en: { frontend: "Frontend", backend: "Backend", data: "Data", tooling: "Tooling", infra: "Infrastructure" },
    es: { frontend: "Frontend", backend: "Backend", data: "Datos", tooling: "Herramientas", infra: "Infraestructura" },
  };
  for (const locale of locales) for (const slug of publishedSlugs) {
    const folder = caseRoute(locale, slug).slice(1);
    const html = read(`${folder}index.html`);
    const fact = html.match(/<div data-case-fact="stack">[\s\S]*?<\/dl>/)?.[0];
    const flat = read(`${folder}index.md`).match(/^-(?: Stack| Tecnologías): (.+)$/m)?.[1].split(", ");
    assert.ok(fact && flat, slug);
    const groups = [...fact.matchAll(/<div data-stack-layer="([^"]+)"><dt>([^<]+)<\/dt>/g)];
    assert.ok(groups.length, slug);
    for (const [, layer, label] of groups) assert.equal(label, layerLabels[locale][layer]);
    const technologies = [...fact.matchAll(/<li class="fact-tech">([^<]+)<\/li>/g)].map(([, tech]) => tech);
    assert.deepEqual(technologies.sort(), flat.sort(), `${locale} ${slug}`);
  }
});

for (const slug of publishedSlugs) {
  for (const locale of locales) {
    const path = caseRoute(locale, slug);
    const other = locale === "en" ? "es" : "en";
    test(`${locale} ${slug}: localized dossier, adaptive facts, decisions and evidence`, () => {
      const source = caseSource(slug, locale);
      const html = read(`${path.slice(1)}index.html`);
      assert.match(html, new RegExp(`<html lang="${locale}"`));
      assert.ok(html.includes(`<link rel="canonical" href="${site}${path}"`));
      assert.ok(html.includes(`<meta property="og:url" content="${site}${path}"`));
      assert.match(html, /<meta name="description" content="[^"]+"/);
      assert.match(html, /<title>[^<]+ \| diegnghtmr<\/title>/);
      assert.ok(resolves(html.match(/<meta property="og:image" content="([^"]+)"/)[1]));
      for (const lang of [...locales, "x-default"]) {
        const alternate = caseRoute(lang === "x-default" ? "en" : lang, slug);
        assert.ok(html.includes(`<link rel="alternate" hreflang="${lang}" href="${site}${alternate}"`), lang);
      }
      const header = html.match(/<header\b[^>]*data-site-nav[^>]*>[\s\S]*?<\/header>/)[0];
      assert.match(header, new RegExp(`data-search-trigger[\\s\\S]*href="${caseRoute(other, slug)}"[\\s\\S]*data-theme-toggle`));
      assert.ok(header.includes(`href="${workRoutes[locale]}"`));
      assert.match(header, /aria-current="page"/);
      for (const field of ["role", "timeframe", "team", "demo"]) {
        assert.equal(html.includes(`data-case-fact="${field}"`), new RegExp(`^${field}:`, "m").test(source), field);
      }
      const records = [...html.matchAll(/<article\b[^>]*data-decision[^>]*>([\s\S]*?)<\/article>/g)];
      assert.equal(records.length, [...source.matchAll(/^  - question:/gm)].length);
      for (const [, record] of records) assert.equal([...record.matchAll(/\sdata-chosen\b/g)].length, 1);
      const rail = html.match(/<nav\b[^>]*data-case-contents[^>]*>[\s\S]*?<\/nav>/)[0];
      for (const section of ["problem", "demonstration", "architecture", "decisions", "results", "limitations"]) {
        const present = !["results", "limitations"].includes(section) || new RegExp(`^${section}:`, "m").test(source);
        assert.equal(rail.includes(`href="#${section}"`), present, section);
        assert.equal(html.includes(`id="${section}"`), present, section);
      }
      if (source.includes("kind: screenshots")) {
        const images = [...html.matchAll(/<picture>[\s\S]*?<\/picture>/g)];
        assert.equal(images.length, [...source.matchAll(/^    - src:/gm)].length);
        for (const [picture] of images) {
          assert.match(picture, /type="image\/avif"/);
          assert.match(picture, /<img[^>]*\bsrc="[^"\s]+\.webp"/);
          assert.match(picture, /<img[^>]*\bsizes="[^"]+"/);
          assert.match(picture, /<img[^>]*\bwidth="\d+"/);
          assert.match(picture, /<img[^>]*\bheight="\d+"/);
        }
      } else {
        assert.match(html, /<pre\b[^>]*data-terminal-output/);
        assert.match(html, /data-terminal-source/);
      }
    });

    test(`${locale} ${slug}: catalog links, Markdown twin, sitemap and structured data agree`, () => {
      const source = caseSource(slug, locale);
      const html = read(`${path.slice(1)}index.html`);
      const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])["@graph"];
      const byType = (type) => graph.find((node) => node["@type"] === type);
      const project = JSON.parse(read("projects.json")).projects.find(({ caseStudy }) => caseStudy === `${site}${caseRoute("en", slug)}`);
      assert.ok(project, slug);
      const creative = byType("CreativeWork");
      assert.equal(creative.url, `${site}${path}`);
      assert.equal(creative.name, project.name);
      assert.equal(creative.author["@id"], byType("Person")["@id"]);
      assert.deepEqual(graph.filter((node) => node["@type"] === "SoftwareSourceCode").map(({ codeRepository }) => codeRepository), project.repositories.map(({ url }) => url));
      assert.deepEqual(byType("BreadcrumbList").itemListElement.map(({ item }) => item), [`${site}/${locale}/`, `${site}${workRoutes[locale]}`, `${site}${path}`]);
      assert.ok(html.includes(`<link rel="alternate" type="text/markdown" href="${path}index.md"`));
      const twin = read(`${path.slice(1)}index.md`);
      assert.ok(twin.startsWith(`# ${project.name}\n`));
      for (const question of source.matchAll(/^  - question: (.+)$/gm)) {
        if (!/^[|>'"]/.test(question[1])) assert.ok(twin.includes(question[1]), question[1]);
      }
      assert.ok(read(locale === "en" ? "llms-full.txt" : "es/llms-full.txt").includes(twin.trimEnd()));
      assert.ok(read("llms.txt").includes(`](${site}${path}index.md)`));
      const xml = read("sitemap.xml").split("</url>").find((node) => node.includes(`<loc>${site}${path}</loc>`));
      assert.ok(xml, path);
      for (const lang of [...locales, "x-default"]) {
        const alternate = caseRoute(lang === "x-default" ? "en" : lang, slug);
        assert.ok(xml.includes(`hreflang="${lang}" href="${site}${alternate}"`), lang);
      }
      const cardId = featuredIds[projectNames.indexOf(project.name)];
      if (cardId) {
        const home = read(`${locale}/index.html`);
        assert.match(home, new RegExp(`<li class="card" id="${cardId}"[^>]*>\\s*<a href="${path}"`));
      }
      const work = read(`${workRoutes[locale].slice(1)}index.html`);
      const row = workRows(work).find(([, tag]) => attr(tag, "id") === slug);
      assert.ok(row?.[2].includes(`href="${path}"`));
    });
  }
}

test("writing-harness is indexed under TypeScript without adding absent demo and team facts", () => {
  const html = read("en/work/index.html");
  const row = workRows(html).find(([, tag]) => attr(tag, "id") === "writing-harness");
  assert.ok(attr(row[1], "data-stack").split(" ").includes("typescript"));
  for (const locale of locales) assert.doesNotMatch(read(`${caseRoute(locale, "writing-harness").slice(1)}index.html`), /data-case-fact="(?:demo|team)"/);
});

function assertNoEditorialPlaceholders(output) {
  for (const file of readdirSync(output, { recursive: true }).filter((file) => /\.(?:html|md|txt|json)$/.test(file))) {
    let content = readFileSync(join(output, file), "utf8");
    if (file.endsWith(".html")) {
      content = content.replace(/<pre\b[^>]*(?:class="terminal-command"|data-terminal-output)[^>]*>[\s\S]*?<\/pre>/g, "");
    } else if (/\.(?:md|txt)$/.test(file)) {
      content = content.replace(/^(`{3,})\n\$ [\s\S]*?^\1$/gm, "");
    }
    assert.doesNotMatch(content, /\b(?:to confirm|TBD|por confirmar)\b/i, file);
  }
}

test("published pages and agent outputs do not expose editorial placeholders", () => {
  assertNoEditorialPlaceholders(dist);
});

test("S23: ranking does not reassign home JSON-LD identities", () => {
  const stable = { Legajo: "p4", "StudyDeck AI": "p1", "Academic Triage": "p7", Brújula: "p3", "Food Court": "p2", "Profundiza UQ": "p5" };
  for (const locale of locales) {
    const page = `${site}/${locale}/`;
    const html = read(`${locale}/index.html`);
    const { "@graph": graph } = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const items = graph.find((node) => node["@type"] === "ItemList").itemListElement;
    assert.deepEqual(items.map(({ position, item }) => [position, item.name, item["@id"]]),
      projectNames.map((name, i) => [i + 1, name, `${page}#${stable[name]}`]));
  }
});

test("S23: localized dossiers link to the next project in ranking order and wrap", () => {
  const order = ["legajo", "studydeck-ai", "academic-triage", "brujula", "food-court", "profundiza-uq",
    "doc-sentinel", "nexride", "savia", "writing-harness", "vale", "saber-inverso", "resume-maker", "enterprise-monitoring-stack"];
  for (const locale of locales) {
    for (const [i, slug] of order.entries()) {
      const html = read(`${caseRoute(locale, slug).slice(1)}index.html`);
      assert.equal(html.match(/<a class="case-next" href="([^"]+)"/)?.[1], caseRoute(locale, order[(i + 1) % order.length]), `${locale} ${slug}`);
    }
  }
});
