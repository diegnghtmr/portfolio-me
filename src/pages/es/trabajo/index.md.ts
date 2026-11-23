import type { APIRoute } from "astro";
import { getCaseStudies } from "../../../lib/case-studies";
import { workMarkdown } from "../../../lib/profile";

export const GET: APIRoute = async () => new Response(workMarkdown("es", await getCaseStudies()), {
  headers: { "Content-Type": "text/markdown; charset=utf-8" },
});
