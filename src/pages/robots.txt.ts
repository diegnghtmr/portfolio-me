import type { APIRoute } from "astro";
import { absolute } from "../lib/profile";

const trainingBots = ["GPTBot", "ClaudeBot", "Google-Extended", "CCBot", "Applebot-Extended"];

export const GET: APIRoute = () => new Response([
  "User-agent: *\nAllow: /",
  ...trainingBots.map((bot) => `User-agent: ${bot}\nDisallow: /`),
  `Sitemap: ${absolute("/sitemap.xml")}\n# Agent index: ${absolute("/llms.txt")}\n`,
].join("\n\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
