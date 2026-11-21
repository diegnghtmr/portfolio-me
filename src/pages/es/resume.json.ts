import type { APIRoute } from "astro";
import { resume } from "../../lib/profile";

export const GET: APIRoute = () => Response.json(resume("es"));
