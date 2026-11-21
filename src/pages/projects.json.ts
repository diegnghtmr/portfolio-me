import type { APIRoute } from "astro";
import { projectsJson } from "../lib/profile";

export const GET: APIRoute = () => Response.json(projectsJson());
