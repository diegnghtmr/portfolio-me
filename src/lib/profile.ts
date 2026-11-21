// Machine-readable views of the home content: JSON-LD, markdown twins, llms.txt,
// JSON Resume and projects.json. Everything derives from src/data/home.ts and the
// i18n messages, so the HTML page and the agent-facing files can never disagree.
import { contact, experience, openSource, principles, projects, stack } from "../data/home";
import { localePath, siteHandle, siteName, t, type Locale } from "../i18n";
import { en } from "../i18n/en";
import { es } from "../i18n/es";

export const site = "https://diegnghtmr.me";
export const buildDate = new Date().toISOString().slice(0, 10);
export const locales = ["en", "es"] as const satisfies readonly Locale[];
export const absolute = (path: string) => new URL(path, site).href;
export const markdownPath = (locale: Locale) => `${localePath(locale)}index.md`;
export const ogImagePath = (locale: Locale) => `/og/home-${locale}.png`;

const personId = `${site}/#diego`;
const websiteId = `${site}/#site`;
const stackList = (value: string) => value.split(",").map((item) => item.trim());
const repoUrl = (owner: string, repo: string) => `https://github.com/${owner}/${repo}`;
const location = { city: "Armenia", region: "Quindío", countryCode: "CO" } as const;

const repository = (name: string, surface: "api" | "web" | "cli", programmingLanguage?: string) => ({
  name,
  surface,
  url: repoUrl(siteHandle, name),
  ...(programmingLanguage ? { programmingLanguage } : {}),
});

// Repo names from the portfolio inventory in design/portfolio-home/02-engineered-index.html.
const repositories = {
  p1: [repository("studydeck-backend", "api", "Java"), repository("studydeck-frontend", "web")],
  p2: [
    repository("food-court-ui", "web"),
    repository("user-microservice", "api", "Java"),
    repository("food-court-microservice", "api", "Java"),
    repository("order-microservice", "api", "Java"),
    repository("traceability-microservice", "api", "Java"),
  ],
  p3: [repository("brujula-backend", "api", "Java"), repository("brujula-frontend", "web")],
  p4: [repository("legajo-backend", "api", "Java"), repository("legajo-frontend", "web", "TypeScript")],
  p5: [repository("profundiza-uq-backend", "api", "Go"), repository("profundiza-uq-frontend", "web")],
  p6: [repository("writing-harness", "cli", "JavaScript")],
} satisfies Record<(typeof projects)[number]["id"], ReturnType<typeof repository>[]>;

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
            hasPart: repositories[project.id].map(({ name, url, programmingLanguage }) => ({
              "@type": "SoftwareSourceCode",
              "@id": url,
              name,
              codeRepository: url,
              ...(programmingLanguage ? { programmingLanguage } : {}),
            })),
          },
        })),
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
      bullet(m("stack").split(",")[0]!, "stackLabel" in project ? m(project.stackLabel) : project.stack),
      bullet(labels.repositories, repositories[project.id].map(({ name, url }) => `[${name}](${url})`).join(", ")),
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

/** llms.txt (llmstxt.org): what the site is and where the machine-readable files live. */
export function llmsTxt() {
  return [
    `# ${siteName}`,
    "",
    `> ${en.description} Portfolio of ${siteName} (${siteHandle}), ${en.titleRole} in Armenia, Colombia.`,
    "",
    "Every page has a markdown twin: request it with `Accept: text/markdown` or add `index.md` to the page path. Content is the same in English and Spanish.",
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
    ...projects.map((project) => `- [${project.name}](${project.href}): ${en[project.description]} Stack: ${project.stack}.`),
    "",
    "## Open source",
    "",
    ...openSource.map(({ owner, repo, description }) => `- [${owner}/${repo}](${repoUrl(owner, repo)}): ${en[description]}`),
    "",
    "## Machine-readable",
    "",
    `- [resume.json](${absolute("/resume.json")}): JSON Resume, English`,
    `- [resume.json (español)](${absolute("/es/resume.json")}): JSON Resume, Spanish`,
    `- [projects.json](${absolute("/projects.json")}): selected projects with stack and repositories`,
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
    projects: projects.map((project) => ({
      name: project.name,
      description: m[project.description],
      url: project.href,
      keywords: stackList(project.stack),
      type: m[project.kind],
    })),
    meta: { canonical: absolute(locale === "en" ? "/resume.json" : "/es/resume.json"), language: locale, lastModified: buildDate },
  };
}

/** projects.json: the selected work, both languages, for agents and the future MCP server. */
export function projectsJson() {
  return {
    owner: { name: siteName, github: contact.github, site: `${site}/` },
    allRepositories: contact.projects,
    projects: projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: { en: en[project.description], es: es[project.description] },
      kind: { en: en[project.kind], es: es[project.kind] },
      categories: project.categories,
      repositories: repositories[project.id],
      stack: stackList(project.stack),
      url: project.href,
      live: "live" in project ? project.live : false,
    })),
  };
}
