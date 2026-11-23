# diegnghtmr.me

Personal portfolio of **Diego Alejandro Flores Quintero**, software engineer in Armenia, Colombia.

**Live:** [diegnghtmr.me](https://diegnghtmr.me) · English and Spanish · readable by AI agents ([llms.txt](https://diegnghtmr.me/llms.txt))

## What it is

- **Dither Layer design**: images and motion rendered as ordered (Bayer 8×8) dither in the Gentleman Kanagawa palette, dark first with a derived light theme. The rules live in [`docs/reference/DESIGN-dither-layer.md`](docs/reference/DESIGN-dither-layer.md).
- **Static and fast**: Astro, vanilla TypeScript, about 4 KB of initial JavaScript. Lighthouse 98–100 on mobile.
- **Case studies**: bilingual project dossiers with evidence, decision records, and either screenshots or a terminal transcript. Unverified or missing facts are omitted.
- **Search and agents**: JSON-LD, sitemap with hreflang, `llms.txt`, a Markdown twin of every page (`Accept: text/markdown`), `resume.json` (JSON Resume) and `projects.json`.

## Stack

Astro 7 · TypeScript (strict) · Tailwind CSS 4 · [Paper Shaders](https://github.com/paper-design/shaders) for the hero · sharp + image-q for build-time dither assets · Vercel (static output plus Routing Middleware).

## Develop

Requires Node 22.23+ and pnpm 11.

```sh
pnpm install
pnpm dev            # http://localhost:4321
pnpm check          # type check
pnpm build          # static site in dist/
pnpm test:assets    # dither, OG card and favicon generators
pnpm test:site      # SEO and agent outputs (after pnpm build)
```

Generated assets are committed. Regenerate them with `pnpm dither`, `pnpm og` or `pnpm favicon`.

## Layout

| Path | Contents |
|---|---|
| `src/sections`, `src/components` | Page sections and shared components |
| `src/pages` | Localized home (`/en/`, `/es/`), work index (`/en/work/`, `/es/trabajo/`), case studies (`/en/work/<slug>/`, `/es/trabajo/<slug>/`) and machine-readable routes |
| `src/content/case-studies`, `src/content.config.ts` | Case-study source and build-time schema; a project publishes only with both `en.md` and `es.md` |
| `src/data`, `src/i18n` | Bilingual profile and project content shared by pages and agent files |
| `src/lib/profile.ts` | JSON-LD, Markdown twins, `llms.txt`, JSON Resume, `projects.json` |
| `src/scripts` | Client behavior: hero shader, cover fields, footer horizon, command menu, work filters |
| `scripts` | Asset generators and their tests |
| `middleware.js`, `vercel.json` | Markdown negotiation, headers, root locale redirect |
| `docs`, `design`, `odd` | PRD, TRD, research, design artboards and the task log |

## Case studies

Use the project slug from `src/data/projects.ts` and follow the [content contract](docs/case-studies/CONTENT-SPEC.md). The work index and featured cards keep their repository links until both locale files exist. Each published case study has an `index.md` twin; `projects.json` adds an English `caseStudy` URL without changing the repository `url`.

## Deploy

Every push to `main` deploys to production on Vercel; other branches get preview URLs.

## License

The code is released under the [MIT License](LICENSE). It does not cover the personal portrait (`assets-src/portrait.jpg` and the dithered frames made from it in `public/dither/portrait-*`) or the biographical and project text in `src/i18n` and `src/data/projects.ts`; those remain © Diego Alejandro Flores Quintero. Reuse the code freely, but please replace them with your own.

## Credits

Color palette: [Gentleman Kanagawa Blur](https://github.com/Gentleman-Programming/gentleman-kanagawa-blur) by Gentleman Programming (MIT). Blue-noise texture: CC0, see [`assets-src/LICENSES.md`](assets-src/LICENSES.md).
