/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-icon-link. Base: cards.
 * Source: https://www.medtronic.com/en-us/index.html
 *
 * Source structure (validated in block-context/cards-icon-link/source.html + instances/01.html):
 *   .careers-section .careers-jobs | .investors-section .investors-icons
 *     a[href] > img[alt] + text label   (x3 per instance)
 *
 * Each tile anchor holds only inline content (img + text) - there is no inner
 * block wrapper to key on, and every tile has a distinct href (so html2md's
 * same-href inline merge cannot fold them). Iterate direct-child anchors,
 * falling back to any descendant anchor.
 *
 * Note: hero-promo runs first and moves these tile containers (original nodes)
 * to just after the hero-promo block, so this parser still finds them.
 *
 * UE model (cards-icon-link-card): image (+imageAlt collapsed), text.
 * Output: one row per tile, 2 columns [icon | link].
 */
function hinted(document, field, nodes) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  nodes.forEach((n) => frag.appendChild(n));
  return frag;
}

export default function parse(element, { document }) {
  let tiles = [...element.querySelectorAll(':scope > a[href]')];
  if (!tiles.length) tiles = [...element.querySelectorAll('a[href]')];

  const cells = [];
  tiles.forEach((tile) => {
    const img = tile.querySelector('img');
    const label = tile.textContent.replace(/\s+/g, ' ').trim()
      || (img && img.getAttribute('alt')) || '';
    const href = tile.href || tile.getAttribute('href');
    if (!href && !label) return;

    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label || href;
    p.appendChild(a);

    // SVG icons become project icon tokens (/icons/<name>.svg) inside the
    // richtext field; raster icons stay in the image (DAM reference) field.
    const textNodes = [];
    let icon = null;
    if (img) {
      const src = img.getAttribute('src') || img.src || '';
      const svg = src.split('?')[0].match(/([a-z0-9-]+)\.svg$/i);
      if (svg) {
        const iconP = document.createElement('p');
        iconP.textContent = `:${svg[1].toLowerCase()}:`;
        textNodes.push(iconP);
      } else {
        icon = document.createElement('img');
        icon.src = img.src || src;
        icon.alt = img.getAttribute('alt') || '';
      }
    }
    textNodes.push(p);

    cells.push([
      icon ? hinted(document, 'image', [icon]) : '',
      hinted(document, 'text', textNodes),
    ]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Investors tiles are solid blue; Careers tiles are translucent (default)
  const name = element.matches('.investors-icons') ? 'cards-icon-link (solid)' : 'cards-icon-link';
  const block = WebImporter.Blocks.createBlock(document, { name, cells });
  element.replaceWith(block);
}
