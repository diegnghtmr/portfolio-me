import { readFileSync } from "node:fs";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { readRequestBody, requestBodyTooLargeMessage } from "@modelcontextprotocol/sdk/server/requestBody.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { isJsonContentType } from "@modelcontextprotocol/sdk/shared/mediaType.js";
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { fitsResponse, getProjectResult, jsonResult, localizedProject, maxResponseBytes, textResult } from "../scripts/build-mcp-data.mjs";

const maxRequestBytes = 16 * 1024;
const allowedOrigins = new Set(["https://diegnghtmr.me", "https://www.diegnghtmr.me"]);
const { profiles, projects } = JSON.parse(readFileSync(new URL("./_generated/portfolio.json", import.meta.url), "utf8"));

const normalize = (text) => text.normalize("NFKD").replace(/\p{Mark}/gu, "").toLowerCase();
const toolError = (text) => ({ ...textResult(text), isError: true });
const localeInput = z.enum(["en", "es"]).default("en").describe("Language of the result");
const shortText = z.string().trim().min(1).max(120).refine((text) => normalize(text).trim().length > 0);
const tools = new Map(Object.entries({
  get_profile: {
    description: "Get the public résumé, including experience, education, skills, and links.",
    schema: z.strictObject({ locale: localeInput }),
    run: ({ locale }) => jsonResult(profiles[locale]),
  },
  list_projects: {
    description: "List published projects in site order, optionally filtered by repository kind and technology.",
    schema: z.strictObject({
      locale: localeInput,
      kind: z.enum(["web", "api", "cli", "infra"]).optional().describe("Match any repository of this kind"),
      stack: shortText.optional().describe("Case- and accent-insensitive substring of a stack entry; must contain text after normalization"),
    }),
    run: ({ locale, kind, stack }) => {
      const term = stack ? normalize(stack).trim() : undefined;
      return jsonResult({ projects: projects.filter((project) =>
        (!kind || project.repositories.some((repository) => repository.surface === kind)) &&
        (!term || project.stack.some((entry) => normalize(entry).includes(term))))
        .map((project) => localizedProject(project, locale)) });
    },
  },
  get_project: {
    description: "Get a published project by slug, with its public case-study Markdown when it fits the 64 KiB response limit. Otherwise returns the study URL and a Markdown omission notice.",
    schema: z.strictObject({
      locale: localeInput,
      slug: z.string().max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).describe("Slug returned by list_projects"),
    }),
    run: ({ locale, slug }, requestId) => {
      const project = projects.find((entry) => entry.slug === slug);
      if (!project) return toolError(`Unknown project slug: ${slug}`);
      return getProjectResult(project, locale, requestId).result;
    },
  },
  search: {
    description: "Find public projects by name, slug, localized summary, kind, stack, or repository. Returns matches in site order.",
    schema: z.strictObject({
      locale: localeInput,
      query: shortText.describe("All whitespace-separated terms must match; case and accents are ignored, and the query must contain text after normalization"),
      limit: z.number().int().min(1).max(10).default(5).describe("Maximum number of results"),
    }),
    run: ({ locale, query, limit }) => {
      const terms = normalize(query).trim().split(/\s+/);
      const matches = [];
      for (const project of projects) {
        const fields = [project.name, project.slug, project.description[locale], project.kind[locale],
          ...project.stack, ...project.repositories.map(({ name }) => name)].map(normalize);
        if (!terms.every((term) => fields.some((field) => field.includes(term)))) continue;
        matches.push(localizedProject(project, locale));
        if (matches.length === limit) break;
      }
      return jsonResult({ projects: matches });
    },
  },
}));
const toolList = [...tools].map(([name, { schema, description }]) => ({
  name, description,
  inputSchema: z.toJSONSchema(schema, { io: "input" }),
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
}));

function createServer() {
  const server = new Server({ name: "portfolio-me", version: "1.0.0" }, { capabilities: { tools: {} } });
  server.setRequestHandler(ListToolsRequestSchema, () => ({ tools: toolList }));
  server.setRequestHandler(CallToolRequestSchema, ({ params }, { requestId }) => {
    const tool = tools.get(params.name);
    if (!tool) throw new McpError(ErrorCode.InvalidParams, "Unknown tool. See tools/list.");
    const args = tool.schema.safeParse(params.arguments ?? {});
    if (!args.success) return toolError(`Invalid arguments for ${params.name}. See tools/list for its input schema.`);
    const result = tool.run(args.data, requestId);
    if (!fitsResponse(result, requestId)) {
      return toolError("Result exceeds 64 KiB. Use narrower filters or read the public site for the full content.");
    }
    return result;
  });
  return server;
}

const noStore = { "cache-control": "no-store" };
const httpError = (status, message, code = -32000) => Response.json({
  jsonrpc: "2.0", id: null, error: { code, message },
}, { status, headers: noStore });

// Web-standard handler for Vercel's Node.js runtime. Only immutable publication data is shared.
export default {
  async fetch(request) {
    const origin = request.headers.get("origin");
    if (origin !== null && !allowedOrigins.has(origin)) return httpError(403, "Forbidden: invalid Origin");
    if (request.method !== "POST") {
      // Vercel exposes the deployed commit; CI polls it to know production is live.
      const build = process.env.VERCEL_GIT_COMMIT_SHA;
      return new Response(null, { status: 405, headers: { ...noStore, allow: "POST", ...(build ? { "x-build-sha": build } : {}) } });
    }

    // Leave header errors to the SDK. For valid headers, reject legacy batches before creating a server.
    const accept = request.headers.get("accept");
    let parsedBody;
    if (accept?.includes("application/json") && accept.includes("text/event-stream") &&
        isJsonContentType(request.headers.get("content-type"))) {
      try {
        const body = await readRequestBody(request, maxRequestBytes);
        if (body.tooLarge) return httpError(413, requestBodyTooLargeMessage(maxRequestBytes));
        parsedBody = JSON.parse(body.text);
      } catch {
        return httpError(400, "Parse error: Invalid JSON", ErrorCode.ParseError);
      }
      if (Array.isArray(parsedBody)) return httpError(400, "JSON-RPC batches are not supported", ErrorCode.InvalidRequest);
    }

    const server = createServer();
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
      maxRequestBodySize: maxRequestBytes,
    });
    try {
      await server.connect(transport);
      const response = await transport.handleRequest(request, { parsedBody });
      response.headers.set("cache-control", "no-store");
      if (!response.body) return response;
      // Keep the transport-level limit for non-tool responses too.
      const body = await response.arrayBuffer();
      if (body.byteLength > maxResponseBytes) return httpError(413, "MCP response exceeds 64 KiB");
      return new Response(body, { status: response.status, headers: response.headers });
    } finally {
      await server.close();
    }
  },
};
