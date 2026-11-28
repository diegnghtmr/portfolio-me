// Machine-readable views of the shared, bilingual profile and project content.
import { contact, experience, openSource, principles, projects, stack } from "../data/home";
import { atlasProjects, publishedFeedEntries, rankedFeaturedProjects, primaryRepository, type Repository } from "../data/projects";
import { caseStudyPath, localePath, pagePath, siteHandle, siteName, t, workPath, type Locale, type Page } from "../i18n";
import { en } from "../i18n/en";
import { es } from "../i18n/es";
import { workMessages } from "../i18n/work";
import type { CaseStudies, CaseStudy } from "./case-studies";
import { projectHref, projectSurfaces } from "./work";

export const site = "https://diegnghtmr.me";
export const buildDate = new Date().toISOString().slice(0, 10);
export const locales = ["en", "es"] as const satisfies readonly Locale[];
export const absolute = (path: string) => new URL(path, site).href;
export const markdownPath = (locale: Locale, page: Page = "home") => `${pagePath(locale, page)}index.md`;
export const ogImagePath = (locale: Locale) => `/og/home-${locale}.png`;

const personId = `${site}/#diego`;
const websiteId = `${site}/#site`;
const stackList = (value: string) => value.split(",").map((item) => item.trim());
const repoUrl = (owner: string, repo: string) => `https://github.com/${owner}/${repo}`;
const location = { city: "Armenia", region: "Quindío", countryCode: "CO" } as const;

const sourceCode = ({ name, url, programmingLanguage }: Repository) => ({
  "@type": "SoftwareSourceCode",
  "@id": url,
  name,
  codeRepository: url,
  ...(programmingLanguage ? { programmingLanguage } : {}),
});

/** One JSON-LD @graph per page: site, person, profile page and the selected work. */
export function jsonLd(locale: Locale) {
  const page = absolute(localePath(locale));
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": websiteId, url: `${site}/`, name: siteName, inLanguage: [...locales], publisher: { "@id": personId } },
      {
        "@type": "Person",
        "@id": personId,
        name: siteName,
        alternateName: siteHandle,
        url: `${site}/`,
        image: `${contact.github}.png`,
        email: `mailto:${contact.email}`,
        jobTitle: t(locale, "titleRole"),
        description: t(locale, "description"),
        address: { "@type": "PostalAddress", addressLocality: location.city, addressRegion: location.region, addressCountry: location.countryCode },
        alumniOf: { "@type": "CollegeOrUniversity", name: t(locale, "university") },
        knowsLanguage: ["es", "en", "fr"],
        knowsAbout: stack.flat().flatMap((group) => group.tools.map(([name]) => name)),
        sameAs: [contact.github, contact.linkedin],
      },
      {
        "@type": "ProfilePage",
        "@id": `${page}#page`,
        url: page,
        name: `${siteName}, ${t(locale, "titleRole")}`,
        inLanguage: locale,
        isPartOf: { "@id": websiteId },
        mainEntity: { "@id": personId },
        dateModified: buildDate,
      },
      {
        "@type": "ItemList",
        "@id": `${page}#work`,
        name: t(locale, "selectedWork"),
        itemListElement: projects.map((project, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "CreativeWork",
            "@id": `${page}#${project.id}`,
            name: project.name,
            description: t(locale, project.description),
            url: project.href,
            creator: { "@id": personId },
            keywords: stackList(project.stack).join(", "),
            genre: t(locale, project.kind),
            hasPart: project.repositories.map(sourceCode),
          },
        })),
      },
    ],
  };
}

export function workJsonLd(locale: Locale, studies: CaseStudies) {
  const page = absolute(workPath(locale));
  const title = t(locale, "work");
  const m = workMessages[locale];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${page}#page`,
        url: page,
        name: title,
        description: m.intro,
        inLanguage: locale,
        isPartOf: { "@id": websiteId },
        mainEntity: { "@id": `${page}#projects` },
        breadcrumb: { "@id": `${page}#breadcrumbs` },
      },
      {
        "@type": "ItemList",
        "@id": `${page}#projects`,
        numberOfItems: atlasProjects.length,
        itemListElement: atlasProjects.map((project, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "CreativeWork",
            "@id": `${page}#${project.slug}`,
            name: project.name,
            description: project.purpose[locale],
            url: absolute(projectHref(locale, project, studies)),
            genre: m.genre[project.primarySurface],
            ...(project.stack.length ? { keywords: project.stack.join(", ") } : {}),
            hasPart: project.repositories.map(sourceCode),
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${page}#breadcrumbs`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: m.home, item: absolute(localePath(locale)) },
          { "@type": "ListItem", position: 2, name: title, item: page },
        ],
      },
    ],
  };
}

export function caseStudyJsonLd(locale: Locale, { project, entries }: CaseStudy) {
  const page = absolute(caseStudyPath(locale, project.slug));
  const repositories = project.repositories.map(sourceCode);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork", "@id": `${page}#case-study`, url: page, name: project.name,
        description: entries[locale].data.summary, inLanguage: locale, author: { "@id": personId },
        about: { "@type": "Thing", name: project.name },
        hasPart: repositories.map(({ "@id": id }) => ({ "@id": id })),
      },
      { "@type": "Person", "@id": personId, name: siteName, url: `${site}/`, sameAs: [contact.github, contact.linkedin] },
      ...repositories,
      {
        "@type": "BreadcrumbList", "@id": `${page}#breadcrumbs`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: workMessages[locale].home, item: absolute(localePath(locale)) },
          { "@type": "ListItem", position: 2, name: t(locale, "work"), item: absolute(workPath(locale)) },
          { "@type": "ListItem", position: 3, name: project.name, item: page },
        ],
      },
    ],
  };
}

const bullet = (label: string, value: string) => `- ${label}: ${value}`;

/** The home page as markdown: the twin agents get for `Accept: text/markdown`. */
export function homeMarkdown(locale: Locale) {
  const m = (key: Parameters<typeof t>[1]) => t(locale, key);
  const labels = locale === "en"
    ? { fact: "Fact", value: "Value", role: "Role", location: "Location", repositories: "Repositories" }
    : { fact: "Dato", value: "Valor", role: "Rol", location: "Ubicación", repositories: "Repositorios" };
  const lines = [
    `# ${siteName}`,
    "",
    `> ${m("description")}`,
    "",
    `${siteName} (${siteHandle}), ${m("titleRole")}. ${m("experienceIntro")}`,
    "",
    `${m("available")}. ${m("contactIntro")}`,
    "",
    `| ${labels.fact} | ${labels.value} |`,
    "| --- | --- |",
    `| ${labels.role} | ${m("titleRole")} |`,
    `| ${labels.location} | ${location.city}, ${location.region}, Colombia |`,
    "",
    `## ${m("contact")}`,
    "",
    bullet(m("email"), contact.email),
    bullet(m("github"), contact.github),
    bullet(m("linkedin"), contact.linkedin),
    bullet(m("cvPdf"), contact.cvPdf[locale]),
    "",
    `## ${m("selectedWork")}`,
    "",
    ...projects.flatMap((project) => [
      `### [${project.name}](${project.href})`,
      "",
      m(project.description),
      "",
      bullet(m("projects"), `${m(project.kind)} (${project.categories.join(", ")})`),
      bullet(m("stack").split(",")[0]!, project.stack),
      bullet(labels.repositories, project.repositories.map(({ name, url }) => `[${name}](${url})`).join(", ")),
      "",
    ]),
    `## ${m("how")}`,
    "",
    m("howIntro"),
    "",
    ...principles.map((item) => `- **${m(item.title)}.** ${m(item.text)} ${m("evidence")}: ${item.project.name}.`),
    "",
    `## ${m("oss")}`,
    "",
    m("ossIntro"),
    "",
    ...openSource.map((item) => `- [${item.owner}/${item.repo}](${repoUrl(item.owner, item.repo)}): ${m(item.description)} (${m(item.kind)})`),
    "",
    `## ${m("experience")}`,
    "",
    ...experience.map((item) => `- **${m(item.title)}**, ${m(item.organization)}, ${m(item.dates)}. ${m(item.text)}`),
    "",
    `## ${m("stack")}`,
    "",
    ...stack.flat().map((group) => `- **${m(group.label)}:** ${group.tools.map(([name, usedIn]) => `${name} (${usedIn})`).join("; ")}`),
    "",
  ];
  return lines.join("\n");
}

export function workMarkdown(locale: Locale, studies: CaseStudies) {
  const m = workMessages[locale];
  return [
    `# ${t(locale, "work")} | ${siteHandle}`,
    "",
    `> ${m.eyebrow}: ${m.intro}`,
    "",
    m.projects(atlasProjects.length),
    "",
    ...atlasProjects.flatMap((project) => [
      `## [${project.name}](${absolute(projectHref(locale, project, studies))})`,
      "",
      project.purpose[locale],
      "",
      bullet(m.facet.surface, project.surfaceLabel[locale]),
      ...(project.stack.length ? [bullet(m.facet.stack, project.stack.join(", "))] : []),
      bullet(m.facet.repos, project.repositories.map(({ name, url, role }) => `[${name}](${url}) (${m.roles[role]})`).join(", ")),
      "",
    ]),
  ].join("\n");
}

/** llms.txt (llmstxt.org): what the site is and where the machine-readable files live. */
export function llmsTxt(studies: CaseStudies) {
  return [
    `# ${siteName}`,
    "",
    `> ${en.description} Portfolio of ${siteName} (${siteHandle}), ${en.titleRole} in Armenia, Colombia.`,
    "",
    "Every page has a markdown twin: request it with `Accept: text/markdown` or add `index.md` to the page path. Content is the same in English and Spanish.",
    "",
    `Portfolio MCP: connect a Streamable HTTP client to <${absolute("/mcp")}> for the public profile and projects in English or Spanish.`,
    "",
    "## Profile",
    "",
    `- [Home in English](${absolute(markdownPath("en"))}): profile, selected work, open source, experience and stack`,
    `- [Inicio en español](${absolute(markdownPath("es"))}): the same page in Spanish`,
    `- [CV (PDF, English)](${contact.cvPdf.en})`,
    `- [CV (PDF, español)](${contact.cvPdf.es})`,
    "",
    "## Projects",
    "",
    `- [Work index in English](${absolute(markdownPath("en", "work"))}): the full systems atlas`,
    `- [Índice de trabajo en español](${absolute(markdownPath("es", "work"))}): el atlas completo`,
    ...projects.map((project) => `- [${project.name}](${project.href}): ${en[project.description]} Stack: ${project.stack}.`),
    "",
    ...(studies.size ? [
      "## Case studies",
      "",
      ...[...studies.values()].flatMap(({ project, entries }) => locales.map((locale) =>
        `- [${project.name} (${locale.toUpperCase()})](${absolute(markdownPath(locale, project))}): ${entries[locale].data.summary}`)),
      "",
    ] : []),
    "## Open source",
    "",
    ...openSource.map(({ owner, repo, description }) => `- [${owner}/${repo}](${repoUrl(owner, repo)}): ${en[description]}`),
    "",
    "## Machine-readable",
    "",
    `- [resume.json](${absolute("/resume.json")}): JSON Resume, English`,
    `- [resume.json (español)](${absolute("/es/resume.json")}): JSON Resume, Spanish`,
    `- [projects.json](${absolute("/projects.json")}): all projects with stack and repositories`,
    `- [llms-full.txt](${absolute("/llms-full.txt")}): the whole site in one markdown file`,
    "",
    "## Optional",
    "",
    `- [llms-full.txt (español)](${absolute("/es/llms-full.txt")}): the whole site in Spanish`,
    `- [Sitemap](${absolute("/sitemap.xml")})`,
    `- [GitHub](${contact.github}): all repositories`,
    "",
  ].join("\n");
}

const messages = { en, es };
const periods = {
  freelance: { startDate: "2025" },
  teaching: { startDate: "2024", endDate: "2026" },
  degree: { startDate: "2023" },
} as const;

/** JSON Resume (jsonresume.org schema v1) for one locale. */
export function resume(locale: Locale) {
  const m = messages[locale];
  return {
    $schema: "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
    basics: {
      name: siteName,
      label: m.titleRole,
      image: `${contact.github}.png`,
      email: contact.email,
      url: absolute(localePath(locale)),
      summary: `${m.description} ${m.experienceIntro}`,
      location: { city: location.city, region: location.region, countryCode: location.countryCode },
      profiles: [
        { network: "GitHub", username: contact.githubHandle, url: contact.github },
        { network: "LinkedIn", username: contact.linkedinHandle, url: contact.linkedin },
      ],
    },
    work: experience.filter((item) => item.title !== "degree").map((item) => ({
      name: m[item.organization],
      position: m[item.title],
      ...periods[item.title],
      summary: m[item.text],
    })),
    education: experience.filter((item) => item.title === "degree").map((item) => ({
      institution: m[item.organization],
      area: m[item.title],
      studyType: locale === "en" ? "Undergraduate" : "Pregrado",
      ...periods[item.title],
    })),
    skills: stack.flat().map((group) => ({ name: m[group.label], keywords: group.tools.map(([name]) => name) })),
    languages: [
      { language: locale === "en" ? "Spanish" : "Español", fluency: locale === "en" ? "Native" : "Nativo" },
      { language: locale === "en" ? "English" : "Inglés" },
      { language: locale === "en" ? "French" : "Francés" },
    ],
    projects: rankedFeaturedProjects.map((project) => ({
      name: project.name,
      description: m[project.description],
      url: project.href,
      keywords: stackList(project.stack),
      type: m[project.kind],
    })),
    meta: { canonical: absolute(locale === "en" ? "/resume.json" : "/es/resume.json"), language: locale, lastModified: buildDate },
  };
}

const serializeRepository = ({ name, surface, url, role, programmingLanguage }: Repository) => ({
  name, surface, url, role, ...(programmingLanguage ? { programmingLanguage } : {}),
});

/** projects.json: the ranked bilingual atlas. Previously published entries keep their id and facts. */
export function projectsJson(studies: CaseStudies) {
  const published: Readonly<Record<string, (typeof publishedFeedEntries)[keyof typeof publishedFeedEntries]>> = publishedFeedEntries;
  return {
    owner: { name: siteName, github: contact.github, site: `${site}/` },
    allRepositories: contact.projects,
    projects: atlasProjects.map((project) => {
      const entry = published[project.slug];
      return {
        id: entry?.id ?? project.slug,
        name: project.name,
        description: entry?.description ?? project.purpose,
        kind: entry?.kind ?? project.surfaceLabel,
        categories: entry?.categories ?? projectSurfaces(project).map((surface) => surface === "tool" ? "cli" : surface),
        repositories: project.repositories.map(serializeRepository),
        stack: entry?.stack ?? project.stack,
        url: entry?.url ?? primaryRepository(project).url,
        live: entry?.live ?? false,
        ...(studies.has(project.slug) ? { caseStudy: absolute(caseStudyPath("en", project.slug)) } : {}),
      };
    }),
  };
}
