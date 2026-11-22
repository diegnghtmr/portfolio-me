// Vercel Routing Middleware: content negotiation for agents.
// Static files are served before vercel.json rewrites, so a request for /en/ with
// `Accept: text/markdown` would always get index.html. Middleware runs first and
// rewrites it to the markdown twin; browsers never send text/markdown, so they
// always get HTML. Vary: Accept is set in vercel.json for the cache.
export const config = { matcher: ["/en/", "/es/"] };

/** q-value of a media type in an Accept header, or 0 when it is absent. */
function quality(accept, type) {
  for (const part of accept.split(",")) {
    const [media, ...params] = part.trim().toLowerCase().split(";");
    if (media.trim() !== type) continue;
    const q = params.map((param) => param.trim()).find((param) => param.startsWith("q="));
    return q ? Number(q.slice(2)) || 0 : 1;
  }
  return 0;
}

export default function middleware(request) {
  const accept = request.headers.get("accept") ?? "";
  const markdown = quality(accept, "text/markdown");
  if (markdown === 0 || markdown < quality(accept, "text/html")) return undefined;
  const url = new URL(request.url);
  url.pathname = `${url.pathname}index.md`;
  return new Response(null, { headers: { "x-middleware-rewrite": url.href } });
}
