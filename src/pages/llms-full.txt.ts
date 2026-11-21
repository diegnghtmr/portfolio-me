import type { APIRoute } from "astro";
import { homeMarkdown, llmsTxt } from "../lib/profile";

export const GET: APIRoute = () => new Response(`${llmsTxt()}\n${homeMarkdown("en")}`, {
  headers: { "Content-Type": "text/plain; charset=utf-8" },
});
