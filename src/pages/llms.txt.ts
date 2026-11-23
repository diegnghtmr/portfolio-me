import type { APIRoute } from "astro";
import { getCaseStudies } from "../lib/case-studies";
import { llmsTxt } from "../lib/profile";

export const GET: APIRoute = async () => new Response(llmsTxt(await getCaseStudies()), {
  headers: { "Content-Type": "text/plain; charset=utf-8" },
});
