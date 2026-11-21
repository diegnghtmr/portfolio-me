import type { APIRoute } from "astro";
import { homeMarkdown } from "../../lib/profile";

export const GET: APIRoute = () => new Response(homeMarkdown("es"), {
  headers: { "Content-Type": "text/markdown; charset=utf-8" },
});
