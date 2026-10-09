# cards-icon-link

Custom **cards** block. Purpose: quick-links (row of icon + label link tiles).

## Authoring

One row per tile, two cells: `[image (optional) | richtext]`. The richtext holds an
optional `:icon-name:` token (project icon from `/icons/`) and one link. The whole
tile becomes the link.

On desktop the block overlaps the bottom-right corner of the preceding block in the
same section (e.g. hero-promo).

## Supported variations

- default: translucent light-blue tiles (for photo backgrounds)
- `solid`: solid brand-blue tiles (for light backgrounds) — `Cards Icon Link (Solid)`

## Universal Editor fields

- Block: `classes` (Style: Solid)
- Item: `image`, `imageAlt`, `text`
