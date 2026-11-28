# PRD — diegnghtmr.me (Dither Layer portfolio)

| | |
|---|---|
| Owner | Diego Alejandro Flores Quintero (`diegnghtmr`) |
| Status | v0.4 — 2026-11-21 — Gentleman Kanagawa palette; dither stack and assets defined (research/05); D2, D3, D5 decided; D4, D6 on defaults |
| Companion | [TRD.md](TRD.md) · design rules: [reference/DESIGN-dither-layer.md](reference/DESIGN-dither-layer.md) · evidence: [research/](research/) |

---

## 1. Problem

Diego has built a lot — around 8 multi-repo systems, a dozen single-repo tools, and merged contributions to `basecamp/omarchy` and `Gentleman-Programming/gentle-ai` — but none of it reads well today:

- **The domain is down.** `diegnghtmr.me`, linked from the CV, the GitHub README and LinkedIn, does not resolve DNS (checked 2026-11-21). Only `diegnghtmr.vercel.app` responds.
- **Projects are flat.** The GitHub README lists projects as rows of badges. A reviewer cannot tell that *Food Court* is five services talking to each other, that *Savia* has a web, mobile, MCP and API surface, or that *writing-harness* is a zero-dependency verifier with 93 mechanized rules.
- **Headless work is invisible.** Backends, CLIs, MCP servers and infra have no screenshot, so they lose to UI projects in every grid.
- **Agents can't read it.** There is no `llms.txt`, no markdown twin, no structured project data. An AI assistant asked "what has Diego built?" gets a guess.

## 2. Goal

One site that makes a reviewer think *"this person ships real systems and knows why they built them that way"* inside ten seconds, and that lets anyone who wants more — a tech lead, a recruiter, or an agent — drill into evidence without friction.

### Success metrics

| Metric | Target | How we measure |
|---|---|---|
| Time to first project | Featured work visible above the fold on ≥ 1280 px, first scroll on 390 px | Manual check at 1280 / 390 / 320 |
| Core Web Vitals (p75, mobile) | LCP ≤ 2.0 s · INP ≤ 150 ms · CLS ≤ 0.05 | Vercel Speed Insights (field) + Lighthouse CI (lab) |
| Lighthouse | ≥ 95 in Performance, Accessibility, Best Practices, SEO on every route | Lighthouse CI on PR |
| Accessibility | WCAG 2.2 AA; zero axe violations; F-1…F-6 checks from DESIGN rules pass | Playwright + axe, contrast script |
| Indexing | All canonical ES/EN URLs indexed within 30 days of launch | Search Console + Bing Webmaster |
| Brand query | `#1` for "Diego Alejandro Flores Quintero" and "diegnghtmr" on Google and Bing | Manual, monthly |
| Agent readability | An LLM given only `/llms.txt` answers 10 fixed questions about Diego correctly (eval set in repo) | Scripted eval |
| Engagement | Median engaged time ≥ 60 s; ≥ 25 % of sessions open a case study; CV/contact click-through tracked | Privacy-friendly analytics (no cookies) |

### Non-goals

- A blog or CMS at launch (the content model allows one later).
- A dashboard of GitHub vanity stats (stars, streaks, contribution snakes).
- Skill bars, percentages, or any self-rating.
- Runtime calls to the GitHub API from the visitor's browser.
- Re-implementing the old portfolio themes (OS, terminal, monochrome). This is a new visual world.

## 3. Audiences and their questions

| Audience | Arrives from | Has | Needs to answer |
|---|---|---|---|
| **Recruiter / talent partner** | LinkedIn, CV link, search | 30–90 s | Role? Seniority signal? Stack match? Languages? How do I contact him? |
| **Hiring manager / tech lead** | CV link, referral | 2–5 min, maybe more | What did *he* own? Which decisions did he make and why? Is the code real, tested, deployed? |
| **Freelance client** | Search, referral | 1–3 min | Has he shipped something like mine? Can I see it live? |
| **Peer / OSS maintainer** | GitHub profile | Varies | What does he contribute? Is the code readable? |
| **AI agent / answer engine** | Crawler, user's assistant, MCP client | Machine time | Facts in clean text: identity, roles, projects, stack, links, dates — without running JS |

Research note: the six-second number from the 2012 Ladders study is about *resumes*, from a small sample. GitHub's own hiring guidance assumes "a couple of minutes" per project. We design for **two passes** — a ten-second scan and an optional deep dive — instead of a magic number. See [research/03](research/03-portfolio-engagement-and-repos.md).

## 4. Design direction

**Design read:** developer portfolio for technical reviewers, in an *engineered-editorial* language — the Dither Layer system as the visual signature, plain and precise everywhere content must be read.

| Dial (design-taste-frontend) | Value | Why |
|---|---|---|
| `DESIGN_VARIANCE` | 7 | Asymmetric split hero and system maps; no centered-hero template |
| `MOTION_INTENSITY` | 5 | Purposeful: reveal-then-resolve, state feedback, one ambient field. No scroll-jacking |
| `VISUAL_DENSITY` | 4 | Enough facts per screen for engineers; air for the dither art |

### 4.1 What we take from Dither Layer, and what we change

We keep **every rule** in the reference DESIGN.md: the split between brand-owned and layer-owned decisions, the four profiles (Plain, Whisper, Statement, Documentary), worst-ink contrast, integer cells, fallbacks, motion rules and acceptance checks F-1…F-6 / A-1…A-3.

We **replace the brand primitives** (decisions L4, L5, L8): the palette and style come from **Gentleman Kanagawa Blur**, Gentleman Programming's theme (MIT), used **dark-first**, with a light theme **derived from the dark one**. Source, derivation method and every measured ratio: [research/04](research/04-gentleman-kanagawa-palette.md).

| Role | Dark (source) | Light (derived) | Measured (dark / light vs own surface) |
|---|---|---|---|
| surface | `#06080F` | `#F3F6F9` | — |
| surface-raised | `#1C212C` | `#FFFFFF` | 1.24 / 1.08 (non-text) |
| text | `#F3F6F9` | `#06080F` | 18.45 / 18.45 |
| text-subtle | `#A3B5C1` | `#4E5362` | 9.46 / 7.07 |
| text-muted | `#8A8FA3` | `#6A6E82` | 6.23 / 4.64 (light: never on whisper, 4.04) |
| dither-ink (celeste) | `#7FB4CA` | `#24596C` | 8.84 / 7.11 |
| dither-mid | `#27345C` | `#91C7DD` | 1.65 / 1.69 (texture only) |
| dither-whisper | `#191E28` | `#E2E6F2` | 1.19 / 1.15 (Whisper range 1.10–1.30) |
| dither-highlight (pink) | `#CB7C94` | `#BF7189` | 6.52 / 3.26 (texture only, one per field) |
| accent (gold) | `#E0C15A` | fill `#E0C15A`, text `#866D01` | 11.38 / 4.60 (gold text); dark text on gold fill 11.38 |

Derivation rule: the dark foreground becomes the light surface and vice versa; every accent keeps its OKLCH hue and chroma and only its lightness moves until it meets the contrast its role needs.

**Style carried from the theme** (not only colours):
- **Celeste** is the dither ink and the structural colour (links, Statement fields).
- **Gold** marks interaction: focus ring, active/selected borders, the primary CTA (dark text on a gold fill). It is the "Ray-Ban gold border" of the theme, used sparingly.
- **Blur**: the theme lives in a translucent terminal (opacity 0.95, blur 20). Nav, command palette and project drawer use `backdrop-filter: blur()` over a 95 % surface, with a solid fallback under `prefers-reduced-transparency` and when unsupported. Never over a dither field behind text.
- **Pastel syntax set as category accents** for repo surfaces in system maps and the work index (web celeste, api green, MCP/CLI purple, infra orange, data pink), always paired with a glyph and a label.

The anti-slop skills warn against "dark tech" defaults; here the brief explicitly names this theme, and the brief wins. What keeps it from reading as a generic terminal look: dither on bounded surfaces only, sans-serif reading type, gold used as an interaction signal rather than decoration, and no neon glows.

Typography (proposal, to confirm in design): a contemporary grotesk for reading (e.g. *Host Grotesk* or *Schibsted Grotesk*), and **Iosevka** (the theme's terminal font, OFL) as the mono, used **only** for effect annotations and technical facts (repo names, protocols, versions). No Inter, no serif display, no pixel fonts.

### 4.2 Where texture lives (and where it never does)

| Surface | Profile | Behavior |
|---|---|---|
| Home hero art zone | **Statement** | Ambient Bayer 8×8 field, 4 px cells, screen-locked; pauses off-screen and on tab hide; poster frame under reduced motion; pause button |
| Project cover images | **Documentary** | Pre-rendered dither (build time). *Reveal-then-resolve* to the real screenshot on hover/focus/tap and once in view; "View original" button |
| Section bands, 404, empty states | **Whisper** | Static tile, text allowed only because it passes every ink |
| System-map node backdrops | **Whisper** | Static; node labels always on solid plates |
| OG / social images, GitHub social previews | **Statement** + plate | Generated at build time from the same pipeline |
| Text, numbers, code, timelines, forms, nav, focus rings | **Plain** | Never textured |

Every textured surface carries an **effect annotation** in mono (`BAYER 8×8 · 4 PX · 2 INKS`). This is the system's honesty device and doubles as a quiet signature that a design-literate reviewer will notice.

## 5. Information architecture

```
/                     → redirects by Accept-Language to /en/ or /es/ (x-default = /en/)
/{lang}/              Home
/{lang}/work/         All projects (filterable index)
/{lang}/work/{slug}/  Case study
/{lang}/open-source/  Contributions to other people's repos
/{lang}/about/        Profile, experience, education, certifications (the CV as a page)
/{lang}/colophon/     How this site is built; the Dither Layer explained, live
/cv.pdf               → current resume-maker PDF per language
/llms.txt, /llms-full.txt, /{route}.md, /resume.json, /sitemap.xml, /robots.txt
```

### 5.1 Home — two passes

**Pass 1 — the ten-second scan (first viewport)**

1. **Split hero.** Left: name, a one-line role claim in plain language (e.g. *"I design and build software systems end to end — backends with hexagonal boundaries, typed frontends, and AI tooling that agents can use."*; final copy in content phase), location + languages, two actions: *See the work* and *Get the CV*. Right: the Statement field. Below 768 px the field becomes a short band **above** the copy, never behind it.
2. **Proof line.** Three to four *verifiable* facts as plain text, each linked to its source: e.g. "8 multi-repo systems", "Contributor to basecamp/omarchy and gentle-ai", "Java 25 · Spring Boot 4 · Go · React 19 · TypeScript". No invented metrics.

**Pass 2 — the deep dive**

3. **Selected work** — 6 featured projects (§7), each rendered by its *shape* (§6).
4. **How I work** — 3 short principles with one evidence link each (e.g. "Contract-first: OpenAPI-generated clients" → Brújula). Replaces the usual "skills" grid.
5. **Open source** — merged contributions with what changed, linked to PRs.
6. **Experience & education** — compact timeline (plain).
7. **Contact** — email (copy-to-clipboard with feedback), LinkedIn, GitHub, CV.

### 5.2 Work index

- All curated projects (~20), not all 80 repos. Coursework and scratch repos are excluded unless they prove something specific.
- Filters as **segmented controls** with counts: *Shape* (Interface · Headless · System), *Domain* (Education, AI tooling, Fintech, Health, Infra, Tools), *Stack*. Filter state lives in the URL (`?shape=system`) so it is shareable and crawlable.
- Each row shows title, one-line outcome, shape glyph, repo count, primary stack, year, status chip (`Live`, `Shipped`, `In progress`, `Archived`, `Coursework`).

### 5.3 Case study (`/work/{slug}`)

Fixed structure (evidence-backed template from research/03):

1. **Header** — title, one-sentence outcome, role, period, status, live/repo links.
2. **Shape showcase** — the module from §6 that fits this project.
3. **Problem & audience** — what needed to change, for whom.
4. **Constraints** — only those that shaped the work.
5. **Decisions** — 1–3 ADR-lite cards: context → options → choice → consequence; link the real ADR when one exists (e.g. Savia ADR-0018).
6. **Architecture** — diagram + data flow (the system map for multi-repo projects).
7. **Validation** — tests, CI, accessibility checks, real measurements with their source; *"unmeasured"* is written as such.
8. **Reflection** — limits, what I'd change.
9. **Repositories** — one row per repo with surface, stack, last activity, link.
10. **Next / previous project** navigation.

Each case study is readable in under 2 minutes at the summary level; deeper sections are collapsible (`<details>`, so content stays in the HTML for agents and search).

### 5.4 Colophon

Explains the stack, the performance budget, the AI-first endpoints, and the Dither Layer with a live, interactive specimen (pattern family, cell size, inks). It is both documentation and a demo of design-engineering skill.

## 6. Project shapes — the core of the brief

Every project is one or more repositories; every repository has a **surface**. The UI derives the presentation from data, so adding a repo never requires new layout code.

| Repo surface | Examples | Visual evidence |
|---|---|---|
| `web` | studydeck-frontend, legajo-frontend, vale | Screenshots / short muted loop (WebM/AVIF), live link |
| `mobile` | savia-mobile | Phone-frame screenshots |
| `desktop` | sigecim, double-integrals | Window screenshot |
| `api` / `service` | studydeck-backend, profundiza-uq-backend, food-court microservices | Request → response pair, endpoint list from OpenAPI, module map |
| `cli` / `harness` | writing-harness, doc-sentinel | Terminal replay (text, in DOM) |
| `protocol` (MCP) | savia-mcp, StudyDeck MCP server | JSON-RPC exchange transcript, tool list |
| `infra` / `automation` | enterprise-monitoring-stack, today | Topology diagram, pipeline/workflow graph |
| `document` | resume-maker | Output artifact preview + build pipeline |

### 6.1 Shape **Interface** (single repo with UI)

A **window** module: the dithered cover resolves to the real screenshot in view; on hover/focus the frame plays a 3–6 s muted loop if one exists. *View original*, *Open live* and *Code* actions. Mobile: tap to resolve; loops never autoplay on `Save-Data` or reduced motion.

### 6.2 Shape **Headless** (single repo, no UI)

An **instrument** module — the work made visible without faking a UI:

- **Terminal replay**: a scripted session (VHS/asciinema-style cast stored as JSON) rendered as real DOM text, typed at a fixed cadence, with play/pause and *Show all*. Agents and screen readers get the full transcript immediately.
- **Exchange**: an HTTP or JSON-RPC request/response pair with syntax highlighting, toggled between two or three representative calls.
- **Evidence strip**: test counts, rules, coverage or benchmarks — only if real, with a link to the CI run or file that proves it.
- Cover art for cards: a generative **Statement** dither seeded from the repo name (deterministic), so headless projects get a distinctive image without screenshots.

### 6.3 Shape **System** (two or more repos)

A **system map** module — the strongest differentiator of this portfolio:

- Nodes = repositories, laid out by layer (clients → edge/API → services → data/external). Node glyph = surface; UI nodes show a thumbnail, headless nodes show their instrument preview on focus.
- Edges = real integrations, labeled with the protocol (`REST · OpenAPI`, `JSON-RPC · stdio`, `JWT`, `events`, `SQL`). Data flows animate once when the map enters the view, then rest.
- Hover/focus a node → its edges highlight, others dim; click → a side panel with the repo's role, stack, my contribution, last activity and link. Fully keyboard navigable (roving tabindex), with an **equivalent list view** toggle for screen readers and small screens.
- On cards in grids, the system map collapses into a **constellation thumbnail** (static SVG) with a repo count, so a 5-repo project reads differently from a 1-repo project at a glance.
- Below 640 px the map becomes a vertical layered list with connectors.

## 7. Content inventory (from GitHub + CV, 2026-11-21)

Proposed featured six (needs confirmation, §12):

| # | Project | Shape | Repos (surface) | Why it earns a slot |
|---|---|---|---|---|
| 1 | **StudyDeck AI** | System | backend (api, Java 25/SB4, pgvector, RAG, MCP server), frontend (web, React 19) | AI engineering + hexagonal monolith + MCP — matches 2026 hiring signal |
| 2 | **Food Court** | System | user, food-court, order, traceability microservices (api), food-court-ui (web) | 5-repo microservice system; the clearest system map |
| 3 | **Brújula** | System | backend (Spring Modulith, Keycloak OIDC, Flyway), frontend (web, contract-first OpenAPI) | Real university planning domain; architecture depth |
| 4 | **Legajo** / **Neguentropía** | System | Java backend (algorithms, hexagonal) + live web frontend | Algorithms made visible: similarity, clustering, dendrograms; live demo |
| 5 | **Profundiza UQ** | System | Go backend (row-level locking, capacity), React frontend | Concurrency-correct enrollment in Go |
| 6 | **writing-harness** | Headless | Node CLI/verifier, zero deps | 16 skills, 93 mechanized rules — the headless showcase |

Rest of the index (curated): Savia (5 repos incl. web, mobile, MCP — status *In progress*), Academic Triage (live), Vale (live), RosterEdge, Saber Inverso, The Knowledge Bay, doc-sentinel, resume-maker, enterprise-monitoring-stack, NexRide, QuindioFlix, numerical-analysis-ai-hallucinations, double-integrals, competitive-programming, plus desktop Java apps grouped as *Early work*.

Open source: basecamp/omarchy, alyssaxuu/screenity, Gentleman-Programming/gentle-ai, gentleman-guardian-angel, Gentleman-Skills, nesszer/Win-CodexBar — each with the merged PR(s) and a one-line "what changed".

Excluded by decision: `open-slide`. Excluded by curation: forks, scratch repos, `prueba`, coursework without a distinct lesson, the previous portfolios.

Profile data source: CV (`resume-maker`, EN/ES PDFs) — experience (Freelance Developer 2025–; Teaching Assistant UQ 2024–2026; Virtual Assistant 2022–2025), education (UQ Systems & Computer Engineering 2023–), certifications (AWS Fundamentals, Building with the Claude API, MCP Advanced Topics, MinTIC AI Bootcamp, Dev Senior, Código Facilito), languages (ES native, EN/FR intermediate).

**Asset rule:** dither only looks good on tonal sources. Covers come from curated screenshots with real data (on 2026-11-21 three live demos showed loading skeletons or backend errors, so they must be recaptured), Diego's own portrait, or procedural shapes; library and asset choices in [research/05](research/05-dither-libraries-and-assets.md).

**Content rule:** every project claim must trace to a repo, a deploy, a PR or the CV. Copy is written per `redactar-espanol` + `spanish-writing` (ES) and the `humanizer` checks (EN); no AI-template phrasing ("passionate", "cutting-edge", "seamless").

## 8. Interaction and motion

Principles from `emil-design-eng`, `animate`, `apple-design` and the DESIGN motion table:

- **Frequency decides.** Navigation, filters and the command palette barely animate (≤ 150 ms or none). Rare moments (first hero paint, a map entering view) may delight.
- **Ease-out for entrances**, custom curves (`cubic-bezier(0.23,1,0.32,1)`), UI transitions ≤ 300 ms, `:active` press scale 0.97, nothing from `scale(0)`.
- **Interruptible**: hover states and the project drawer use springs (no bounce on UI).
- **Page transitions**: cross-document View Transitions — project card image morphs into the case-study header. Falls back to an instant navigation.
- **Micro-interactions inventory**: copy-email with confirmation label; filter counts that tick; repo node focus ring that follows the map; cursor-proximity sharpening on dither covers (cell size steps 6 → 4 → original near the pointer, desktop only, fine pointer only); command palette (`⌘K` / `Ctrl K`) to jump to any project, section or language; theme and language switches that keep scroll position.
- **Reduced motion**: every texture static, no loops, View Transitions become cross-fades or nothing, terminal replays show the full transcript.
- No smooth-scroll hijacking libraries; native scrolling only.

## 9. Responsive and HCI requirements

- Mobile first; verified at 320, 390, 768, 1024, 1280, 1536 px; no horizontal scroll at 320 px (F-6).
- Touch targets ≥ 44 × 44 px; hover-only affordances always have a tap/focus equivalent.
- `100dvh`, safe-area insets, no tap-highlight flash, inputs ≥ 16 px (mobile-native skill).
- Keyboard: visible two-color focus ring (DESIGN focus spec), skip link, logical order, `Esc` closes panels, map navigable with arrows.
- Forced colors, high contrast, print, no-JS and no-WebGL all keep every piece of content (F-5).
- Language switch maps to the equivalent page, not the home.

## 10. SEO and AI-first requirements

From [research/02](research/02-seo-and-ai-first.md). Principle: **a crawlable, fast, factual site first; agent extras where they cost little.** Nothing here "guarantees" AI citations, and the site does not claim otherwise.

**Search**
- Static HTML for every route; all content present without JS.
- Unique title/description per page and language; absolute canonicals; reciprocal `hreflang` (`en`, `es`, `x-default`).
- `sitemap.xml` with alternates; `robots.txt` pointing to it; Search Console, Bing Webmaster, IndexNow on deploy.
- JSON-LD graph with stable `@id`s: `ProfilePage` → `Person` (`sameAs`: GitHub, LinkedIn), `WebSite`, `ItemList` of projects, `CreativeWork` per project linking `SoftwareSourceCode` per repo (`codeRepository`, `programmingLanguage`), `BreadcrumbList`. Only what is visible on the page.
- Per-page OG/Twitter images generated at build time in the dither style.
- Fix the identity footprint: restore the domain, then update CV, GitHub README, LinkedIn and repo `homepage` fields to the canonical URL.

**Agents**
- `/llms.txt` (llmstxt.org format) and `/llms-full.txt` (all content in one file).
- A markdown twin for every page (`/en/work/brujula.md`), advertised with `<link rel="alternate" type="text/markdown">`; `Accept: text/markdown` negotiation on the HTML URL where the host allows it.
- `/resume.json` (JSON Resume schema) and `/projects.json` — the same content collection, machine-readable.
- `robots.txt` explicitly allows search/answer bots (`OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Claude-SearchBot`, `Claude-User`, `Bingbot`, `Googlebot`) and disallows training bots (`GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot`, `Applebot-Extended`) — decision D3. `Google-Extended` does not affect Google Search indexing.
- Phase 2: a small **read-only remote MCP server** at `https://diegnghtmr.me/mcp` (`get_profile`, `list_projects`, `get_project`, `search`), backed by the same bilingual JSON and case-study Markdown as the static site. Point configured agents at the documented Streamable HTTP URL; it is not a discovery or ranking lever and does not assume `/.well-known/mcp`.
- An eval script with 10 questions verifies an LLM answers correctly from `llms.txt` alone.

## 11. GitHub repository presentation (workstream)

The portfolio links into repos, so repos must hold up when a reviewer clicks through:

1. **Profile README** rewritten: one-paragraph intro, 6 featured projects grouped by system (not badge walls), link to the portfolio; remove streak/snake widgets.
2. **Pinned**: the 6 featured projects (for systems, pin the repo that holds the overview README).
3. **Per featured repo**: description, website, topics; dithered social preview generated by the portfolio pipeline; README in the order *purpose → demo → features → quickstart → architecture & decisions → tests → limits → license*; for system repos, an "Part of {Project}" block linking sibling repos and the case study.
4. A README template and checklist stored in this repo (`docs/templates/`).

## 12. Open decisions

| ID | Decision | Status |
|---|---|---|
| D1 | Palette | **Decided:** Gentleman Kanagawa Blur, dark-first, with a light theme derived from it (L8) |
| D2 | Featured six (§7) | **Decided:** as listed (Legajo) |
| D3 | Training crawlers | **Decided:** search/answer bots only; training bots disallowed |
| D4 | Analytics | Default: Vercel Web Analytics (cookieless) |
| D5 | Hosting | **Decided:** Vercel |
| D6 | Contact form or email-only | Default: email-only |

## 13. Release plan

| Milestone | Scope |
|---|---|
| M0 Foundations | Repo, tokens from the chosen palette, contrast script, CI budgets, content schema |
| M1 Content | Project and profile data for featured six + about, both languages |
| M2 Core site | Home, work index, case study, about, i18n, SEO, JSON-LD, AI endpoints |
| M3 Dither layer | Build-time pipeline, Documentary covers, Statement hero shader, Whisper tiles, colophon specimen |
| M4 Showcase modules | Window, instrument (terminal + exchange), system map |
| M5 Polish | Motion pass, View Transitions, command palette, audits (a11y, perf, F/A checks) |
| M6 Launch | Domain, Search Console/Bing/IndexNow, GitHub repo workstream, CV/README/LinkedIn updated |
| M7 (later) | Remote MCP server, remaining case studies, writing section |
