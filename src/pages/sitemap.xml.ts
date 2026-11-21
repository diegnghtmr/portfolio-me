import type { APIRoute } from "astro";
import { localePath } from "../i18n";
import { absolute, buildDate, locales } from "../lib/profile";

const alternates = [...locales, "x-default" as const].map((language) => {
  const url = absolute(localePath(language === "x-default" ? "en" : language));
  return `<xhtml:link rel="alternate" hreflang="${language}" href="${url}"/>`;
});

export const GET: APIRoute = () => new Response([
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...locales.map((locale) => `<url><loc>${absolute(localePath(locale))}</loc>\n${alternates.join("\n")}\n<lastmod>${buildDate}</lastmod></url>`),
  "</urlset>",
  "",
].join("\n"), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
