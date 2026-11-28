import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import mcp from "../api/mcp.mjs";
import { Readable } from "node:stream";
import { after, before, test } from "node:test";

const protocol = "2025-11-25";
const accept = "application/json, text/event-stream";
const locales = ["en", "es"];
const dist = (path) => readFileSync(new URL(`../dist/${path}`, import.meta.url), "utf8");
const feed = () => JSON.parse(dist("projects.json")).projects;
const workPath = (locale) => locale === "en" ? "en/work/" : "es/trabajo/";
let server;
let endpoint;
let id = 0;

before(async () => {
  server = createServer(async (req, res) => {
    if (req.url !== "/mcp") return res.writeHead(404).end();
    const init = { method: req.method, headers: req.headers };
    if (req.method === "POST") Object.assign(init, { body: Readable.toWeb(req), duplex: "half" });
    try {
      const response = await mcp.fetch(new Request(new URL(req.url, endpoint), init));
      const body = response.body ? Buffer.from(await response.arrayBuffer()) : undefined;
      res.writeHead(response.status, Object.fromEntries(response.headers)).end(body);
    } catch (error) {
      res.writeHead(500).end(String(error));
    }
  });
  await new Promise((resolve, reject) => server.listen(0, "127.0.0.1", resolve).once("error", reject));
  endpoint = new URL(`http://127.0.0.1:${server.address().port}/mcp`);
});
after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

function post(body, headers = {}) {
  return fetch(endpoint, {
    method: "POST",
    headers: { accept, "content-type": "application/json", "mcp-protocol-version": protocol, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function rpc(method, params) {
  const requestId = ++id;
  const response = await post({ jsonrpc: "2.0", id: requestId, method, ...(params === undefined ? {} : { params }) });
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
const call = (name, args) => rpc("tools/call", { name, ...(args === undefined ? {} : { arguments: args }) });
async function data(name, args) {
  const result = await call(name, args);
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

test("the transport refuses over-budget aggregate results without sending the data", async () => {
  // The SDK also accepts legacy batches. Make sure the whole HTTP response is
  // bounded even when each individual tool result fits the budget.
  const calls = Array.from({ length: 10 }, (_item, index) => ({
    jsonrpc: "2.0", id: index + 1, method: "tools/call", params: { name: "list_projects" },
  }));
  const response = await post(calls, { "mcp-protocol-version": "2025-03-26" });
  assert.equal(response.status, 413);
  assert.deepEqual(await response.json(), {
    jsonrpc: "2.0", id: null, error: { code: -32000, message: "MCP response exceeds 64 KiB" },
  });
  assert.deepEqual(await rpc("ping"), {});
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
