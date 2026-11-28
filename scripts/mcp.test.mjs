import assert from "node:assert/strict";
import { execFile, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { after, before, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import mcp from "../api/mcp.mjs";

const protocol = "2025-11-25";
const accept = "application/json, text/event-stream";
const locales = ["en", "es"];
const dist = (path) => readFileSync(new URL(`../dist/${path}`, import.meta.url), "utf8");
const feed = () => JSON.parse(dist("projects.json")).projects;
const workPath = (locale) => locale === "en" ? "en/work/" : "es/trabajo/";
let server;
let endpoint;
let id = 0;

async function startServer(handler, { redirectSlash = false } = {}) {
  const listener = createServer(async (req, res) => {
    if (req.url === "/mcp/" && redirectSlash) return res.writeHead(308, { location: "/mcp" }).end();
    if (req.url !== "/mcp" && req.url !== "/mcp/") return res.writeHead(404).end();
    const init = { method: req.method, headers: req.headers };
    if (req.method === "POST") Object.assign(init, { body: Readable.toWeb(req), duplex: "half" });
    try {
      const response = await handler.fetch(new Request(new URL(req.url, url), init));
      const body = response.body ? Buffer.from(await response.arrayBuffer()) : undefined;
      res.writeHead(response.status, Object.fromEntries(response.headers)).end(body);
    } catch (error) {
      res.writeHead(500).end(String(error));
    }
  });
  await new Promise((resolve, reject) => listener.listen(0, "127.0.0.1", resolve).once("error", reject));
  const url = new URL(`http://127.0.0.1:${listener.address().port}/mcp`);
  return { server: listener, endpoint: url };
}
const stopServer = (listener) => new Promise((resolve, reject) =>
  listener.close((error) => error ? reject(error) : resolve()));

before(async () => {
  ({ server, endpoint } = await startServer(mcp));
});
after(async () => {
  if (server) await stopServer(server);
});

function post(body, headers = {}, target = endpoint) {
  return fetch(target, {
    method: "POST",
    headers: { accept, "content-type": "application/json", "mcp-protocol-version": protocol, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function rpc(method, params, target) {
  const requestId = ++id;
  const response = await post({ jsonrpc: "2.0", id: requestId, method, ...(params === undefined ? {} : { params }) }, {}, target);
  assert.equal(response.status, 200, method);
  assert.match(response.headers.get("content-type"), /^application\/json\b/);
  assert.equal(response.headers.get("mcp-session-id"), null);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.text();
  assert.ok(Buffer.byteLength(body) <= 64 * 1024, `response exceeds 64 KiB: ${method}`);
  const message = JSON.parse(body);
  assert.equal(message.jsonrpc, "2.0");
  assert.equal(message.id, requestId);
  assert.equal(message.error, undefined);
  return message.result;
}
const call = (name, args, target) => rpc("tools/call", { name, ...(args === undefined ? {} : { arguments: args }) }, target);
async function data(name, args, target) {
  const result = await call(name, args, target);
  assert.notEqual(result.isError, true, JSON.stringify(result.content));
  assert.equal(result.content.length, 1);
  assert.equal(result.content[0].type, "text");
  return JSON.parse(result.content[0].text);
}

const initialize = {
  protocolVersion: protocol,
  capabilities: {},
  clientInfo: { name: "portfolio-http-test", version: "1.0.0" },
};

test("initialize negotiates the handshake revision; initialized notification and ping need no session", async () => {
  const result = await rpc("initialize", initialize);
  assert.equal(result.protocolVersion, protocol);
  assert.equal(result.serverInfo.name, "portfolio-me");
  assert.deepEqual(Object.keys(result.capabilities), ["tools"]);
  const notification = await post({ jsonrpc: "2.0", method: "notifications/initialized" });
  assert.equal(notification.status, 202);
  assert.equal(notification.headers.get("mcp-session-id"), null);
  assert.equal(await notification.text(), "");
  assert.deepEqual(await rpc("ping"), {});
});

test("GET and DELETE return 405 with no SSE or session termination", async () => {
  for (const method of ["GET", "DELETE"]) {
    const response = await fetch(endpoint, { method, headers: { accept: "text/event-stream" }, redirect: "manual" });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "POST");
    assert.equal(await response.text(), "");
  }
});

test("the 405 answer names the deployed commit only when Vercel provides it", async (t) => {
  const previous = process.env.VERCEL_GIT_COMMIT_SHA;
  t.after(() => (previous === undefined ? delete process.env.VERCEL_GIT_COMMIT_SHA : (process.env.VERCEL_GIT_COMMIT_SHA = previous)));
  delete process.env.VERCEL_GIT_COMMIT_SHA;
  const local = await fetch(endpoint, { method: "HEAD", redirect: "manual" });
  assert.equal(local.status, 405);
  assert.equal(local.headers.get("x-build-sha"), null);
  process.env.VERCEL_GIT_COMMIT_SHA = "0123456789abcdef0123456789abcdef01234567";
  const deployed = await fetch(endpoint, { method: "HEAD", redirect: "manual" });
  assert.equal(deployed.status, 405);
  assert.equal(deployed.headers.get("x-build-sha"), "0123456789abcdef0123456789abcdef01234567");
});

test("POST rejects an unsupported revision and malformed JSON; Origin and input size are checked", async () => {
  const ping = { jsonrpc: "2.0", id: 1, method: "ping" };
  for (const [body, headers, status, code] of [
    [ping, { "mcp-protocol-version": "unknown" }, 400, -32000],
    ["{", {}, 400, -32700],
    [ping, { origin: "https://example.invalid" }, 403, -32000],
    [" ".repeat(17 * 1024), {}, 413, -32000],
  ]) {
    const response = await post(body, headers);
    assert.equal(response.status, status);
    const message = await response.json();
    assert.equal(message.jsonrpc, "2.0");
    assert.equal(message.error.code, code);
    assert.equal(message.result, undefined);
  }
  assert.deepEqual(await rpc("ping"), {});
});

test("rejects both small and over-budget legacy tool batches rather than accepting calls within a batch", async () => {
  const legacy = { "mcp-protocol-version": "2025-03-26" };
  const before = await data("list_projects");
  for (const size of [1, 10]) {
    const calls = Array.from({ length: size }, (_item, index) => ({
      jsonrpc: "2.0", id: index + 1, method: "tools/call", params: { name: "list_projects" },
    }));
    const response = await post(calls, legacy);
    assert.equal(response.status, 400, `batch with ${size} call(s)`);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), {
      jsonrpc: "2.0", id: null, error: { code: -32600, message: "JSON-RPC batches are not supported" },
    });
  }
  const response = await post({ jsonrpc: "2.0", id: 1, method: "ping" }, legacy);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { jsonrpc: "2.0", id: 1, result: {} });
  assert.deepEqual(await data("list_projects"), before);
});

test("tools/list describes four read-only tools with closed object schemas and localized inputs", async () => {
  const { tools } = await rpc("tools/list");
  const expected = {
    get_profile: { params: [], required: [] },
    list_projects: { params: ["kind", "stack"], required: [] },
    get_project: { params: ["slug"], required: ["slug"] },
    search: { params: ["limit", "query"], required: ["query"] },
  };
  assert.deepEqual(tools.map(({ name }) => name).sort(), Object.keys(expected).sort());
  for (const { name, description, inputSchema, annotations } of tools) {
    assert.ok(description);
    assert.equal(annotations.readOnlyHint, true);
    assert.equal(inputSchema.type, "object");
    assert.equal(inputSchema.additionalProperties, false);
    assert.deepEqual(Object.keys(inputSchema.properties).sort(), ["locale", ...expected[name].params].sort());
    assert.deepEqual(inputSchema.properties.locale.enum, locales);
    assert.equal(inputSchema.properties.locale.default, "en");
    assert.deepEqual(inputSchema.required ?? [], expected[name].required);
  }
  const search = tools.find(({ name }) => name === "search").inputSchema.properties;
  assert.equal(search.limit.minimum, 1);
  assert.equal(search.limit.maximum, 10);
  assert.equal(search.limit.default, 5);
});

for (const locale of locales) {
  test(`${locale}: get_profile matches the built public résumé`, async () => {
    const resume = JSON.parse(dist(locale === "en" ? "resume.json" : "es/resume.json"));
    assert.deepEqual(await data("get_profile", { locale }), resume);
    if (locale === "en") assert.deepEqual(await data("get_profile"), resume);
  });

  test(`${locale}: list_projects matches the built project feed and filters by kind and stack`, async () => {
    const { projects } = await data("list_projects", { locale });
    assert.equal(projects.length, feed().length);
    assert.equal(new Set(projects.map(({ slug }) => slug)).size, projects.length);
    for (const [index, actual] of projects.entries()) {
      const { caseStudy, description, kind, ...project } = feed()[index];
      assert.match(actual.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      const slug = caseStudy ? new URL(caseStudy).pathname.split("/").at(-2) : actual.slug;
      assert.deepEqual(actual, {
        ...project, slug, description: description[locale], kind: kind[locale],
        ...(caseStudy ? { caseStudy: `https://diegnghtmr.me/${workPath(locale)}${slug}/` } : {}),
      });
    }
    assert.deepEqual((await data("list_projects", { locale, kind: "api", stack: "jAvA" })).projects,
      projects.filter(({ repositories, stack }) => repositories.some(({ surface }) => surface === "api") &&
        stack.some((name) => name.toLowerCase().includes("java"))));
    assert.deepEqual(await data("list_projects", { locale, stack: "no-such-stack" }), { projects: [] });
  });

  test(`${locale}: get_project includes the exact public Markdown twin for every published study`, async () => {
    const { projects } = await data("list_projects", { locale });
    for (const project of projects) {
      assert.deepEqual(await data("get_project", { locale, slug: project.slug }), {
        ...project,
        ...(project.caseStudy ? { markdown: dist(`${workPath(locale)}${project.slug}/index.md`) } : {}),
      });
    }
  });

  test(`${locale}: search returns localized project records without scores and honors the limit`, async () => {
    const { projects } = await data("list_projects", { locale });
    const project = projects.find(({ slug }) => slug === "brujula");
    assert.deepEqual(await data("search", { locale, query: " BrúJULA " }), { projects: [project] });
    assert.deepEqual(await data("search", { locale, query: "no site match here" }), { projects: [] });
    const regular = (await data("search", { locale, query: "a" })).projects;
    assert.equal(regular.length, 5);
    const limited = (await data("search", { locale, query: "a", limit: 2 })).projects;
    assert.deepEqual(limited, regular.slice(0, 2));
    assert.ok(limited.every((result) => projects.some((item) => item.slug === result.slug)));
  });
}

test("unknown slugs and invalid arguments return tool errors without changing public data", async () => {
  const original = await data("list_projects");
  assert.deepEqual(await call("get_project", { slug: "not-a-project" }), {
    isError: true, content: [{ type: "text", text: "Unknown project slug: not-a-project" }],
  });
  for (const [tool, args] of [
    ["get_profile", { locale: "fr" }], ["get_profile", { extra: true }],
    ["list_projects", { stack: " " }], ["list_projects", { kind: "image" }],
    ["get_project", {}], ["get_project", { slug: "../brujula" }],
    ["search", { query: " " }], ["search", { query: "a".repeat(121) }],
    ["search", { query: "a", limit: 11 }], ["search", { query: "a", limit: 0 }],
  ]) {
    const error = await call(tool, args);
    assert.deepEqual(error, { isError: true, content: [{ type: "text", text: `Invalid arguments for ${tool}. See tools/list for its input schema.` }] });
  }
  assert.deepEqual(await data("list_projects"), original);
});

test("text filters that normalize to empty or whitespace return tool errors without changing published results", async () => {
  const original = await data("list_projects");
  for (const [name, input] of [["search", "query"], ["list_projects", "stack"]]) {
    for (const text of ["\u0301", "\u0301 \u0308", "\u00a8"]) {
      assert.deepEqual(await call(name, { [input]: text }), {
        isError: true, content: [{ type: "text", text: `Invalid arguments for ${name}. See tools/list for its input schema.` }],
      }, `${name}: ${JSON.stringify(text)}`);
    }
  }
  assert.deepEqual(await data("list_projects"), original);
});

test("get_project keeps the public record when the encoded Spanish study would exceed the cap", async (t) => {
  const fixture = mkdtempSync(join(tmpdir(), "portfolio-mcp-"));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  const buildScript = "scripts/build-mcp-data.mjs";
  const handlerPath = "api/mcp.mjs";
  for (const path of [buildScript, handlerPath]) {
    mkdirSync(dirname(join(fixture, path)), { recursive: true });
    copyFileSync(new URL(`../${path}`, import.meta.url), join(fixture, path));
  }
  symlinkSync(fileURLToPath(new URL("../node_modules", import.meta.url)), join(fixture, "node_modules"), "junction");

  const slug = "roster-edge";
  const path = (locale, projectSlug) => `${workPath(locale)}${projectSlug}/index.md`;
  // The raw Markdown fits, but neither JSON escaping nor UTF-8 byte counts may be ignored.
  const markdown = `# RosterEdge\n\n${'á"\\\n'.repeat(7_000)}`;
  assert.ok(Buffer.byteLength(markdown) < 64 * 1024);
  assert.ok(Buffer.byteLength(JSON.stringify(JSON.stringify(markdown))) > 64 * 1024);
  const outDir = join(fixture, "custom-dist");
  const paths = ["resume.json", "es/resume.json", "projects.json", ...locales.map((locale) => `${workPath(locale)}index.html`)];
  for (const { caseStudy } of feed()) {
    if (caseStudy) paths.push(...locales.map((locale) => path(locale, new URL(caseStudy).pathname.split("/").at(-2))));
  }
  for (const name of paths) {
    const target = join(outDir, name);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, name === path("es", slug) ? markdown : dist(name));
  }

  const script = join(fixture, buildScript);
  const options = { cwd: fixture, encoding: "utf8" };
  const snapshot = join(fixture, "api/_generated/portfolio.json");
  const imported = spawnSync(process.execPath, ["--input-type=module", "--eval", "await import(process.argv[1])", pathToFileURL(script).href], options);
  assert.ifError(imported.error);
  assert.deepEqual([imported.status, imported.stdout, imported.stderr], [0, "", ""]);
  assert.throws(() => readFileSync(snapshot), { code: "ENOENT" });

  // Reproduce a Node runtime without import.meta.main while still executing the entry point directly.
  const preload = `import { registerHooks } from "node:module";
    registerHooks({ load(url, context, nextLoad) {
      const loaded = nextLoad(url, context);
      return url === ${JSON.stringify(pathToFileURL(script).href)}
        ? { ...loaded, source: "delete import.meta.main;\\n" + loaded.source } : loaded;
    } });`;
  const build = spawnSync(process.execPath, [`--import=data:text/javascript,${encodeURIComponent(preload)}`, script, outDir], options);
  assert.ifError(build.error);
  assert.equal(build.status, 0, build.stderr);
  const contents = readFileSync(snapshot, "utf8");
  assert.equal(build.stdout, `MCP snapshot: ${feed().length} projects, ${Buffer.byteLength(contents)} bytes\n`);
  // A symlinked entry point still builds: Node resolves import.meta.url through the link.
  const fs = await import("node:fs");
  const link = join(fixture, "build-mcp-data-link.mjs");
  fs.symlinkSync(script, link);
  fs.rmSync(snapshot);
  const linked = spawnSync(process.execPath, [link, outDir], options);
  assert.equal(linked.status, 0, linked.stderr);
  assert.equal(readFileSync(snapshot, "utf8"), contents);
  const { default: handler } = await import(pathToFileURL(join(fixture, handlerPath)).href);
  const fixtureServer = await startServer(handler);
  t.after(() => stopServer(fixtureServer.server));

  await t.test("build identifies the affected slug and locale", () => {
    assert.equal(build.stderr, "MCP snapshot: get_project roster-edge (es) is within 256 bytes of 64 KiB or over it with Markdown\n");
  });
  await t.test("HTTP response omits only Markdown and tells clients where to read it", async () => {
    const { projects } = await data("list_projects", { locale: "es" }, fixtureServer.endpoint);
    const project = projects.find((project) => project.slug === slug);
    assert.equal(project.caseStudy, "https://diegnghtmr.me/es/trabajo/roster-edge/");
    assert.deepEqual(await data("get_project", { slug, locale: "es" }, fixtureServer.endpoint), {
      ...project,
      markdownOmitted: "Case-study Markdown omitted because the MCP response would exceed 64 KiB. See caseStudy for the full study.",
    });
    assert.deepEqual(await data("get_project", { slug, locale: "en" }, fixtureServer.endpoint),
      await data("get_project", { slug, locale: "en" }));
  });
});

const smokeScript = fileURLToPath(new URL("./mcp-smoke.mjs", import.meta.url));
function runSmoke(...args) {
  return new Promise((resolve, reject) => execFile(process.execPath, [smokeScript, ...args],
    { timeout: 45_000 }, (error, stdout, stderr) => {
      if (error && typeof error.code !== "number") return reject(error);
      resolve({ status: error?.code ?? 0, stdout, stderr });
    }));
}

test("smoke CLI passes on the local HTTP server and fails a trailing-slash redirect", async (t) => {
  for (const baseUrl of [endpoint.origin, `${endpoint.origin}/`]) {
    assert.deepEqual(await runSmoke(baseUrl), { status: 0, stdout: "MCP smoke passed\n", stderr: "" });
  }
  const redirecting = await startServer(mcp, { redirectSlash: true });
  t.after(() => stopServer(redirecting.server));
  assert.deepEqual(await runSmoke(redirecting.endpoint.origin), {
    status: 1, stdout: "", stderr: "MCP smoke failed: initialize /mcp/: expected HTTP 200, got 308\n",
  });
});

test("smoke CLI rejects a non-root base URL without making requests", async (t) => {
  let requests = 0;
  const count = () => { requests += 1; };
  server.on("request", count);
  t.after(() => server.off("request", count));
  assert.deepEqual(await runSmoke(`${endpoint.origin}/deployment/`), {
    status: 1, stdout: "", stderr: "MCP smoke failed: baseUrl must not include a path prefix\n",
  });
  assert.deepEqual(await runSmoke(), {
    status: 1, stdout: "", stderr: "MCP smoke failed: usage: node scripts/mcp-smoke.mjs <baseUrl> (site root, no path prefix)\n",
  });
  assert.equal(requests, 0);
});

test("the official MCP Client completes discovery and a tool call over the real HTTP endpoint", async () => {
  assert.equal((await fetch(endpoint, { redirect: "manual" })).status, 405);
  const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
  const { StreamableHTTPClientTransport } = await import("@modelcontextprotocol/sdk/client/streamableHttp.js");
  const client = new Client({ name: "portfolio-sdk-test", version: "1.0.0" });
  try {
    await client.connect(new StreamableHTTPClientTransport(endpoint));
    assert.equal((await client.listTools()).tools.length, 4);
    const { content, isError } = await client.callTool({ name: "get_project", arguments: { slug: "brujula", locale: "es" } });
    assert.notEqual(isError, true);
    assert.equal(JSON.parse(content[0].text).markdown, dist("es/trabajo/brujula/index.md"));
  } finally {
    await client.close();
  }
});

test("the built llms.txt advertises the explicit MCP URL", () => {
  assert.match(dist("llms.txt"), /^Portfolio MCP: connect a Streamable HTTP client to <https:\/\/diegnghtmr\.me\/mcp>/m);
});

test("/mcp and /mcp/ rewrite to the function and are exempt from slash redirects", async () => {
  const { config, default: middleware } = await import("../middleware.js");
  const { redirects, trailingSlash } = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  assert.equal(trailingSlash, undefined, "Vercel's global option would redirect /mcp before middleware");
  const slashRule = (destination) => {
    const { source, permanent } = redirects.find((rule) => rule.destination === destination);
    assert.equal(permanent, true);
    return new RegExp(`^/${source.replace("/:path", "")}$`);
  };
  const addSlash = slashRule("/:path/");
  const stripSlash = slashRule("/:path");
  for (const path of ["/en", "/es/trabajo", "/en/work/brujula"]) assert.match(path, addSlash);
  for (const path of ["/resume.json/", "/en/work/index.md/"]) assert.match(path, stripSlash);
  for (const path of ["/mcp", "/mcp/", "/api/mcp", "/.well-known/example"]) {
    assert.doesNotMatch(path, addSlash);
    assert.doesNotMatch(path, stripSlash);
  }
  for (const slash of ["", "/"]) {
    const path = `/mcp${slash}`;
    assert.ok(config.matcher.includes(path));
    const result = await middleware(new Request(`https://diegnghtmr.me${path}`, { method: "POST" }));
    assert.equal(result.headers.get("x-middleware-rewrite"), "https://diegnghtmr.me/api/mcp");
    assert.equal(result.headers.get("location"), null);
  }
});

// S36(c), S36(d)
test("only llms.txt advertises the MCP endpoint", () => {
  const announcement = /^Portfolio MCP: connect a Streamable HTTP client to <https:\/\/diegnghtmr\.me\/mcp>/m;
  assert.match(dist("llms.txt"), announcement);
  assert.doesNotMatch(dist("llms-full.txt"), announcement);
  assert.doesNotMatch(dist("es/llms-full.txt"), announcement);
});

test("the build warns about a study that fits only with a tiny request ID", async () => {
  const { getProjectResult, oversizedStudies } = await import("./build-mcp-data.mjs");
  const study = (markdown) => ({ slug: "near-limit", studies: { en: { url: "u", markdown }, es: { url: "u", markdown: "" } },
    description: { en: "", es: "" }, kind: { en: "", es: "" } });
  let size = 60 * 1024;
  while (!getProjectResult(study("x".repeat(size + 1)), "en", 0).markdownOmitted) size++;
  const nearLimit = study("x".repeat(size));
  assert.equal(getProjectResult(nearLimit, "en", 0).markdownOmitted, false);
  assert.equal(getProjectResult(nearLimit, "en", "8f14e45f-ceea-467f-a0e6-5b0f1e7a9c2d").markdownOmitted, true);
  assert.deepEqual(oversizedStudies([nearLimit]), [{ slug: "near-limit", locale: "en" }]);
  assert.deepEqual(oversizedStudies([study("short")]), []);
});
