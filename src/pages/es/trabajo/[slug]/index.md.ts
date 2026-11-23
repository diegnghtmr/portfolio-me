import type { APIRoute } from "astro";
import { caseStudyPaths, type CaseStudy } from "../../../../lib/case-studies";
import { caseStudyMarkdown } from "../../../../lib/case-study-markdown";

export const getStaticPaths = caseStudyPaths;
export const GET: APIRoute<{ study: CaseStudy }> = async ({ props }) => new Response(await caseStudyMarkdown("es", props.study), {
  headers: { "Content-Type": "text/markdown; charset=utf-8" },
});
