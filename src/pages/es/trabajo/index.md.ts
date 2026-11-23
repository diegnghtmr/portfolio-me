import type { APIRoute } from "astro";
import { workMarkdown } from "../../../lib/profile";

export const GET: APIRoute = () => new Response(workMarkdown("es"), {
  headers: { "Content-Type": "text/markdown; charset=utf-8" },
});
