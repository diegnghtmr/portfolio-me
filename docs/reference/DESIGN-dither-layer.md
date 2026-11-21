---
version: "alpha"
name: "Dither Layer"
description: >-
  A brand-neutral design language in which dithering is a configurable
  quantization layer, not a retro theme. The brand owns hue, type, geometry and
  layout; the layer owns palette roles, cell size, pattern family, coverage,
  placement, motion and fallback. Texture lives on bounded surfaces (art zones,
  figures, bands, empty states) and never under data, controls or body copy
  unless every ink behind the text passes on its own. Contrast is judged
  against the least favourable ink, never the average. The hex values below are
  a reference brand instance on warm paper with a pine ink; a rebrand replaces
  the primitives and keeps every rule.

colors:
  # Brand-owned primitives (generated for the reference instance; replace per brand)
  primary: "#1F4D3F"              # pine — brand ink, CTAs, the Statement field's dark ink
  on-primary: "#F4F1EA"           # 8.49:1 on primary
  secondary: "#B4472E"            # terracotta ink — the one warm accent as text
  on-secondary: "#F4F1EA"         # 4.79:1 on secondary
  surface: "#F4F1EA"              # warm paper — the canvas, never pure white
  surface-raised: "#FBFAF6"       # cards, inputs, the inner ring of focus
  on-surface: "#16181D"           # primary text — 15.74:1 on surface
  on-surface-subtle: "#4A4F57"    # secondary text — 7.30:1 on surface
  on-surface-muted: "#646973"     # captions, sources — 4.88:1 on surface; NOT on the whisper ink (4.22:1)
  hairline: "#D8D1BF"             # dividers and rules — non-text, 1.34:1, never a meaningful boundary
  control-border: "#7E796C"       # input and control boundaries — 3.84:1 on surface (SC 1.4.11)
  error: "#A13A2A"                # error text and icon — 5.90:1 on surface
  neutral-light: "#BFB8A8"        # warm grey — zero baselines, leader lines; Documentary's second tone (1.75:1)
  neutral-mid: "#9A968C"          # warm grey — a series present but not distinguished (2.61:1)
  # Chart accents — plain fills, two tiers (generated; data is never dithered)
  chart-pine: "#2F6B57"           # fill — 5.53:1 on surface; paper reads on it at 5.53:1
  chart-terracotta: "#B4472E"     # fill — 4.79:1 (= secondary)
  chart-terracotta-ink: "#9C3A24" # ink tier — 6.11:1
  chart-ochre: "#8E6118"          # fill — 4.80:1
  chart-ochre-ink: "#7A4F0F"      # ink tier — 6.30:1
  chart-blue: "#3B6BA0"           # fill — 4.90:1
  chart-blue-ink: "#2E5A88"       # ink tier — 6.34:1
  chart-plum: "#8A4F7B"           # fill — 5.34:1
  chart-plum-ink: "#7A3E6B"       # ink tier — 6.82:1
  # Dither palette roles — the effect layer. Each maps to a brand primitive.
  dither-paper: "#F4F1EA"         # light ink of every profile (= surface)
  dither-whisper: "#E7E1D3"       # Whisper profile's second ink — 1.15:1 against dither-paper
  dither-ink: "#1F4D3F"           # Statement profile's dark ink (= primary) — 8.49:1 against dither-paper
  dither-mid: "#8FA89B"           # Statement's middle ink, between paper and pine — 2.25:1 on paper
  dither-highlight: "#C2603F"     # optional fourth ink, Statement only, never more than one per field
  on-dither: "#16181D"            # text placed directly on a Whisper field — worst ink 13.62:1
  dither-plate: "#F4F1EA"         # opaque plate that carries copy across a Statement field
  on-dither-plate: "#16181D"      # 15.74:1 on the plate

typography:
  headline-display:
    fontFamily: "IBM Plex Sans"
    fontSize: 56px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -0.02em
    fontFeature: "normal"
    fontVariation: "normal"
  headline-lg:
    fontFamily: "IBM Plex Sans"
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.015em
    fontFeature: "normal"
    fontVariation: "normal"
  headline-md:
    fontFamily: "IBM Plex Sans"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.01em
    fontFeature: "normal"
    fontVariation: "normal"
  body-lg:
    fontFamily: "IBM Plex Sans"
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
    fontFeature: "normal"
    fontVariation: "normal"
  body-md:
    fontFamily: "IBM Plex Sans"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0em
    fontFeature: "normal"
    fontVariation: "normal"
  body-sm:
    fontFamily: "IBM Plex Sans"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
    fontFeature: "normal"
    fontVariation: "normal"
  label-md:
    fontFamily: "IBM Plex Sans"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.01em
    fontFeature: "normal"
    fontVariation: "normal"
  label-mono:
    fontFamily: "IBM Plex Mono"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0.08em
    fontFeature: "'tnum' 1"
    fontVariation: "normal"
  figure-lg:
    fontFamily: "IBM Plex Sans"
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: -0.02em
    fontFeature: "'tnum' 1"
    fontVariation: "normal"

rounded:
  none: 0px
  sm: 2px
  DEFAULT: 6px
  lg: 12px
  full: 9999px

spacing:
  unit: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 80px
  gutter: 24px
  margin: 32px
  container-max: 1200px
  plate-padding: 24px
  clear-zone: 24px

components:
  # Plain profile — data, controls and body copy carry no texture
  page:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
  card:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.DEFAULT}"
    padding: "{spacing.lg}"
  caption:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-subtle}"
    typography: "{typography.body-sm}"
  source-line:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.body-sm}"
  effect-annotation:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.label-mono}"
  divider:
    backgroundColor: "{colors.hairline}"
    height: 1px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.DEFAULT}"
    padding: "{spacing.md}"
  button-primary-hover:
    backgroundColor: "{colors.on-surface}"
    textColor: "{colors.surface-raised}"
    typography: "{typography.label-md}"
    rounded: "{rounded.DEFAULT}"
    padding: "{spacing.md}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.DEFAULT}"
    padding: "{spacing.md}"
  input:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm}"
  input-border:
    backgroundColor: "{colors.control-border}"
    width: 1px
  focus-ring-outer:
    backgroundColor: "{colors.on-surface}"
    width: 2px
  focus-ring-inner:
    backgroundColor: "{colors.surface-raised}"
    width: 2px
  error-message:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.error}"
    typography: "{typography.body-sm}"
  data-figure:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.figure-lg}"
  # Chart marks — solid fills with paper values inside; a series is named beside its mark in the ink tier
  chart-context-mark:
    backgroundColor: "{colors.neutral-mid}"
  chart-baseline:
    backgroundColor: "{colors.neutral-light}"
    height: 1px
  chart-mark-pine:
    backgroundColor: "{colors.chart-pine}"
    textColor: "{colors.on-primary}"
  chart-label-pine:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.label-md}"
  chart-mark-terracotta:
    backgroundColor: "{colors.chart-terracotta}"
    textColor: "{colors.on-primary}"
  chart-label-terracotta:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.chart-terracotta-ink}"
    typography: "{typography.label-md}"
  chart-mark-ochre:
    backgroundColor: "{colors.chart-ochre}"
    textColor: "{colors.on-primary}"
  chart-label-ochre:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.chart-ochre-ink}"
    typography: "{typography.label-md}"
  chart-mark-blue:
    backgroundColor: "{colors.chart-blue}"
    textColor: "{colors.on-primary}"
  chart-label-blue:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.chart-blue-ink}"
    typography: "{typography.label-md}"
  chart-mark-plum:
    backgroundColor: "{colors.chart-plum}"
    textColor: "{colors.on-primary}"
  chart-label-plum:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.chart-plum-ink}"
    typography: "{typography.label-md}"
  # Whisper profile — one component per ink, so the linter checks text against each
  whisper-field-paper:
    backgroundColor: "{colors.dither-paper}"
    textColor: "{colors.on-dither}"
    rounded: "{rounded.DEFAULT}"
    padding: "{spacing.lg}"
  whisper-field-whisper:
    backgroundColor: "{colors.dither-whisper}"
    textColor: "{colors.on-dither}"
    rounded: "{rounded.DEFAULT}"
    padding: "{spacing.lg}"
  whisper-field-subtle-text:
    backgroundColor: "{colors.dither-whisper}"
    textColor: "{colors.on-surface-subtle}"
  # Statement profile — no text on the field; copy rides a plate
  statement-field:
    backgroundColor: "{colors.dither-ink}"
    rounded: "{rounded.none}"
  statement-field-mid:
    backgroundColor: "{colors.dither-mid}"
  statement-field-highlight:
    backgroundColor: "{colors.dither-highlight}"
  statement-plate:
    backgroundColor: "{colors.dither-plate}"
    textColor: "{colors.on-dither-plate}"
    typography: "{typography.headline-lg}"
    rounded: "{rounded.sm}"
    padding: "{spacing.plate-padding}"
  # Documentary profile — the image box; captions sit outside it
  figure-documentary:
    backgroundColor: "{colors.dither-paper}"
    rounded: "{rounded.none}"
  figure-caption:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-subtle}"
    typography: "{typography.body-sm}"
---

## Overview

Dither Layer is a design language built on one claim from the research behind
it: dithering is defined by how it quantizes, not by how it looks. A tone or an
image is mapped onto a small palette, and the leftover quantization error is
arranged — by a threshold matrix (Bayer, blue noise) or by error diffusion
(Floyd–Steinberg, Atkinson) — so that the local average carries the tone. Retro
is one setting of that machine, reached with 1-bit black and white, terminal
greens and coarse Bayer grids. It is not a requirement.

The system therefore splits ownership in two:

| Owned by the brand (decided once) | Owned by the dither layer (decided per surface) |
|---|---|
| Palette hues and semantic roles | **Palette roles:** which brand colors act as `dither-paper`, `dither-ink`, `dither-whisper`, `dither-mid`, `dither-highlight` |
| Typography | **Cell size:** CSS px per cell, and how it meets device pixels |
| Geometry (`rounded`) | **Pattern family:** ordered, blue noise, error diffusion |
| Layout and spacing | **Intensity:** contrast between inks |
| Component styling | **Coverage and placement:** which surfaces may carry it, and how much |
| Imagery art direction | **Layering:** mask, plate, scrim, z-order |
| | **Motion** and its reduced-motion behavior |
| | **Fallback:** solid color, poster frame, original image |

Four traits make the effect recognizable, and they are the only invariants:

1. **A limited ink set** — two to six inks, every output pixel taken from the
   palette. That separates dithering from grain, which adds off-palette values.
2. **Tone carried by density or arrangement** that follows a source: an image,
   a gradient or a procedural field. A constant-density dot grid encodes no tone
   and is a pattern, not dithering.
3. **Hard cells on a stable integer scale**, aligned to device pixels or screen
   space, so the pattern neither blurs nor shimmers.
4. **One pattern family per surface type**, because the family is the texture:
   crosshatch, even stipple, or detail-following worms.

Everything else — hue, ink count, intensity, scale, coverage, motion — belongs
to the brand. The reference instance in the front matter is warm paper with a
pine ink and one terracotta accent: deliberately not indigo on cream or green
on black, the pairings that point back to old terminals.

**The governing rule.** Texture lives on bounded surfaces. Text, numbers,
prices, KPIs, tables, forms and charts stay plain. Where text must sit on a
field, it passes against every ink that can appear behind its glyphs.

## Colors

The palette has three layers, and components consume the semantic layer only.

**Brand primitives.** `surface` (#F4F1EA) is warm paper, never pure white.
`on-surface` (#16181D) reads at 15.74:1 on it; `on-surface-subtle` (#4A4F57) at
7.30:1; `on-surface-muted` (#646973) at 4.88:1 — enough for captions and source
lines on paper, but only 4.22:1 on the whisper ink, so muted text is never
placed on a field. `primary` (#1F4D3F, pine) carries CTAs and brand weight;
`secondary` (#B4472E, terracotta) is the single warm accent and reads at 4.79:1
on paper. `hairline` (#D8D1BF, 1.34:1) is decoration only: any boundary that
carries meaning uses `control-border` (#7E796C, 3.84:1 on paper, 3.32:1 on the
whisper ink), which satisfies SC 1.4.11.

**Chart accents.** Five accents, each shipping as a fill and a darker ink tier.
Every fill clears 4.5:1 against paper (pine 5.53, terracotta 4.79, ochre 4.80,
blue 4.90, plum 5.34), which buys two things at once: a mark is a graphical
object in its own right (SC 1.4.11), and a value printed inside it in paper
reads at the same ratio, so no label has to be pushed outside its bar. Ink
tiers name series beside their marks: pine → `primary` 8.49, terracotta 6.11,
ochre 6.30, blue 6.34, plum 6.82. The cost of fills that dark is that all five
sit within 1.15:1 of one another; two touching marks are therefore
separated by a 2 px gap of paper, never by hue alone. `neutral-mid` draws a
series that is present but not distinguished, `neutral-light` the zero
baseline. Chart colors are plain fills. Data is never dithered.

**Dither palette roles.** The effect layer never invents a color; it assigns
roles to brand colors.

| Role | Value | Measured | Profile |
|---|---|---|---|
| `dither-paper` | #F4F1EA (= surface) | — | all |
| `dither-whisper` | #E7E1D3 | 1.15:1 vs paper | Whisper |
| `dither-ink` | #1F4D3F (= primary) | 8.49:1 vs paper | Statement |
| `dither-mid` | #8FA89B | 2.25:1 vs paper, 3.76:1 vs ink | Statement |
| `dither-highlight` | #C2603F | 3.69:1 vs paper, 2.29:1 vs ink | Statement, one per field |
| `on-dither` | #16181D | 15.74 on paper, **13.62 on whisper (worst ink)** | Whisper text |
| `dither-plate` / `on-dither-plate` | #F4F1EA / #16181D | 15.74:1 | Statement copy |

**Contrast is judged against the least favourable ink.** A dithered field
contains only palette colors (plus resampling blends between them), so WCAG's
F83 worst-area procedure collapses to one rule: test text against each ink that
can appear behind its glyphs. A worked case on this palette: `on-surface` text
over a 50% Statement field of paper and pine averages to 8.79:1 in linear light,
but against the pine ink alone it is **1.85:1**. Averaging would pass text that
half its background makes illegible. Changing coverage does not help — density
moves only the average; the worst ink stays the worst ink.

WCAG's relative-luminance Note 4 says dithered colors should be averaged; F83
says to test the least contrasting area. No W3C guidance resolves the two for
*visible* patterns. This system's default: if cells are ≥ 1 CSS px and meant to
be seen, every ink counts as background (F83 reading). Averaging is allowed
only for sub-perceptual anti-banding dither that renders as one flat color, and
the reason is written down when it is used. The default cannot produce a false
pass under either reading.

All ratios in this file were computed with the WCAG 2 relative-luminance
formula and floored to two decimals, never rounded up: 4.499:1 fails 4.5:1.

## Typography

Typography is brand-owned and untouched by the effect. The reference instance
uses **IBM Plex Sans** for everything a person reads and **IBM Plex Mono** for
one job only: effect annotations — the small register that names a field's
family, cell and inks (`BAYER 8×8 · 4 PX · 2 INKS`). Annotations are the
system's honesty device; they describe the texture instead of leaving it to be
guessed, and they never sit on the texture they describe.

| Token | Size / weight / line height | Use |
|---|---|---|
| `headline-display` | 56 / 600 / 1.05, −0.02em | Hero and cover claims |
| `headline-lg` | 40 / 600 / 1.1 | Section claims, Statement plates |
| `headline-md` | 28 / 600 / 1.2 | Card and module titles |
| `body-lg` | 20 / 400 / 1.5 | Lead paragraphs |
| `body-md` | 16 / 400 / 1.55 | Body copy |
| `body-sm` | 14 / 400 / 1.5 | Captions, sources, figure captions |
| `label-md` | 14 / 600 / 1.2 | Buttons, labels |
| `label-mono` | 12 / 500 / 1.3, +0.08em, tabular | Effect annotations |
| `figure-lg` | 48 / 600 / 1.0, tabular | KPIs and figures, always on plain surface |

Glyphs are never dithered and never rendered into a canvas. All text stays in
the DOM, so it survives no-JS, no-WebGL and forced colors (a canvas-only
wordmark disappears when WebGL fails).

## Layout

An 8 px grid (`unit`), a 24 px gutter, a 32 px page margin and a 1200 px
container. Two tokens exist because of the effect:

- `plate-padding` (24 px): the minimum padding of an opaque plate that carries
  copy across a Statement field.
- `clear-zone` (24 px): the minimum distance between a field's edge and any
  text that is not on a plate. Glyph masks are dilated by this distance when
  contrast is measured.

**Cell size is deliberately not a spacing token.** It is schema-valid as a
dimension, but `spacing` is the layout scale, and every exporter would emit it
as a layout variable. Cell sizes are effect controls and live in
`## Dithering` as prose.

**Responsive containment.** Split layouts keep art and copy apart. Below the
breakpoint, the field becomes a short band above or below the copy; it never
slides under it. Reduce coverage before reducing cell size: smaller cells at
high DPR turn into invisible grain, while large cells on small screens dominate.
Contrast is re-measured at every viewport — a measured failure in the research
passed at 6.07:1 on desktop and dropped to 3.29–3.84:1 at 390 and 320 px when
the dense zone moved under body text.

## Elevation & Depth

Flat. Hierarchy comes from surface tone (`surface` vs `surface-raised`), the
hairline, and spacing — no shadows. **Texture is not elevation.** A dithered
field does not mean "raised" or "selected", and density is never the only cue
for a state (SC 1.4.1): selection, hover and error always change a shape, a
border or a label as well.

Stacking order on any textured surface is fixed: solid `background-color`
(the fallback) → texture (image, canvas or tile) → optional scrim → plate →
HTML text and controls. The solid color underneath is mandatory: declaring a
foreground without a background is itself a failure (F24).

## Shapes

Containers use `rounded.DEFAULT` (6 px) for cards and controls and `rounded.sm`
(2 px) for inputs and plates. A field may be clipped to a rounded container,
but cells themselves are always hard-edged squares; no rounding, blur or
anti-aliasing is applied to a cell. Documentary figures and full Statement
fields use `rounded.none` so the cell grid meets the edge cleanly. Dividers
and 1–2 px rules are solid lines, never dithered.

## Components

**Plain components** — `page`, `card`, `caption`, `source-line`, `input`,
`button-*`, `error-message`, `data-figure` and every `chart-*` component — never carry
texture. Forms, totals, prices, tables, axes and KPIs are read, not sensed.

**Focus** is a two-color ring: 2 px `focus-ring-outer` (#16181D) around 2 px
`focus-ring-inner` (#FBFAF6), so at least one ring contrasts with whatever sits
behind the control (technique C40). Controls sit on a solid surface, never on a
field; if a CTA must appear inside a Statement area, it sits on the plate.

**Whisper fields** (`whisper-field-paper`, `whisper-field-whisper`) are the only
textured surfaces that may carry text directly. The two components exist so
the linter checks `on-dither` against each ink: 15.74:1 and 13.62:1.
`whisper-field-subtle-text` declares that `on-surface-subtle` also passes the
worst ink (6.32:1). Muted text does not (4.22:1) and is not declared.

**Statement fields** (`statement-field`, `-mid`, `-highlight`) carry no text.
Copy crosses them only on `statement-plate`, an opaque surface with 24 px
padding (15.74:1). A ≥ 60% scrim is an alternative only when the composited ink
is recorded as a token and re-measured; an opaque plate is the default because
it cannot drift.

**Documentary figures** (`figure-documentary`) hold a pre-rendered dithered
image at an integer scale. The caption (`figure-caption`) sits on the page
surface below the image, never on it, and a real `<button>` offers
"View original".

**Effect annotations** (`effect-annotation`) name family, cell size and ink
count in `label-mono` beside or below the field.

## Do's and Don'ts

**Do**

1. Choose text color against the least favourable ink after compositing, and
   declare one component per ink so `lint` checks each pair.
2. Keep inks behind text close in luminance (Whisper, ≈1.10–1.30:1). If they
   are not, put copy on an opaque plate.
3. Paint a solid `background-color` under every texture that already passes
   contrast on its own.
4. Display dithered assets and canvases at an integer CSS-px cell with
   `image-rendering: pixelated`.
5. Confine the effect to a bounded surface and give a way back to the true
   content: a "View original" toggle, a data table, or a reveal that resolves
   to the real photo.
6. Ship dither art as indexed PNG or lossless WebP. In the research a
   640×400 Bayer 4×4 field weighed 2,274 B as PNG and 1,690 B as lossless WebP,
   against 125,548 B as lossy WebP q80.
7. Name the pattern family, cell size and working color space (linear light)
   for every dithered surface, in an effect annotation or in the spec.
8. Stop all texture animation under `prefers-reduced-motion: reduce`, and give
   any motion longer than 5 s a visible pause control.
9. Remove `url()` and canvas textures in `@media (forced-colors: active)` and
   `@media print`, and reduce or remove them under `prefers-contrast: more`.

**Don't**

1. Don't judge contrast by the average tone of a visible pattern.
2. Don't try to fix contrast by lowering density: coverage moves only the
   average.
3. Don't dither charts, maps, KPIs, numbers, tables, forms, focus indicators,
   icons under 24 px, hairlines or product photos where color drives a
   decision.
4. Don't use lossy codecs (JPEG, lossy WebP, AVIF) for dither art; they smear
   single-pixel structure and add off-palette colors.
5. Don't run error diffusion per frame: it is sequential, shimmers between
   frames, and belongs at build time or in a worker for one-off images.
6. Don't call grain, CSS radial-gradient dot grids, glyph fields or pixel type
   "dithering". They are look-alikes with their own controls.
7. Don't rely on `text-shadow` halos or `forced-color-adjust: none` to keep
   text readable over texture.
8. Don't open one WebGL context per card; share one canvas or use static
   assets.
9. Don't name an algorithm for third-party art from how it looks.
10. Don't adopt dithering as a byte-saving measure without benchmarking it
    against a lossy modern format of the original at display size: the
    evidence on file size conflicts and depends on palette, resolution and
    baseline.

## Motion

Static by default. Motion is an opt-in per surface, never a property of the
system.

| Allowed motion | Where | Rule |
|---|---|---|
| None | Everything by default | — |
| Reveal-then-resolve | Image loading, below the fold | Coarse-to-fine ordered threshold that **ends on the true image**; reduced motion shows the image immediately |
| State-bound | A micro status indicator (syncing, listening) | Mounted only during the state and disposed when idle; never the only signal — paired with a text label |
| Ambient | Statement heroes only | Ordered or blue-noise threshold at cell resolution; pausable; paused off-screen |

Under `prefers-reduced-motion: reduce`, every field renders a static poster
frame. Flash safety (SC 2.3.1): no more than three general flashes per second;
large high-contrast 1-bit fields that flip between frames are the risk, so
limit the area that changes per frame. Animated texture uses ordered or
blue-noise thresholds only — both are per-pixel and shader-friendly.

## Dithering

This section holds the effect controls. The DESIGN.md schema has no effect,
texture or pattern group, every exporter drops `components`, and so these
controls survive only as prose that implementers must read.

### Profiles

Profiles are ranges, not fixed values. A brand enables the profiles it wants
and picks values inside them.

| Control | **Plain** | **Whisper** | **Statement** | **Documentary** |
|---|---|---|---|---|
| Intent | Data, controls, reading | Quiet surface material | Hero art, posters, bands | Photos and illustrations rendered through the palette |
| Inks | 0 (solid) | 2: `dither-paper` + `dither-whisper` | 2–4: paper, ink, optional mid and highlight | 2–6 brand neutrals, e.g. `surface`, `neutral-light`, `on-surface-muted`, `on-surface` |
| Intensity (ink-to-ink) | — | ≈1.10–1.30:1 | ≥ 3:1, up to 21:1 | Set by the palette span |
| Cell (CSS px) | — | 2 or 4 | 3–6 (4 is an integer at DPR 1, 1.25, 1.5, 2, 3) | Integer display of the asset: 1 art px = n CSS px |
| Pattern family | — | Blue noise, or Bayer 8×8+ | Bayer 4×4 or 8×8 (crosshatch reads as deliberate) | Atkinson or Floyd–Steinberg, pre-rendered |
| Coverage / placement | Body, tables, forms, KPIs, charts | Bands, card backdrops, contained heroes | Art zone of a split layout, bands, posters — beside text | Inside the image box only |
| Text over it | Normal | Allowed if it passes **every** ink | Only on an opaque plate | Never; caption below |
| Motion | — | Optional ambient; static under reduced motion | Optional ambient or reveal, pausable | Static (reveal-to-original allowed) |
| Default build | CSS color | Pre-rendered tile or field; WebGL only if animated | Pre-rendered; WebGL at cell resolution if animated | Build-time pipeline per `srcset` width |
| Fallback | — | Solid `dither-whisper` (text already passes on it) | Solid `dither-mid`, plus a static frame | Original image, `alt`, solid surface |

### Cell size and device pixels

With `image-rendering: pixelated`, a 2 CSS px cell lands on 2 / 2.5 / 3 / 4 / 6
device px at DPR 1 / 1.25 / 1.5 / 2 / 3, so cells alternate 3 and 2 at 1.25. A
4 CSS px cell is an integer at all five. Use 4 when fractional DPR matters.
1 CSS px cells are reserved for sub-perceptual anti-banding. Measured in
Chromium only; Firefox and Safari remain untested. A pattern locked to screen
space stays stable as content moves; a pattern locked to an element's UV
space swims under scroll and scale.

### Implementation by use case

| Use | Approach | Truly dithers? | Notes |
|---|---|---|---|
| Editorial images, illustrations, empty states | Pre-rendered PNG-8 or lossless WebP | Yes, any family | Highest control; decode cost only; needs integer scale |
| Animated or procedural heroes | WebGL ordered or blue-noise threshold at cell resolution | Yes | Cap DPR and pixel count; static poster fallback |
| One-off user images | Error diffusion in a worker or canvas | Yes, sequential | Not for per-frame animation |
| Small decorative bands | Tiled pre-dithered PNG tile | Only if the tile is a real dithered ramp | `url()` survives forced colors — remove it explicitly |
| Grain-like tints | CSS gradients, blend modes, filters | **No — imitation** | Label it; forced colors removes non-`url()` images automatically |

Tone is computed in linear light: dithering sRGB values directly makes
gradients brighten too fast. Bayer matrices also lighten near-black areas at
small sizes; prefer 8×8 for large fields.

### Fallbacks

| Condition | Required result |
|---|---|
| No JS, no WebGL, `webglcontextlost`, image blocked | The solid `background-color` shows, and every text pair still passes |
| `forced-colors: active` | No texture behind text; canvases hidden; borders use system colors |
| `prefers-contrast: more` | Texture removed, or Whisper replaced by its solid fallback |
| `prefers-reduced-motion: reduce` | Static poster frame |
| Print | Texture behind text hidden |
| Narrow viewport (320 CSS px) | Copy on a plate or outside the field; no horizontal scroll |

### Acceptance checks

| ID | Measure | Fails when |
|---|---|---|
| F-1 Text contrast | Text vs every composited ink under a glyph mask dilated by `clear-zone`, at 1280, 390 and 320 px, ≥ 5 frames if animated | The least favourable ink is below 4.5:1 (3:1 for large text) at any viewport or frame. Never rounded |
| F-2 Focus and controls | Changed pixels after Tab vs adjacent inks | Below 3:1 against any touched ink, or the ring is not visible in the capture |
| F-3 Motion | Animated pixel share under reduced motion; pause control | Anything animates under reduced motion, or auto-plays > 5 s without pause |
| F-4 Flash | Luminance change per cell, area, frequency at ≥ 10 fps on real hardware | > 3 general flashes per second |
| F-5 Fallbacks | No-JS, no-WebGL, images blocked, forced colors | Essential content lost, or text falls below threshold |
| F-6 Narrow layout | `scrollWidth` vs `clientWidth` at 320 px; plate coverage with text spacing (1.4.12) | Horizontal scroll, or the plate no longer covers its text |
| A-1 Crispness | Distinct colors and run lengths across DPR 1–3 | Intermediate colors appear in a field, or the cell is not an integer at DPR 1 |
| A-2 Asset | Decoded palette count, format, bytes | More colors than the ink set, or a lossy codec |
| A-3 Lint | `npx @google/design.md lint DESIGN.md` | Any `contrast-ratio` warning on a field component |

### One effect, three contexts

1. **Editorial publication — Documentary.** Atkinson or Floyd–Steinberg with
   four tones from the brand neutrals, inside image boxes only, each with a
   "View original" button. Charts render plain. Captions sit on paper.
2. **Product marketing hero — Statement.** A Bayer 4×4 field in pine on
   paper, 4 px cells, confined to the art half of a split layout; below the
   breakpoint it becomes a band above the copy. Headline and CTA sit on solid
   surface. Reduced motion gets a poster frame and the hero a pause button.
3. **Checkout or analytics dashboard — Plain.** No texture. These surfaces
   carry forms, focus states, totals, product color and data. At most a static
   Whisper illustration in the empty-cart or no-data state, contained in its
   own box, with the message in plain text.

### Slides

On a fixed 1920×1080 canvas the system keeps every rule above, with one
adjustment: cells are measured in canvas pixels, and the presenter scales the
whole canvas to the screen, so device alignment cannot be guaranteed. Use
cells of at least 6 canvas px so a half-scale preview still shows ≥ 3 device
px per cell, render fields at cell resolution and upscale with
`image-rendering: pixelated`. Charts, claims, sources and page numbers stay
plain; texture appears on covers, section bands, figure plates and empty
states.

The slide type scale is derived, not declared above, because the front matter
describes web pages: claim 64 px (covers 80), method 26, series label 24,
value 26, caption and source 20, figure 96; margins 96 px and a 40 px footer
inset, all on the 8 px grid. Chart motion is off — the same stillness rule
applied to the plot.

### Provenance and limits

Rules here are synthesized from four independent research briefs (November
2026) drawing on Surma's *Ditherpunk*, Ulichney's void-and-cluster paper, the
WCAG 2.2 Recommendation with its Understanding documents and F83, MDN on
`image-rendering` and forced colors, the `google-labs-code/design.md` spec, and
public implementations (Low-tech Magazine, sheep.horse, Paper Shaders and
others) treated as evidence, not templates. Token values are generated for the
reference instance; all ratios are computed, not sampled in a browser. Open
questions carried forward: Note 4 vs F83 for visible patterns, whether SC 2.2.2
applies to decorative ambient motion, real-GPU and mobile cost, `pixelated` in
Firefox and Safari, and forced colors on real Windows hardware.
