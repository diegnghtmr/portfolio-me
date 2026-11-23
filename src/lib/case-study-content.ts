import type { Locale } from "../i18n";

export const caseBodyHeadings = {
  en: ["Problem", "How it works"],
  es: ["Problema", "Cómo funciona"],
} as const satisfies Record<Locale, readonly [string, string]>;

export const placeholder = /\b(?:to confirm|tbd|por confirmar)\b/i;

export function caseBodySections(body: string, locale: Locale, file: string) {
  const titles = caseBodyHeadings[locale];
  const markdown = body.trim();
  const headings = [...markdown.matchAll(/^## ([^\n]+)$/gm)];
  const [problem, architecture] = headings;
  const architectureStart = architecture?.index;
  if (headings.length !== 2 || problem?.index !== 0 || problem[1]?.trim() !== titles[0] ||
    !architecture || architectureStart === undefined || architecture[1]?.trim() !== titles[1]) {
    throw new Error(`${file}: expected exactly “## ${titles[0]}” and “## ${titles[1]}”, in that order`);
  }
  if (placeholder.test(markdown)) throw new Error(`${file}: omit placeholders rather than publishing them`);
  const sections = {
    problem: markdown.slice(problem[0].length, architectureStart).trim(),
    architecture: markdown.slice(architectureStart + architecture[0].length).trim(),
  };
  for (const [section, title, min, max] of [[sections.problem, titles[0], 80, 160], [sections.architecture, titles[1], 120, 250]] as const) {
    const prose = section.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1");
    const words = prose.match(/[^\s]+/g)?.filter((word) => /[\p{L}\p{N}]/u.test(word)).length ?? 0;
    if (words < min || words > max) throw new Error(`${file}: “${title}” has ${words} words; expected ${min}–${max}`);
  }
  return sections;
}
