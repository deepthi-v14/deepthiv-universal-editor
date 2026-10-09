# hero-promo

Custom **hero** block. Purpose: full-bleed promo band (home page Careers / Investors).

## Authoring

Two rows, one cell each:

1. Background image
2. Text: eyebrow paragraph, heading, description, a paragraph holding only the
   primary CTA link, and a bulleted list of secondary links

`decorate()` builds `.hero-promo-background` (image) and `.hero-promo-inner` holding
`.hero-promo-content` (eyebrow `p.hero-promo-eyebrow`, `h2`, text, `p.hero-promo-cta`)
and `.hero-promo-links` (`ul.hero-promo-link-list`). Links are not buttonized; the
arrowed CTA style is block CSS.

The `cards-icon-link` block authored right after it in the same section overlaps the
bottom-right corner on desktop (that block owns the overlap). The host section
(`.hero-promo-container`) gets no section padding on desktop and 44px bottom padding
plus the scheme background on mobile, so the tiles sit on the band's colour.

## Color schemes (options)

| Class | Look |
|-------|------|
| `dark` (default) | Photo on navy `rgb(0 0 28)`, white text, light-blue arrow circles. Photo capped at 1440px on wide screens. |
| `light` | Light abstract background over `rgb(211 211 211 / 50%)`, navy heading, dark text, blue (`--brand-blue`) CTA. Wider text column (514px vs 400px). |

How the scheme is chosen, in this order:

1. **Authored option**: `Hero Promo (light)` / `Hero Promo (dark)` in document
   authoring, or the **Color scheme** select (`classes` field) in Universal Editor.
2. **Content hint** (no option set): a background image with an **empty alt**
   (decorative, abstract texture) renders `light`. A described photo renders `dark`.
   This runs synchronously, so nothing flashes.
3. **Pixel check**: when the image is same-origin (media bus / AEM assets), the left
   40% (behind the text) is sampled on load. Mean luminance above 0.6 gives `light`,
   anything else `dark`. Cross-origin images taint the canvas, so the content hint is
   kept (this is the case on localhost, where images still point at medtronic.com).

To pin the look regardless of image or alt text, set the option explicitly.

## Universal Editor fields

- `image` (reference) + `imageAlt`
- `text` (richtext)
- `classes` (select: Auto / Dark / Light). After editing `_hero-promo.json` run
  `npm run build:json` to regenerate the aggregated component files.
