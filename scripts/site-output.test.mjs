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
const projectNames = ["StudyDeck AI", "Food Court", "Brújula", "Legajo", "Profundiza UQ", "writing-harness"];
const atlasNames = [...projectNames, "Savia", "Academic Triage", "Vale", "Saber Inverso", "doc-sentinel", "resume-maker", "Enterprise Monitoring Stack", "NexRide"];
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
const featuredDescriptions = [
  ["Spaced-repetition flashcards with AI card generation, document RAG and an MCP server.", "Tarjetas de repaso espaciado con generación por IA, RAG sobre documentos y un servidor MCP."],
  ["Ordering platform split into identity, menu, order and traceability services plus a role-based UI.", "Plataforma de pedidos dividida en servicios de identidad, menú, pedidos y trazabilidad, más una interfaz por roles."],
  ["Academic planning for Universidad del Quindío: curriculum graph, degree progress and semester simulation.", "Planeación académica para la Universidad del Quindío: grafo curricular, avance de carrera y simulación de semestres."],
  ["Text similarity and hierarchical clustering over scientific abstracts, with traces and dendrograms.", "Similitud de textos y agrupamiento jerárquico sobre resúmenes científicos, con trazas y dendrogramas."],
  ["Elective enrollment with server-generated arrival order and per-group capacity under row-level locking.", "Inscripción a electivas con orden de llegada generado en el servidor y cupos por grupo bajo bloqueo de filas."],
  ["Spanish writing skills plus a verifier that measures whether a text follows them. Runs on Node 22.6 with nothing installed.", "Skills de redacción en español y un verificador que mide si un texto las cumple. Corre en Node 22.6 sin instalar nada."],
];
const foodServices = ["user-microservice", "food-court-microservice", "order-microservice", "traceability-microservice"];
const featuredContracts = [
  [["api", "web"], [["studydeck-backend", "api", "Java"], ["studydeck-frontend", "web", "TypeScript"]], ["Java 25", "pgvector", "React 19"], repoUrl("studydeck-backend")],
  [["4 api", "web"], [["food-court-ui", "web"], ...foodServices.map((name) => [name, "api", "Java"])], ["Spring Boot", "React"], repoSearch("food-court")],
  [["api", "web"], [["brujula-backend", "api", "Java"], ["brujula-frontend", "web", "TypeScript"]], ["Spring Modulith", "Keycloak"], repoSearch("brujula")],
  [["api", "web"], [["legajo-backend", "api", "Java"], ["legajo-frontend", "web", "TypeScript"]], ["Java 25", "React 19"], repoUrl("legajo-frontend"), true],
  [["api", "web"], [["profundiza-uq-backend", "api", "Go"], ["profundiza-uq-frontend", "web", "TypeScript"]], ["Go", "pgx", "React 19"], repoUrl("profundiza-uq-backend")],
  [["cli"], [["writing-harness", "cli", "TypeScript"]], ["Node", "zero deps"], repoUrl("writing-harness")],
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
    assert.ok(Array.isArray(project.stack) && project.stack.length > 0, project.name);
  }
  const docSentinel = projects.find(({ name }) => name === "doc-sentinel");
  assert.deepEqual(docSentinel.stack, ["Python"]);
  assert.equal(docSentinel.repositories[0].programmingLanguage, "Python");
  const nexRide = projects.find(({ name }) => name === "NexRide");
  assert.deepEqual(nexRide.stack, ["TypeScript", "NestJS 11", "PostgreSQL/PostGIS", "Redis"]);
  assert.equal(nexRide.repositories[0].programmingLanguage, "TypeScript");
});

test("projects.json preserves the original six entries with additive repository metadata", () => {
  const { projects } = JSON.parse(read("projects.json"));
  const specializedRoles = new Map([
    ...foodServices.map((name, index) => [name, ["identity", "menu", "orders", "traceability"][index]]),
    ["savia-mobile", "mobile"], ["savia-mcp", "mcp"], ["resume-maker", "pipeline"],
  ]);
  for (const project of projects) {
    for (const { name, surface, role } of project.repositories) {
      assert.equal(role, specializedRoles.get(name) ?? surface, name);
    }
  }
  assert.deepEqual(projects.slice(0, 6).map(({ repositories, caseStudy, ...project }) => ({
    ...project, repositories: repositories.map(({ role, ...repository }) => repository),
  })), featuredContracts.map(([categories, repos, stack, url, live = false], index) => {
    const [en, es] = featuredDescriptions[index];
    const [enKind, esKind] = index === 5 ? ["Headless, 1 repo", "Sin interfaz, 1 repo"]
      : [`System, ${repos.length} repos`, `Sistema, ${repos.length} repos`];
    return {
      id: `p${index + 1}`, name: projectNames[index], description: { en, es }, kind: { en: enKind, es: esKind }, categories,
      repositories: repos.map(([name, surface, programmingLanguage]) => ({ name, surface, url: repoUrl(name), ...(programmingLanguage ? { programmingLanguage } : {}) })),
      stack, url, live,
    };
  }));
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

  test(`${locale}: the work command menu searches all project names and stacks and targets their rows`, () => {
    const html = read(`${path.slice(1)}index.html`);
    const options = commandProjects(html);
    assert.equal(options.length, 14);
    assert.deepEqual(new Set(options.map(({ name }) => name)), new Set(atlasNames));
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

  test(`${locale}: Includes surface counts repositories, without moving Savia out of the web group`, () => {
    const html = read(`${path.slice(1)}index.html`);
    const rows = workRows(html);
    const savia = rows.find(([, , body]) => /<h3\b[^>]*>Savia<\/h3>/.test(body));
    assert.ok(savia);
    assert.equal(attr(savia[1], "data-surface"), "web api tool");
    const webGroup = html.match(/<section\b[^>]*data-group="web"[^>]*>[\s\S]*?<\/section>/)?.[0];
    assert.ok(webGroup?.includes(savia[0]));
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
    assert.deepEqual(commandProjects(home), projectNames.map((name, i) => ({ name, target: `#p${i + 1}`, stack: undefined })));
    for (let i = 1; i <= 6; i++) assert.ok(new RegExp(`<li class="card" id="p${i}"`).test(home), `home card p${i}`);
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

function buildCaseFixture(t, english = caseSource("writing-harness", "en"), extra = {}) {
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
    "writing-harness/es.md": caseSource("writing-harness", "es"),
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
  const english = caseSource("writing-harness", "en")
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
  const english = caseSource("writing-harness", "en").replace(/^    caption: .*$/m, "    caption: Pending");
  const { build, output } = buildCaseFixture(t, english);
  assert.equal(build.status, 1, build.stdout);
  assert.match(build.stderr, /terminal\.caption: Omit unverified facts rather than supplying placeholders/);
  assert.ok(!existsSync(join(output, writingDossier("html"))));
  assert.ok(!existsSync(join(output, writingDossier("md"))));
});

test("fenced heading-like lines survive in the dossier HTML and Markdown without adding sections", (t) => {
  const code = "````text\n```\n## Not a section\n````";
  const tildeCode = "~~~text\n## Also not a section\n~~~";
  const english = caseSource("writing-harness", "en").replace("\n## How it works\n", `\n${code}\n\n## How it works\n`)
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
  const english = caseSource("writing-harness", "en")
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
  const english = caseSource("writing-harness", "en").replace(/^        url: .*$/m, `        url: ${JSON.stringify(url)}`);
  const fixture = buildCaseFixture(t, english);
  assertBuilt(fixture);
  const twin = fixture.read(writingDossier("md"));
  const destination = twin.match(/\[Precedence in the README\]\(([^)\s]+)\)/)?.[1];
  assert.equal(destination, "https://example.com/technical%20notes/caf%C3%A9%20%28v2%29.html?mode=quick%20test#section%20one");
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
      if (project.id.startsWith("p")) {
        const home = read(`${locale}/index.html`);
        assert.match(home, new RegExp(`<li class="card" id="${project.id}"[^>]*>\\s*<a href="${path}"`));
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
