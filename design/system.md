# Design system: diegnghtmr portfolio

Synced from `src/styles/tokens.css` and `src/styles/global.css`. Dark is the default; `[data-theme="light"]` overrides color roles only. Values below are literal CSS declarations. The standalone boards use the declared sans stack and the system-only suffix of the mono stack (from `ui-monospace` onward); these sources declare stacks, not font files.

## Colors (dark, default)

| Token | Value | Usage | Source |
|---|---|---|---|
| `--surface` | `#06080f` | Page, solid field fallback and effect label plate | `src/styles/tokens.css` |
| `--raised` | `#1c212c` | Raised surface | `src/styles/tokens.css` |
| `--text` | `#f3f6f9` | Primary text | `src/styles/tokens.css` |
| `--subtle` | `#a3b5c1` | Section descriptions | `src/styles/tokens.css` |
| `--muted` | `#8a8fa3` | Effect labels on the solid surface | `src/styles/tokens.css` |
| `--ink` | `#7fb4ca` | Cool ink; link and button hover | `src/styles/tokens.css` |
| `--mid` | `#27345c` | Middle ink for artwork, not text | `src/styles/tokens.css` |
| `--whisper` | `#191e28` | Low-contrast surface tone | `src/styles/tokens.css` |
| `--highlight` | `#cb7c94` | Highlight ink for artwork | `src/styles/tokens.css` |
| `--gold` | `#e0c15a` | Focus outline and primary button fill | `src/styles/tokens.css` |
| `--gold-text` | `#e0c15a` | Gold foreground | `src/styles/tokens.css` |
| `--on-gold` | `#06080f` | Text on the gold fill | `src/styles/tokens.css` |
| `--selection` | `#263356` | Text selection background | `src/styles/tokens.css` |
| `--hair` | `#1c212c` | Decorative divider; not a control boundary | `src/styles/tokens.css` |
| `--control` | `#5c6170` | Control boundaries | `src/styles/tokens.css` |

## Colors (light)

| Token | Value | Usage | Source |
|---|---|---|---|
| `--surface` | `#f3f6f9` | Page, solid field fallback and effect label plate | `src/styles/tokens.css` |
| `--raised` | `#ffffff` | Raised surface | `src/styles/tokens.css` |
| `--text` | `#06080f` | Primary text | `src/styles/tokens.css` |
| `--subtle` | `#4e5362` | Section descriptions | `src/styles/tokens.css` |
| `--muted` | `#6a6e82` | Effect labels on the solid surface | `src/styles/tokens.css` |
| `--ink` | `#24596c` | Cool ink; link and button hover | `src/styles/tokens.css` |
| `--mid` | `#91c7dd` | Middle ink for artwork, not text | `src/styles/tokens.css` |
| `--whisper` | `#e2e6f2` | Low-contrast surface tone | `src/styles/tokens.css` |
| `--highlight` | `#bf7189` | Highlight ink for artwork | `src/styles/tokens.css` |
| `--gold` | `#e0c15a` | Fixed gold fill and source focus outline | `src/styles/tokens.css` |
| `--gold-text` | `#866d01` | Gold foreground on the light surface | `src/styles/tokens.css` |
| `--on-gold` | `#06080f` | Text on the gold fill | `src/styles/tokens.css` |
| `--selection` | `#c9dce6` | Text selection background | `src/styles/tokens.css` |
| `--hair` | `#dce1ea` | Decorative divider; not a control boundary | `src/styles/tokens.css` |
| `--control` | `#6a6e82` | Control boundaries | `src/styles/tokens.css` |

## Category accents

| Token | Value | Theme | Source |
|---|---|---|---|
| `--cat-web` | `#7fb4ca` | Dark | `src/styles/tokens.css` |
| `--cat-api` | `#b7cc85` | Dark | `src/styles/tokens.css` |
| `--cat-mcp` | `#b99bf2` | Dark | `src/styles/tokens.css` |
| `--cat-infra` | `#deba87` | Dark | `src/styles/tokens.css` |
| `--cat-data` | `#cb7c94` | Dark | `src/styles/tokens.css` |
| `--cat-web` | `#43778b` | Light | `src/styles/tokens.css` |
| `--cat-api` | `#667833` | Light | `src/styles/tokens.css` |
| `--cat-mcp` | `#7f61b3` | Light | `src/styles/tokens.css` |
| `--cat-infra` | `#8c6b39` | Light | `src/styles/tokens.css` |
| `--cat-data` | `#a45870` | Light | `src/styles/tokens.css` |

## Typography

| Token or rule | Value | Usage | Source |
|---|---|---|---|
| `--sans` | `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | Body, headings, buttons | `src/styles/tokens.css` |
| `--mono` | `"Iosevka Term", "Iosevka", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` | Effect labels | `src/styles/tokens.css` |
| `body` | `400 16px/1.55 var(--sans)` | Body type | `src/styles/global.css` |
| `h1` | `600 clamp(2rem, 5vw, 3.5rem) / 1.05 var(--sans)` | Display type; tracking `-0.02em` | `src/styles/global.css` |
| `.section-head h2` | `28px` | Section title; weight `600`, line height `1.2`, tracking `-.01em` | `src/styles/global.css` |
| `.home-button` | `600 14px/1 var(--sans)` | Button label | `src/styles/global.css` |
| `.effect-label` | `500 11px/1.3 var(--mono)` | Effect annotation | `src/styles/global.css` |

## Spacing and layout

| Token or rule | Value | Usage | Source |
|---|---|---|---|
| `--unit` | `8px` | Base spacing unit | `src/styles/tokens.css` |
| `--container` | `1200px` | Maximum `.wrap` width | `src/styles/tokens.css` |
| `.wrap` | `calc(var(--unit) * 4)` | Inline padding; `calc(var(--unit) * 2.5)` at `max-width: 640px` | `src/styles/global.css` |
| `.section-head` | `96px 28px` | Block margins; start reduces to `72px` at `max-width: 900px`; inner gap `4px` | `src/styles/global.css` |
| `#main` and section/card anchors inside it | `84px` | Scroll margin at block start | `src/styles/global.css` |

## Radius

| Token | Value | Usage | Source |
|---|---|---|---|
| `--r` | `6px` | Panel alias, skip link and home button | `src/styles/tokens.css` |
| `--r-sm` | `6px` | Control alias and effect label; same size as `--r` | `src/styles/tokens.css` |

## Motion

| Token | Value | Usage | Source |
|---|---|---|---|
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | Interface easing | `src/styles/tokens.css` |

Smooth scrolling, reveals and button feedback are defined in `src/styles/global.css`. Reduced motion switches scrolling to `auto`, disables transitions and animations, and removes the press and link-arrow transforms.

## Shadows

No shadow values are declared in `src/styles/tokens.css` or `src/styles/global.css`. The shared components demonstrated on the board are flat.

## Tailwind aliases

| Token | Value | Usage | Source |
|---|---|---|---|
| `--color-surface` | `var(--surface)` | Page surface | `src/styles/tokens.css` |
| `--color-raised` | `var(--raised)` | Raised surface | `src/styles/tokens.css` |
| `--color-text` | `var(--text)` | Primary text | `src/styles/tokens.css` |
| `--color-subtle` | `var(--subtle)` | Secondary text | `src/styles/tokens.css` |
| `--color-muted` | `var(--muted)` | Label text | `src/styles/tokens.css` |
| `--color-ink` | `var(--ink)` | Cool ink | `src/styles/tokens.css` |
| `--color-mid` | `var(--mid)` | Middle ink | `src/styles/tokens.css` |
| `--color-whisper` | `var(--whisper)` | Low-contrast tone | `src/styles/tokens.css` |
| `--color-highlight` | `var(--highlight)` | Highlight ink | `src/styles/tokens.css` |
| `--color-gold` | `var(--gold)` | Gold fill | `src/styles/tokens.css` |
| `--color-gold-text` | `var(--gold-text)` | Gold foreground | `src/styles/tokens.css` |
| `--color-on-gold` | `var(--on-gold)` | Text on gold | `src/styles/tokens.css` |
| `--color-selection` | `var(--selection)` | Selection fill | `src/styles/tokens.css` |
| `--color-hair` | `var(--hair)` | Decorative divider | `src/styles/tokens.css` |
| `--color-control` | `var(--control)` | Control border | `src/styles/tokens.css` |
| `--color-cat-web` | `var(--cat-web)` | Web accent | `src/styles/tokens.css` |
| `--color-cat-api` | `var(--cat-api)` | API accent | `src/styles/tokens.css` |
| `--color-cat-mcp` | `var(--cat-mcp)` | MCP accent | `src/styles/tokens.css` |
| `--color-cat-infra` | `var(--cat-infra)` | Infrastructure accent | `src/styles/tokens.css` |
| `--color-cat-data` | `var(--cat-data)` | Data accent | `src/styles/tokens.css` |
| `--font-sans` | `var(--sans)` | Sans utilities | `src/styles/tokens.css` |
| `--font-mono` | `var(--mono)` | Mono utilities | `src/styles/tokens.css` |
| `--spacing` | `var(--unit)` | Spacing scale | `src/styles/tokens.css` |
| `--container-page` | `var(--container)` | Page width | `src/styles/tokens.css` |
| `--radius-panel` | `var(--r)` | Panel radius | `src/styles/tokens.css` |
| `--radius-control` | `var(--r-sm)` | Control radius | `src/styles/tokens.css` |
| `--ease-interface` | `var(--ease-out)` | Interface easing | `src/styles/tokens.css` |

## Tailwind resets

| Token namespace | Value | Usage | Source |
|---|---|---|---|
| `--color-*` | `initial` | Resets built-in colors | `src/styles/tokens.css` |
| `--font-*` | `initial` | Resets built-in font families | `src/styles/tokens.css` |
| `--radius-*` | `initial` | Resets built-in radii | `src/styles/tokens.css` |
| `--ease-*` | `initial` | Resets built-in easing | `src/styles/tokens.css` |

## Component rules

| Component | Rule | Source |
|---|---|---|
| Home button | `44px` minimum height, `18px` horizontal padding, `1px solid var(--control)` border and `var(--r)` radius. Hover changes border and label to `var(--ink)`; press uses `scale(.97)` when motion is enabled. | `src/styles/global.css` |
| Primary home button | `var(--gold)` fill and `var(--on-gold)` text; hover inverts to `var(--text)` fill and `var(--surface)` text. | `src/styles/global.css` |
| Keyboard focus | Source uses a `2px solid var(--gold)` outline with `2px` offset. The system board adds an ink-colored outer backing to the sample outline in light mode so the outline has contrast on the light surface. | `src/styles/global.css` (source outline) |
| Section heading | Heading and description are grouped; description uses `var(--subtle)`. | `src/styles/global.css` |
| Dither field | Contained and clipped; solid `var(--surface)` fallback, pixelated canvas, and a solid surface behind the mono label. Hidden in forced colors and print. | `src/styles/global.css` |
