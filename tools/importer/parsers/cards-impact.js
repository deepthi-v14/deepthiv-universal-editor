/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-impact. Base: cards.
 * Source: https://www.medtronic.com/en-us/index.html
 *
 * Source structure (validated in block-context/cards-impact/source.html):
 *   #Our-Impact .parent  (5 direct-child tiles, iterated by block wrapper)
 *     .our-impact-card   feature: bg gradient img (decorative, no alt),
 *                        a.link-container > .eyebrow, .headline, .copy; .cta a
 *     .div2/.div3/.div4  stat: .animation-icon img, .large-copy, .subtext,
 *                        optional a.bottom-right-link-div4
 *     .access-card       story: img[alt], .content > a.link-container > .eyebrow,
 *                        .headline, .copy; .cta a
 *
 * Content model (block-generation-manifest): 5 rows
 *   [ (empty) | eyebrow, h2, p, CTA ], 3x [icon | value p, label p (+ link)],
 *   [image | eyebrow, h3, p, CTA]
 *
 * UE model (cards-impact-card): image (+imageAlt collapsed), text.
 * Output: one row per tile, 2 columns [image | text].
 */
const SOURCE_ORIGIN = 'https://www.medtronic.com';

function absolutize(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return `${SOURCE_ORIGIN}${url}`;
  return url;
}

function text(el) {
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
}

function hinted(document, field, nodes) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  nodes.forEach((n) => frag.appendChild(n));
  return frag;
}

function para(document, value) {
  const p = document.createElement('p');
  p.textContent = value;
  return p;
}

function linkPara(document, a) {
  const p = document.createElement('p');
  const link = document.createElement('a');
  link.href = absolutize(a.getAttribute('href')) || a.href;
  link.textContent = text(a);
  p.appendChild(link);
  return p;
}

export default function parse(element, { document }) {
  let tiles = [...element.querySelectorAll(':scope > div')];
  if (!tiles.length) tiles = [...element.querySelectorAll('.our-impact-card, [class^="div"], .access-card')];

  const cells = [];
  let headingCount = 0;

  tiles.forEach((tile) => {
    const textNodes = [];
    let image = null;

    const headline = tile.querySelector('.headline, h2, h3');
    if (headline) {
      // Feature / story tile
      headingCount += 1;
      const img = [...tile.querySelectorAll('img')].find((i) => !(i.getAttribute('src') || '').startsWith('data:')
        && !i.closest('.cta, a'));
      // Background gradient on the feature tile has no alt - decorative, skip it.
      if (img && img.hasAttribute('alt') && img.getAttribute('alt').trim()) image = img;

      const eyebrow = tile.querySelector('.eyebrow');
      if (text(eyebrow)) textNodes.push(para(document, text(eyebrow)));
      const h = document.createElement(headingCount === 1 ? 'h2' : 'h3');
      h.textContent = text(headline);
      textNodes.push(h);
      const copy = tile.querySelector('.copy');
      if (text(copy)) textNodes.push(para(document, text(copy)));
      const cta = tile.querySelector('.cta a[href]') || tile.querySelector('a.link-container[href]');
      if (cta) {
        const p = linkPara(document, cta);
        if (!p.textContent.trim() || cta.classList.contains('link-container')) p.querySelector('a').textContent = 'Learn more';
        textNodes.push(p);
      }
    } else {
      // Stat tile
      image = tile.querySelector('.animation-icon img') || tile.querySelector('img:not([src^="data:"])');
      const value = text(tile.querySelector('.large-copy'));
      if (value) textNodes.push(para(document, value.replace(/\s+(?=\+)/g, '')));
      const label = text(tile.querySelector('.subtext'));
      if (label) textNodes.push(para(document, label));
      tile.querySelectorAll('a[href]').forEach((a) => {
        if (text(a)) textNodes.push(linkPara(document, a));
      });
    }

    if (!image && !textNodes.length) return;
    cells.push([
      image ? hinted(document, 'image', [image]) : '',
      textNodes.length ? hinted(document, 'text', textNodes) : '',
    ]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-impact', cells });
  element.replaceWith(block);
}
