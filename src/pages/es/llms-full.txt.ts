import type { APIRoute } from "astro";
import { caseStudiesMarkdown } from "../../lib/case-study-markdown";
import { getCaseStudies } from "../../lib/case-studies";
import { homeMarkdown, workMarkdown } from "../../lib/profile";

export const GET: APIRoute = async () => {
  const studies = await getCaseStudies();
  return new Response(`${homeMarkdown("es")}\n${workMarkdown("es", studies)}${await caseStudiesMarkdown("es", studies)}`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
