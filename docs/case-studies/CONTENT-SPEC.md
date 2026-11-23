# Case-study content contract

This contract governs case-study content (T29, T30) and the page template that renders it (T31). The page follows the Dossier direction (`design/case-studies/01-dossier.html`). Its decisions are shown as decision records, as in `design/case-studies/02-decision-record.html`.

## Rule zero: absent, not pending

Pages never say "to confirm", "pending", "TBD" or anything like them.

- When a fact has no evidence, its field is left out, and the template drops that row or section completely.
  - No live demo: no demo field.
  - No evidence of the role: no role field.
- Every claim must come from evidence the analyst actually saw:
  - repository files;
  - git history;
  - running the project;
  - a public URL the analyst opened.
- Inferences may appear only when the evidence makes them obvious. The analyst lists them in the report to the parent, not on the page.

## Files

Each project lives in one folder, owned by one analyst:

```
src/content/case-studies/<slug>/en.md        English (source of truth)
src/content/case-studies/<slug>/es.md        Neutral Spanish (tú / impersonal; never voseo)
src/content/case-studies/<slug>/shots/*.png  Screenshots, shared by both languages
```

`<slug>` matches `slug` in `src/data/projects.ts`. That file already provides the name, the surfaces, the stack, the repositories and their roles. Do not repeat them here unless you are correcting them; report corrections to the parent.

## Frontmatter

Fields marked optional are omitted when there is no evidence.

```yaml
project: brujula                  # slug, required
summary: >-                       # required; one sentence, <= 160 chars, what it is and for whom
  ...
role: >-                          # optional; only with git or README evidence, e.g.
  Sole developer                  #   "Sole developer" or "Backend and architecture in a team of 3"
timeframe: 2025–2026              # optional; first and last commit years across the project's repos
team: 3                           # optional; distinct human committers, or the team the README credits; only if > 1
demo:                             # optional; only if the analyst opened it and it worked
  url: https://...
  note: First load can take ~30 s while the backend wakes up.   # optional
demonstration:                    # required: exactly one kind
  kind: screenshots               # screenshots | terminal
  screenshots:                    # 3–5 items when kind = screenshots
    - src: ./shots/catalog.png    # relative to the .md file
      alt: Program catalog listing Systems Engineering and Industrial Engineering curricula
      caption: The catalog a student starts from.
  terminal:                       # when kind = terminal (CLI, library, API without UI)
    caption: Routing a request to a tone skill.
    source: run                   # run = output captured by the analyst; readme = copied verbatim
    steps:
      - command: node src/cli.ts --enrutar comunidadAfectada
        output: |-
          ...
decisions:                        # required; 2–3 entries
  - question: Where should the deployment boundary be?
    options:
      - label: Microservices
        reason: Independent deploys, but distributed-system overhead before the boundaries are known.
      - label: Modular monolith
        reason: One process; module boundaries enforced in code.
        chosen: true
    consequence: One JVM and one deploy lifecycle; modules can be split later along tested boundaries.
    evidence:                     # 1–3 links that support the decision
      - label: ADR-001
        url: https://github.com/diegnghtmr/brujula-backend/blob/main/docs/architecture/adr/ADR-001-modular-monolith-vs-microservices.md
    quote: A single Spring Boot process   # optional; verbatim from the evidence
results:                          # optional; checks that exist and that the analyst ran or saw pass in CI
  - label: Concurrency test
    detail: 25 simultaneous requests for one seat; exactly one gets it.
    url: https://github.com/...   # optional
limitations:                      # optional; stated in the repo or observed while running it
  - Production needs an /api/v1 proxy rewrite.
---
```

## Body (markdown)

The body holds exactly two sections, in this order, with these headings:

```
## Problem
## How it works
```

| Section | Length and content |
|---|---|
| Problem | 80–160 words: who has the problem and why it matters. |
| How it works | 120–250 words: architecture in prose. Name how the repositories connect (contract, HTTP clients, queues) only when the evidence shows it. |

Writing rules:

- Short paragraphs.
- No marketing adjectives.
- No metrics unless they are evidenced.

The Spanish file mirrors the English one. Spanish headings:

```
## Problema
## Cómo funciona
```

## Screenshots

- **Source:** the real app, run locally from the cloned repositories with their documented setup (Docker Compose, wrappers). Seed it with realistic data:
  - the repo's own seed or fixtures first;
  - otherwise plausible fictional records.
- **Never shown:** personal data, real emails, tokens or secrets.
- **Capture:**
  - Viewport 1440×900, device scale factor 1, PNG.
  - One screen per file, with no browser chrome.
  - Use the app's default theme; if it has a dark mode, prefer it, since the portfolio is dark-first.
- **What to capture:** the 3–5 screens that best show what the project does. Each needs a specific `alt` that describes the content, not "screenshot of the app".
- **File names:** kebab-case, describing the screen (e.g. `order-queue.png`).
- **Size:** at most 600 KB per file. If a PNG is larger, re-capture with less empty space or compress it losslessly (oxipng is not installed; sharp is available through the portfolio's node_modules).
- **When the app cannot run:** after a real, time-boxed attempt (about 45 minutes per project), choose one of two fallbacks and report the cause:
  - use `kind: terminal` with real API requests and responses (curl against the running backend), or with real CLI output;
  - drop to `kind: terminal` with commands documented in the README (`source: readme`).

## Architecture diagram (`architecture`, T33)

Every case study gets a C4 container diagram, as in `design/case-study-page/01-studydeck-ai.html`. The same frontmatter block goes in both locales: names, ids and technologies stay the same, and only `system`, `label`, `does`, `verb` and `caption` are translated.

```yaml
architecture:
  system: StudyDeck AI          # boundary label
  caption: >-                   # optional; one sentence that adds what the boxes cannot say
    The browser client is generated from the backend's OpenAPI contract.
  nodes:                        # 2–10 nodes (one per repository plus each store it owns)
    - id: frontend              # kebab-case, unique within the diagram
      kind: container           # container | store | external
      label: Web app            # short type label: Web app, API service, CLI, Worker, Data store, External dependency…
      name: studydeck-frontend  # repository name for containers; product or service name otherwise
      repo: studydeck-frontend  # optional; must be a repository of this project in src/data/projects.ts
      tech: React 19 / TypeScript   # optional; only documented technology
      does: Runs the study and review UI   # ≤ 48 chars, present tense
      col: 0                    # layout column, left to right (0–3)
      row: 0                    # layout row inside the column, top to bottom (0–4)
  edges:                        # every edge needs evidence
    - from: frontend
      to: backend
      protocol: HTTP/JSON       # optional; transport or format (HTTP/JSON, SQL, Feign, stdin/stdout, files…)
      verb: Calls via Axios     # ≤ 28 chars
      evidence: https://github.com/diegnghtmr/studydeck-frontend/blob/main/src/shared/api/client.ts   # not rendered; required
```

Rules:

- **Inside the boundary:** every repository of the project appears as a `container` with `repo` set. Add the data stores each repository owns (`store`).
- **Outside the boundary:** add `external` nodes only for systems the code really calls, such as an LLM provider, a mail server or an external API. If the code does not pin a provider, name the role, for example "Configured chat model".
- **Edges:** an edge exists only when code or configuration shows the call. Each edge links its `evidence` to a file on the default branch.
- **No-UI projects** still get a diagram: a CLI with its inputs and outputs, or an API with its stores. For a single repository with nothing to connect, use at least the container plus its store, or the external tools it calls.
- **Layout:** columns follow the direction of the requests, left to right: client → services → stores. Put externals in their own column or in the last row.

## Isolation while running projects

- **Work folders:** the parent provisions full-history clones in `.runtime/cs/<slug>/<repo>/`. That folder is gitignored and excluded from the portfolio's tsconfig. All installs, builds, logs, local env files and raw captures stay inside it.
- **Docker Compose:** always use `-p cs-<slug>`.
- **Ports:** bind host ports only inside your assigned range. Override them with environment variables or compose override files written inside `/tmp/cs/<slug>/`.
- **Cleanup:** the parent owns cleanup. When you finish:
  - stop the processes you started;
  - list every container, network, volume and image you created in your report;
  - never prune globally.
- **Secrets:** no real secrets.
  - If a feature needs a third-party API key (e.g. an LLM provider), use the repo's mock or fake provider when one exists. Otherwise capture the screens that do not need it.
  - Never read, print or copy existing env files on this machine. Only create new local env files inside `.runtime/cs/<slug>/`, from the repo's example files.
