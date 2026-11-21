# Design system: diegnghtmr portfolio

Source of truth: `docs/PRD.md` section 4.1 and `docs/research/04-gentleman-kanagawa-palette.md` (values computed from Gentleman Kanagawa Blur, MIT). Rules: `docs/reference/DESIGN-dither-layer.md`. Not extracted from code: the project has no source yet.

## Colors (dark, default)

| Token | Value | Usage | Source |
|---|---|---|---|
| `--surface` | `#06080F` | Page canvas | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--raised` | `#1C212C` | Cards, panels | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--text` | `#F3F6F9` | Primary text, 18.45:1 | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--subtle` | `#A3B5C1` | Secondary text, 9.46:1 | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--muted` | `#8A8FA3` | Captions, annotations, 6.23:1 | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--ink` | `#7FB4CA` | Dither ink, links, 8.84:1 | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--mid` | `#27345C` | Dither mid ink, texture only | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--whisper` | `#191E28` | Whisper ink, 1.19:1 | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--highlight` | `#CB7C94` | Dither highlight, one per field | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--gold` | `#E0C15A` | Focus, active borders, primary CTA fill | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--gold-text` | `#E0C15A` | Gold as text, 11.38:1 | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--on-gold` | `#06080F` | Text on gold, 11.38:1 | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--selection` | `#263356` | Text selection | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--hair` | `#1C212C` | Dividers, decoration only | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--control` | `#5C6170` | Control boundaries | `docs/research/04-gentleman-kanagawa-palette.md` |

## Colors (light, derived)

| Token | Value | Usage | Source |
|---|---|---|---|
| `--surface` | `#F3F6F9` | Page canvas | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--raised` | `#FFFFFF` | Cards, panels | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--text` | `#06080F` | Primary text, 18.45:1 | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--subtle` | `#4E5362` | Secondary text, 7.07:1 | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--muted` | `#6A6E82` | Captions, 4.64:1; never on whisper | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--ink` | `#24596C` | Dither ink, links, 7.11:1 | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--mid` | `#91C7DD` | Dither mid ink, texture only | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--whisper` | `#E2E6F2` | Whisper ink, 1.15:1 | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--highlight` | `#BF7189` | Dither highlight, texture only | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--gold` | `#E0C15A` | Primary CTA fill, focus | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--gold-text` | `#866D01` | Gold as text, 4.60:1 | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--on-gold` | `#06080F` | Text on gold, 11.38:1 | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--selection` | `#C9DCE6` | Text selection | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--hair` | `#DCE1EA` | Dividers, decoration only | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--control` | `#6A6E82` | Control boundaries | `docs/research/04-gentleman-kanagawa-palette.md` |

## Category accents

| Token | Value | Light value | Source |
|---|---|---|---|
| `--cat-web` | `#7FB4CA` | `#43778B` | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--cat-api` | `#B7CC85` | `#667833` | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--cat-mcp` | `#B99BF2` | `#7F61B3` | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--cat-infra` | `#DEBA87` | `#8C6B39` | `docs/research/04-gentleman-kanagawa-palette.md` |
| `--cat-data` | `#CB7C94` | `#A45870` | `docs/research/04-gentleman-kanagawa-palette.md` |

## Typography

| Token | Value | Usage | Source |
|---|---|---|---|
| `--sans` | `system-ui stack` | Everything people read (production font to confirm: Host Grotesk or Schibsted Grotesk) | `docs/PRD.md` |
| `--mono` | `Iosevka Term, ui-monospace stack` | Effect annotations, repo names, versions only | `docs/PRD.md` |
| `display` | `56px / 600 / 1.05 / -0.02em` | Hero and case-study titles | `docs/reference/DESIGN-dither-layer.md` |
| `headline` | `28px / 600 / 1.2` | Section titles | `docs/reference/DESIGN-dither-layer.md` |
| `body` | `16px / 400 / 1.55` | Body copy | `docs/reference/DESIGN-dither-layer.md` |
| `annotation` | `12px / 500 / 1.3 mono` | Effect annotations | `docs/reference/DESIGN-dither-layer.md` |

## Spacing and radius

| Token | Value | Usage | Source |
|---|---|---|---|
| `--unit` | `8px` | Grid | `docs/reference/DESIGN-dither-layer.md` |
| `--container` | `1200px` | Max content width | `docs/reference/DESIGN-dither-layer.md` |
| `--r` | `6px` | Cards, buttons | `docs/reference/DESIGN-dither-layer.md` |
| `--r-sm` | `2px` | Inputs, plates, status chips | `docs/reference/DESIGN-dither-layer.md` |
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | Entrances, press feedback | `docs/PRD.md` section 8 |

## Component rules

- Flat: no shadows. Hierarchy from surface tone, hairlines and spacing.
- Primary button: gold fill, dark text; hover inverts to text colour. Press scales to 0.97.
- Focus: 2px gold outline, offset 2px, on every interactive element.
- Nav, command menu and drawers: 82 to 95 percent surface plus 20px backdrop blur; opaque fallback.
- Dither: Statement only in the hero art zone and section bands, Documentary in image boxes, Whisper behind maps; never under text, controls, numbers or code. Every field carries a mono effect annotation.
- Category accents always come with a label or glyph, never colour alone.
- Shadows: none.
