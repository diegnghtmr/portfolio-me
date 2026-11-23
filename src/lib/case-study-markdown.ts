import { getImage } from "astro:assets";
import { caseStudyMessages } from "../i18n/case-study";
import { workMessages } from "../i18n/work";
import type { Locale } from "../i18n";
import { absolute } from "./profile";
import { describeArchitecture } from "./case-study-architecture";
import { caseBodySections } from "./case-study-content";
import type { CaseStudies, CaseStudy } from "./case-studies";

const link = (text: string, url: string) => {
  const destination = new URL(url).href.replaceAll("(", "%28").replaceAll(")", "%29").replaceAll("\\", "%5C");
  return `[${text.replace(/[[\]\\]/g, "\\$&")}](${destination})`;
};

// Continuations must start under the list item text, including after a blank line.
const listItem = (text: string) => `- ${text.replace(/\r?\n(?=\S|[ \t]+\S)/g, "\n  ")}`;

export async function caseStudyMarkdown(locale: Locale, { project, entries }: CaseStudy) {
  const m = caseStudyMessages[locale];
  const w = workMessages[locale];
  const entry = entries[locale];
  const { summary, role, timeframe, team, demo, demonstration, decisions, results, limitations, architecture: diagram } = entry.data;
  const { problem, architecture } = caseBodySections(entry.body ?? "", locale, entry.id);
  const demoLines = demonstration.kind === "screenshots"
    ? await Promise.all(demonstration.screenshots.map(async ({ src, alt, caption }) => {
      const image = await getImage({ src, width: src.width, format: "webp" });
      return `!${link(alt, absolute(image.src))}\n\n${caption}\n`;
    }))
    : [demonstration.terminal.caption, "", `*${m[demonstration.terminal.source]}*`, "", ...demonstration.terminal.steps.flatMap(({ command, output }) => {
      const transcript = `$ ${command}\n${output}`;
      const fence = "`".repeat(Math.max(3, ...[...transcript.matchAll(/`+/g)].map(([run]) => run.length + 1)));
      return [fence, transcript, fence, ""];
    })];
  return [
    `# ${project.name}`, "", `> ${summary}`, "",
    ...(role ? [`- ${m.role}: ${role}`] : []),
    ...(timeframe ? [`- ${m.timeframe}: ${timeframe}`] : []),
    ...(team ? [`- ${m.team}: ${m.people(team)}`] : []),
    `- ${m.surfaces}: ${project.surfaceLabel[locale]}`,
    ...(project.stack.length ? [`- ${m.stack}: ${project.stack.join(", ")}`] : []),
    ...(demo ? [`- ${m.demo}: ${link(m.openDemo, demo.url)}${demo.note ? ` (${demo.note})` : ""}`] : []),
    "", `## ${m.problem}`, "", problem, "",
    `## ${m.demonstration}`, "", ...demoLines, "",
    `## ${m.architecture}`, "", architecture, "",
    ...(diagram ? [`### ${m.diagramText}`, "", ...describeArchitecture(diagram).map(listItem), ""] : []),
    `### ${m.repositories}`, "",
    ...project.repositories.map(({ name, url, role }) => `- ${link(name, url)} (${w.roles[role]})`),
    "", `## ${m.decisions}`, "",
    ...decisions.flatMap(({ question, options, consequence, evidence, quote }) => [
      `### ${question}`, "",
      ...options.map(({ label, reason, chosen }) => listItem(`**${label}** (${chosen ? m.chosen : m.notChosen}): ${reason}`)),
      "", `**${m.consequence}:** ${consequence}`, "",
      ...(quote ? [quote.split("\n").map((line) => `> ${line}`).join("\n"), ""] : []),
      `**${m.evidence}:** ${evidence.map(({ label, url }) => link(label, url)).join(", ")}`, "",
    ]),
    ...(results ? [`## ${m.results}`, "", ...results.map(({ label, detail, url }) => listItem(`${url ? link(label, url) : `**${label}**`}: ${detail}`)), ""] : []),
    ...(limitations ? [`## ${m.limitations}`, "", ...limitations.map(listItem), ""] : []),
  ].join("\n");
}

export async function caseStudiesMarkdown(locale: Locale, studies: CaseStudies) {
  const twins = await Promise.all([...studies.values()].map((study) => caseStudyMarkdown(locale, study)));
  return twins.length ? `\n${twins.join("\n")}` : "";
}
