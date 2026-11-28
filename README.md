# diegnghtmr.me

Personal portfolio of **Diego Alejandro Flores Quintero**, software engineer in Armenia, Colombia.

**Live:** [diegnghtmr.me](https://diegnghtmr.me) · English and Spanish · readable by AI agents ([llms.txt](https://diegnghtmr.me/llms.txt))

## What it is

- **Dither Layer design**: images and motion rendered as ordered (Bayer 8×8) dither in the Gentleman Kanagawa palette, dark first with a derived light theme. The rules live in [`docs/reference/DESIGN-dither-layer.md`](docs/reference/DESIGN-dither-layer.md).
- **Static and fast**: Astro, vanilla TypeScript, about 4 KB of initial JavaScript. Lighthouse 98–100 on mobile.
- **Case studies**: bilingual project dossiers with evidence, decision records, and either screenshots or a terminal transcript. Unverified or missing facts are omitted.
- **Search and agents**: JSON-LD, sitemap with hreflang, `llms.txt`, a Markdown twin of every page (`Accept: text/markdown`), `resume.json` (JSON Resume) and `projects.json`.

## Stack

Astro 7 · TypeScript (strict) · Tailwind CSS 4 · [Paper Shaders](https://github.com/paper-design/shaders) for the hero · sharp + image-q for build-time dither assets · Vercel (static output, Routing Middleware, and a standalone Node.js function for MCP).

## Develop

Requires Node 22.23+ and pnpm 11.

```sh
pnpm install
pnpm dev            # http://localhost:4321
pnpm check          # type check
pnpm build          # static site in dist/
pnpm test:assets    # dither, OG card and favicon generators
pnpm test:site      # SEO and agent outputs (after pnpm build)
pnpm test:mcp       # MCP over loopback HTTP, including the official SDK client (after pnpm build)
```

Generated assets are committed. Regenerate them with `pnpm dither`, `pnpm og` or `pnpm favicon`.

## Portfolio MCP

Endpoint: **`https://diegnghtmr.me/mcp`**. Configure it as a **Streamable HTTP** server in your MCP client. It is read-only, stateless, and does not require authentication. It negotiates the `2025-11-25` handshake revision, returns JSON to POST requests, and returns 405 to GET because it does not open an SSE stream.

| Tool | Arguments and result |
|---|---|
| `get_profile` | Public résumé, including experience, education, skills, and links. |
| `list_projects` | All projects in site order. Optional `stack` (technology substring) and `kind` (`web`, `api`, `cli`, or `infra`, matched against a project's repositories). |
| `get_project` | Required `slug` from `list_projects`; returns the project record and the exact Markdown twin when available. |
| `search` | Required `query`; returns project records matching all terms in the name, slug, localized description, kind, stack, or repository names. Optional `limit` (1–10, default 5). No relevance scores. |

Every tool accepts `locale: "en" | "es"` (default `en`). Search and stack matching ignore case and accents. Tool results return JSON in a text content block. Bad arguments and unknown project slugs return tool errors; requests and responses are bounded to 16 KiB and 64 KiB respectively.

Example VS Code configuration (`.vscode/mcp.json`):

```json
{
  "servers": {
    "portfolio": {
      "type": "http",
      "url": "https://diegnghtmr.me/mcp"
    }
  }
}
```

The build bundles a snapshot of the rendered résumé, project index, and case-study Markdown with the Vercel Function. Requests make no calls to the site or any other service. This interface is for explicitly configured clients, not discovery or search ranking; there is no `/.well-known/mcp` discovery endpoint.

## Layout

| Path | Contents |
|---|---|
| `src/sections`, `src/components` | Page sections and shared components |
| `src/pages` | Localized home (`/en/`, `/es/`), work index (`/en/work/`, `/es/trabajo/`), case studies (`/en/work/<slug>/`, `/es/trabajo/<slug>/`) and machine-readable routes |
| `src/content/case-studies`, `src/content.config.ts` | Case-study source and build-time schema; a project publishes only with both `en.md` and `es.md` |
| `src/data`, `src/i18n` | Bilingual profile and project content shared by pages and agent files |
| `src/lib/profile.ts` | JSON-LD, Markdown twins, `llms.txt`, JSON Resume, `projects.json` |
| `src/scripts` | Client behavior: hero shader, cover fields, footer horizon, command menu, work filters |
| `scripts` | Asset and MCP snapshot generators, plus build-output and MCP HTTP tests |
| `api/mcp.mjs` | Stateless MCP Vercel Function, using the generated snapshot |
| `middleware.js`, `vercel.json` | Markdown negotiation, headers, root locale redirect |
| `docs`, `design`, `odd` | PRD, TRD, research, design artboards and the task log |

## Case studies

Use the project slug from `src/data/projects.ts` and follow the [content contract](docs/case-studies/CONTENT-SPEC.md). The work index and featured cards keep their repository links until both locale files exist. Each published case study has an `index.md` twin; `projects.json` adds an English `caseStudy` URL without changing the repository `url`.

## Deploy

Every push to `main` deploys to production on Vercel; other branches get preview URLs. The `vercel-build` script runs the static Astro build and generates `api/_generated/portfolio.json`. Vercel bundles that file with the function, not with the static site. Routing Middleware sends `/mcp` and `/mcp/` to the function without redirecting the client.

## License

The code is released under the [MIT License](LICENSE). It does not cover the personal portrait (`assets-src/portrait.jpg` and the dithered frames made from it in `public/dither/portrait-*`) or the biographical and project text in `src/i18n` and `src/data/projects.ts`; those remain © Diego Alejandro Flores Quintero. Reuse the code freely, but please replace them with your own.

## Credits

Color palette: [Gentleman Kanagawa Blur](https://github.com/Gentleman-Programming/gentleman-kanagawa-blur) by Gentleman Programming (MIT). Blue-noise texture: CC0, see [`assets-src/LICENSES.md`](assets-src/LICENSES.md).
