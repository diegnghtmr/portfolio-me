import type { APIRoute } from "astro";
import { getCaseStudies } from "../lib/case-studies";
import { projectsJson } from "../lib/profile";

export const GET: APIRoute = async () => Response.json(projectsJson(await getCaseStudies()));
