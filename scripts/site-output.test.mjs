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
  [["api", "web"], [["studydeck-backend", "api", "Java"], ["studydeck-frontend", "web"]], ["Java 25", "pgvector", "React 19"], repoUrl("studydeck-backend")],
  [["4 api", "web"], [["food-court-ui", "web"], ...foodServices.map((name) => [name, "api", "Java"])], ["Spring Boot", "React"], repoSearch("food-court")],
  [["api", "web"], [["brujula-backend", "api", "Java"], ["brujula-frontend", "web"]], ["Spring Modulith", "Keycloak"], repoSearch("brujula")],
  [["api", "web"], [["legajo-backend", "api", "Java"], ["legajo-frontend", "web", "TypeScript"]], ["Java 25", "React 19"], repoUrl("legajo-frontend"), true],
  [["api", "web"], [["profundiza-uq-backend", "api", "Go"], ["profundiza-uq-frontend", "web"]], ["Go", "pgx", "React 19"], repoUrl("profundiza-uq-backend")],
  [["cli"], [["writing-harness", "cli", "JavaScript"]], ["Node", "zero deps"], repoUrl("writing-harness")],
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
    assert.ok(Array.isArray(project.stack), project.name);
    assert.equal(project.stack.length === 0, ["doc-sentinel", "NexRide"].includes(project.name), project.name);
  }
});

test("projects.json adds repository roles without changing the original six entries", () => {
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
  assert.deepEqual(projects.slice(0, 6).map(({ repositories, ...project }) => ({
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
      assert.match(links[0][1], /^https:\/\/github\.com\/diegnghtmr\/[\w-]+$/);
      assert.match(links[0][0], /rel="external"/);
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
    assert.deepEqual(Object.fromEntries([...byName].map(([name, row]) => [name, attr(row.match(/<a\b[^>]*>/)[0], "href")])), {
      "StudyDeck AI": repoUrl("studydeck-backend"), "Food Court": repoUrl("food-court-ui"), Brújula: repoUrl("brujula-backend"),
      Legajo: repoUrl("legajo-frontend"), "Profundiza UQ": repoUrl("profundiza-uq-backend"), Savia: repoUrl("savia-web"),
      "Academic Triage": repoUrl("academic-triage-frontend"), Vale: repoUrl("vale"), "Saber Inverso": repoUrl("saber-inverso"),
      NexRide: repoUrl("NexRide"), "writing-harness": repoUrl("writing-harness"), "doc-sentinel": repoUrl("doc-sentinel"),
      "resume-maker": repoUrl("resume-maker"), "Enterprise Monitoring Stack": repoUrl("enterprise-monitoring-stack"),
    });
    const edgesFor = (name) => {
      const row = byName.get(name);
      const nodes = new Map([...row.matchAll(/<circle\b[^>]*>/g)].map(([tag]) => [`${attr(tag, "cx")} ${attr(tag, "cy")}`, attr(tag, "data-repository")]));
      return [...row.matchAll(/<path\b[^>]*\sd="M(\d+ \d+) Q[\d.]+ [\d.]+ (\d+ \d+)"/g)]
        .map(([, from, to]) => [nodes.get(from), nodes.get(to)]);
    };
    assert.deepEqual(edgesFor("Food Court"), foodServices.map((name) => ["food-court-ui", name]));
    assert.deepEqual(edgesFor("Savia"), [["savia-web", "savia-backend"], ["savia-mobile", "savia-backend"], ["savia-backend", "savia-mcp"]]);
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
    assert.equal(labelFor("Savia"), `Web: savia-web; ${mobile}: savia-mobile; API: savia-backend; MCP: savia-mcp. savia-web ${connects} savia-backend; savia-mobile ${connects} savia-backend; savia-backend ${connects} savia-mcp.`);
    assert.equal(labelFor("Saber Inverso"), "Web: saber-inverso");
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
