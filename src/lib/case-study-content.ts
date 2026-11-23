import type { Locale } from "../i18n";

export const caseBodyHeadings = {
  en: ["Problem", "How it works"],
  es: ["Problema", "Cómo funciona"],
} as const satisfies Record<Locale, readonly [string, string]>;

export const placeholder = /\b(?:to confirm|tbd|por confirmar)\b/i;

export function caseBodySections(body: string, locale: Locale, file: string) {
  const titles = caseBodyHeadings[locale];
  const markdown = body.trim();
  // Astro validates the rendered heading depths. Find the corresponding source
  // offsets for the Markdown twin without mistaking fenced examples for headings.
  const headings: { title: string; start: number; end: number }[] = [];
  const editorialLines: string[] = [];
  let fence: string | undefined;
  for (const { 0: line, index } of markdown.matchAll(/^.+$/gm)) {
    if (fence) {
      const closer = /^ {0,3}(`{3,}|~{3,})[ \t]*$/.exec(line)?.[1];
      if (closer?.startsWith(fence)) fence = undefined;
      continue;
    }
    const opener = /^ {0,3}(?:(`{3,})[^`]*|(~{3,}).*)$/.exec(line);
    fence = opener?.[1] ?? opener?.[2];
    if (fence) continue;
    editorialLines.push(line);
    const title = /^## (.+)$/.exec(line)?.[1];
    if (title !== undefined && index !== undefined) headings.push({ title: title.trim(), start: index, end: index + line.length });
  }
  const [problem, architecture] = headings;
  if (headings.length !== 2 || problem?.start !== 0 || problem.title !== titles[0] || architecture?.title !== titles[1]) {
    throw new Error(`${file}: expected exactly “## ${titles[0]}” and “## ${titles[1]}”, in that order`);
  }
  if (editorialLines.some((line) => placeholder.test(line))) throw new Error(`${file}: omit placeholders rather than publishing them`);
  const sections = {
    problem: markdown.slice(problem.end, architecture.start).trim(),
    architecture: markdown.slice(architecture.end).trim(),
  };
  for (const [section, title, min, max] of [[sections.problem, titles[0], 80, 160], [sections.architecture, titles[1], 120, 250]] as const) {
    const prose = section.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1");
    const words = prose.match(/[^\s]+/g)?.filter((word) => /[\p{L}\p{N}]/u.test(word)).length ?? 0;
    if (words < min || words > max) throw new Error(`${file}: “${title}” has ${words} words; expected ${min}–${max}`);
  }
  return sections;
}
