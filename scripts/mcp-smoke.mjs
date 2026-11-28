const protocolVersion = "2025-11-25";
const accept = "application/json, text/event-stream";

async function smoke(baseUrl) {
  let id = 0;
  async function request(method, path, label, status, body) {
    let response;
    try {
      response = await fetch(new URL(path, baseUrl), {
        method,
        redirect: "manual",
        signal: AbortSignal.timeout(10_000),
        headers: body ? { accept, "content-type": "application/json", "mcp-protocol-version": protocolVersion } : { accept },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
    } catch (error) {
      throw new Error(`${label}: ${error.message}`);
    }
    if (response.status !== status) throw new Error(`${label}: expected HTTP ${status}, got ${response.status}`);
    return response;
  }

  async function rpc(path, method, params) {
    const label = `${method} ${path}`;
    const requestId = ++id;
    const response = await request("POST", path, label, 200, { jsonrpc: "2.0", id: requestId, method, params });
    let message;
    try {
      message = await response.json();
    } catch {
      throw new Error(`${label}: response is not valid JSON`);
    }
    if (message?.jsonrpc !== "2.0" || message.id !== requestId || message.error || !message.result) {
      throw new Error(`${label}: expected a successful JSON-RPC result`);
    }
    return message.result;
  }

  await request("GET", "/mcp", "GET /mcp", 405);
  for (const path of ["/mcp", "/mcp/"]) {
    const result = await rpc(path, "initialize", {
      protocolVersion, capabilities: {}, clientInfo: { name: "portfolio-mcp-smoke", version: "1.0.0" },
    });
    if (result.protocolVersion !== protocolVersion) {
      throw new Error(`initialize ${path}: expected protocol ${protocolVersion}`);
    }
  }
  const result = await rpc("/mcp", "tools/call", { name: "get_project", arguments: { slug: "roster-edge", locale: "es" } });
  if (result.isError || !Array.isArray(result.content) ||
      !result.content.some((item) => item?.type === "text" && typeof item.text === "string" && item.text.includes("RosterEdge"))) {
    throw new Error("tools/call /mcp: expected a successful get_project result containing RosterEdge");
  }
}

try {
  if (process.argv.length !== 3) throw new Error("usage: node scripts/mcp-smoke.mjs <baseUrl>");
  let baseUrl;
  try {
    baseUrl = new URL(process.argv[2]);
  } catch {
    throw new Error("baseUrl must be an absolute HTTP or HTTPS URL");
  }
  if (!["http:", "https:"].includes(baseUrl.protocol) || baseUrl.username || baseUrl.password) {
    throw new Error("baseUrl must be an absolute HTTP or HTTPS URL without credentials");
  }
  await smoke(baseUrl);
  console.log("MCP smoke passed");
} catch (error) {
  console.error(`MCP smoke failed: ${error.message.replace(/[\r\n]+/g, " ")}`);
  process.exitCode = 1;
}
