import type { APIRoute } from "astro";
import { pagePath, type Page } from "../i18n";
import { getCaseStudies } from "../lib/case-studies";
import { absolute, buildDate, locales } from "../lib/profile";

const pageEntries = (page: Page) => {
  const alternates = [...locales, "x-default" as const].map((language) => {
    const url = absolute(pagePath(language === "x-default" ? "en" : language, page));
    return `<xhtml:link rel="alternate" hreflang="${language}" href="${url}"/>`;
  });
  return locales.map((locale) => `<url><loc>${absolute(pagePath(locale, page))}</loc>\n${alternates.join("\n")}\n<lastmod>${buildDate}</lastmod></url>`);
};

export const GET: APIRoute = async () => new Response([
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...pageEntries("home"),
  ...pageEntries("work"),
  ...[...(await getCaseStudies()).values()].flatMap(({ project }) => pageEntries(project)),
  "</urlset>",
  "",
].join("\n"), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
