import type { APIRoute } from "astro";
import { homeMarkdown, workMarkdown } from "../../lib/profile";

export const GET: APIRoute = () => new Response(`${homeMarkdown("es")}\n${workMarkdown("es")}`, {
  headers: { "Content-Type": "text/plain; charset=utf-8" },
});
