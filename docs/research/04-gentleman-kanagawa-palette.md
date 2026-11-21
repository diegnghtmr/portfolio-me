# Gentleman Kanagawa Blur — source palette and derived light theme

Retrieved 2026-11-21. Contrast: WCAG 2 relative luminance, floored to 2 decimals.

## Sources

- `Gentleman-Programming/gentleman-kanagawa-blur` (MIT), `lua/gentleman_kanagawa_blur/variant.lua`, variant `blur` (the default). Background is `none`: the editor is transparent and the terminal provides the colour.
- `Gentleman-Programming/Gentleman.Dots`, `GentlemanGhostty/config`: `background = 06080f`, `foreground = f3f6f9`, `cursor-color = e0c15a`, `selection-background = 263356`, `background-opacity = 0.95`, `background-blur-radius = 20`, font `IosevkaTerm NF`.
- README intent (author's words, translated): floral Hawaiian-shirt syntax colours, **gold borders** (his aviator Ray-Bans), **light blue** (celeste) from his eyes; "kind to your eyes for long sessions". Kanagawa base by rebelot; structure inspired by dgox16/oldworld.nvim.

## Style traits carried into the portfolio

| Trait in the theme | Portfolio translation |
|---|---|
| Near-black ink-blue canvas `#06080F` | Dark theme surface |
| Translucent window, blur 20 | Nav, command palette and drawer use `backdrop-filter: blur()` over a 95 % surface; solid fallback under `prefers-reduced-transparency` and no-support |
| Gold cursor/borders `#E0C15A` | Focus ring, active/selected borders, primary CTA fill (dark text on gold) |
| Celeste `#7FB4CA` | Dither ink (Statement), links, primary structure |
| Pastel syntax set | Repo-surface category accents in system maps (never the only cue) |
| Iosevka Term | Mono for effect annotations and technical facts |

## Dark theme — "Gentleman Kanagawa" (source values)

| Role | Hex | Origin | vs surface | vs whisper |
|---|---|---|---|---|
| surface | `#06080F` | Ghostty background | — | 1.19 |
| surface-raised | `#1C212C` | `surface0` | 1.24 | — |
| text | `#F3F6F9` | `fg` | 18.45 | 15.39 |
| text-subtle | `#A3B5C1` | `delimiter` | 9.46 | 7.90 |
| text-muted | `#8A8FA3` | `bright_black` / `fg_placeholder` | 6.23 | 5.19 |
| dither-ink | `#7FB4CA` | `blue` (celeste) | 8.84 | 7.38 |
| dither-mid | `#27345C` | `gray4` | 1.65 | — |
| dither-whisper | `#191E28` | `gray1` | 1.19 (Whisper range) | — |
| dither-highlight | `#CB7C94` | `red` (pink) | 6.52 | — |
| accent (gold) | `#E0C15A` | `accent` / cursor | 11.38 | 9.49 |
| on-accent | `#06080F` | — | 11.38 on gold | — |
| selection | `#263356` | `selection` | 1.61 | — |

Ink-to-mid inside a Statement field: 5.36:1.

## Light theme — derived from the dark one

Rule: the dark foreground becomes the light surface and vice versa; every accent keeps its OKLCH hue and chroma (gamut-clamped) and only its lightness moves until it reaches the contrast its role needs.

| Role | Hex | Derivation | vs surface | vs whisper |
|---|---|---|---|---|
| surface | `#F3F6F9` | dark `text` | — | 1.15 |
| surface-raised | `#FFFFFF` | — | 1.08 | — |
| text | `#06080F` | dark `surface` | 18.45 | 16.04 |
| text-subtle | `#4E5362` | `gray5` darkened to ≥ 7:1 | 7.07 | 6.14 |
| text-muted | `#6A6E82` | `bright_black` darkened to ≥ 4.5:1 | 4.64 | **4.04 — never on whisper** |
| dither-ink | `#24596C` | celeste, L lowered to ≥ 7:1 | 7.11 | 6.18 |
| dither-mid | `#91C7DD` | celeste at L 0.80 | 1.69 | — |
| dither-whisper | `#E2E6F2` | dark surface hue at L 0.925 | 1.15 (Whisper range) | — |
| dither-highlight | `#BF7189` | pink, ≥ 3:1 (non-text) | 3.26 | — |
| accent text (gold ink) | `#866D01` | gold darkened to ≥ 4.5:1 | 4.60 | 4.00 |
| accent fill | `#E0C15A` | unchanged | 1.62 (fill only) | — |
| on-accent | `#06080F` | — | 11.38 on gold | — |

Ink-to-mid: 4.19:1. In light mode gold is a **fill** (CTA, focus ring inner) carrying dark text, or the darkened gold ink for small text; raw gold is never text on the light surface.

## Category accents (repo surfaces)

| Category | Dark | vs `#06080F` | Light (derived) | vs `#F3F6F9` |
|---|---|---|---|---|
| web / UI | `#7FB4CA` celeste | 8.84 | `#43778B` | 4.55 |
| api / service | `#B7CC85` green | 11.42 | `#667833` | 4.50 |
| protocol (MCP) / CLI | `#B99BF2` purple | 8.60 | `#7F61B3` | 4.54 |
| infra / automation | `#DEBA87` orange | 10.93 | `#8C6B39` | 4.52 |
| data / external | `#CB7C94` pink | 6.52 | `#A45870` | 4.60 |

Values are computed by `/tmp`-free script logic to be re-implemented as `scripts/contrast.ts` in M0 (TRD §6.4).
