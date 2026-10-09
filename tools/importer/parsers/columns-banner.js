/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-banner. Base: columns.
 * Source: https://www.medtronic.com/en-us/index.html
 *
 * Source structure (validated in block-context/columns-banner/source.html):
 *   .award-banner
 *     .award-banner__media img                         -> column 1 (image)
 *     .award-banner__text
 *       span.eyebrow, h3.headline, a.cta               -> column 2 (eyebrow, heading, CTA)
 *
 * Columns blocks: no field hints (xwalk hinting exception).
 * Output: 1 row x 2 columns [image | eyebrow, heading, CTA].
 */
function cleanLink(document, a) {
  const link = document.createElement('a');
  link.href = a.href || a.getAttribute('href');
  link.textContent = a.textContent.replace(/\s+/g, ' ').trim();
  const p = document.createElement('p');
  p.appendChild(link);
  return p;
}

export default function parse(element, { document }) {
  const media = element.querySelector('.award-banner__media') || element;
  const image = media.querySelector('img:not([src^="data:"])') || element.querySelector('img:not([src^="data:"])');

  const textRoot = element.querySelector('.award-banner__text') || element;
  const textCell = [];
  const eyebrow = textRoot.querySelector('.eyebrow');
  if (eyebrow && eyebrow.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = eyebrow.textContent.trim();
    textCell.push(p);
  }
  const heading = textRoot.querySelector('h1, h2, h3, h4, .headline');
  if (heading) {
    const h = document.createElement(/^H[1-6]$/.test(heading.tagName) ? heading.tagName : 'h3');
    h.textContent = heading.textContent.replace(/\s+/g, ' ').trim();
    textCell.push(h);
  }
  textRoot.querySelectorAll(':scope > p').forEach((p) => {
    if (p.textContent.trim()) textCell.push(p);
  });
  textRoot.querySelectorAll('a[href]').forEach((a) => textCell.push(cleanLink(document, a)));

  if (!image && !textCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[image || '', textCell.length ? textCell : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-banner', cells });
  element.replaceWith(block);
}
