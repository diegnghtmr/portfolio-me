import type { APIRoute } from "astro";
import { caseStudiesMarkdown } from "../lib/case-study-markdown";
import { getCaseStudies } from "../lib/case-studies";
import { homeMarkdown, llmsTxt, workMarkdown } from "../lib/profile";

export const GET: APIRoute = async () => {
  const studies = await getCaseStudies();
  return new Response(`${llmsTxt(studies)}\n${homeMarkdown("en")}\n${workMarkdown("en", studies)}${await caseStudiesMarkdown("en", studies)}`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
