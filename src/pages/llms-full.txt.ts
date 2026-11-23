import type { APIRoute } from "astro";
import { homeMarkdown, llmsTxt, workMarkdown } from "../lib/profile";

export const GET: APIRoute = () => new Response(`${llmsTxt()}\n${homeMarkdown("en")}\n${workMarkdown("en")}`, {
  headers: { "Content-Type": "text/plain; charset=utf-8" },
});
