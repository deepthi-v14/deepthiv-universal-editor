/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-cta. Base: columns.
 * Source: https://www.medtronic.com/en-us/index.html
 *
 * Source structure (validated in block-context/columns-cta/source.html):
 *   .cta-banner > .banner-container
 *     a[href]  (wrapping link - its href is reused for the CTA)
 *       .left-section > .eyebrow, .headline (div)    -> column 1 eyebrow + heading
 *       .center-section > .copy                       -> column 1 description
 *     .right-section .cta a.link--arrowed             -> column 2 CTA
 *
 * The headline is a <div> in the source; it is promoted to <h2> because the
 * block decorate() keys the eyebrow off the first heading.
 * Columns blocks: no field hints (xwalk hinting exception).
 * Output: 1 row x 2 columns [eyebrow, heading, description | CTA link].
 */
function text(el) {
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
}

export default function parse(element, { document }) {
  const root = element.querySelector('.banner-container') || element;

  const textCell = [];
  const eyebrow = root.querySelector('.left-section .eyebrow, .eyebrow');
  if (text(eyebrow)) {
    const p = document.createElement('p');
    p.textContent = text(eyebrow);
    textCell.push(p);
  }
  const headline = root.querySelector('.left-section .headline, .headline, h2, h3');
  if (text(headline)) {
    const h = document.createElement('h2');
    h.textContent = text(headline);
    textCell.push(h);
  }
  const copy = root.querySelector('.center-section .copy, .copy');
  if (text(copy)) {
    const p = document.createElement('p');
    p.textContent = text(copy);
    textCell.push(p);
  }

  const ctaCell = [];
  const cta = root.querySelector('.right-section .cta a[href], .right-section a[href], a.link--arrowed[href]');
  const wrapLink = root.querySelector(':scope > a[href]');
  const ctaHref = cta ? (cta.href || cta.getAttribute('href')) : wrapLink && (wrapLink.href || wrapLink.getAttribute('href'));
  if (ctaHref) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = ctaHref;
    a.textContent = text(cta) || 'Learn more';
    p.appendChild(a);
    ctaCell.push(p);
  }

  if (!textCell.length && !ctaCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[textCell.length ? textCell : '', ctaCell.length ? ctaCell : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-cta', cells });
  element.replaceWith(block);
}
