/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-stats. Base: columns.
 * Source: https://www.medtronic.com/en-us/index.html
 *
 * Source structure (validated in block-context/columns-stats/source.html):
 *   .who-we-are-section
 *     .left-content
 *       a.link-container > .eyebrow, h2.headline, p.copy    -> column 1 text
 *       .cta a.link--arrowed                                  -> column 1 CTA
 *     .right-content
 *       video > source[src]                                   -> video link (column 2)
 *       img.background-image-middle                           -> image (column 2)
 *       .info-bar .info-block (.large-copy + .subtext)        -> stats list (column 2)
 *       a.bottom-right-link                                   -> source link (column 2)
 *
 * Stats are emitted as <ul><li><strong>140+</strong> Active clinical trials</li>...</ul>,
 * the shape consumed by buildStat() in blocks/columns-stats/columns-stats.js.
 * Columns blocks: no field hints (xwalk hinting exception).
 * Output: 1 row x 2 columns.
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

function linkPara(document, href, label) {
  const p = document.createElement('p');
  const a = document.createElement('a');
  a.href = href;
  a.textContent = label;
  p.appendChild(a);
  return p;
}

export default function parse(element, { document }) {
  const left = element.querySelector('.left-content') || element;
  const right = element.querySelector('.right-content') || element;

  // ---- Column 1: eyebrow, heading, copy, CTA
  const textCell = [];
  const eyebrow = left.querySelector('.eyebrow');
  if (text(eyebrow)) {
    const p = document.createElement('p');
    p.textContent = text(eyebrow);
    textCell.push(p);
  }
  const heading = left.querySelector('h1, h2, h3, .headline');
  if (heading) {
    const h = document.createElement(/^H[1-6]$/.test(heading.tagName) ? heading.tagName.toLowerCase() : 'h2');
    h.textContent = text(heading);
    textCell.push(h);
  }
  left.querySelectorAll('p.copy, .link-container > p').forEach((p) => {
    if (text(p) && !textCell.some((n) => n.textContent === text(p))) {
      const np = document.createElement('p');
      np.textContent = text(p);
      textCell.push(np);
    }
  });
  const cta = left.querySelector('.cta a[href], a.link--arrowed[href]');
  if (cta) textCell.push(linkPara(document, cta.href || cta.getAttribute('href'), text(cta)));

  // ---- Column 2: image, video link, stats, source link
  const mediaCell = [];
  const image = right.querySelector('img.background-image-middle') || right.querySelector('img:not([src^="data:"])');
  if (image) mediaCell.push(image);

  const videoEl = right.querySelector('video');
  if (videoEl) {
    const src = [...videoEl.querySelectorAll('source')]
      .map((s) => s.getAttribute('src'))
      .find((s) => s && s.trim()) || videoEl.getAttribute('src');
    if (src) {
      const url = absolutize(src.trim());
      mediaCell.push(linkPara(document, url, url));
    }
  }

  const statBlocks = [...right.querySelectorAll('.info-bar .info-block, .info-block')]
    .filter((b, i, arr) => arr.indexOf(b) === i);
  if (statBlocks.length) {
    const ul = document.createElement('ul');
    statBlocks.forEach((b) => {
      const value = text(b.querySelector('.large-copy'));
      const label = text(b.querySelector('.subtext'));
      if (!value && !label) return;
      const li = document.createElement('li');
      if (value) {
        const strong = document.createElement('strong');
        strong.textContent = value.replace(/\s+(?=\+)/g, '');
        li.appendChild(strong);
      }
      if (label) li.appendChild(document.createTextNode(`${value ? ' ' : ''}${label}`));
      ul.appendChild(li);
    });
    if (ul.children.length) mediaCell.push(ul);
  }

  const sourceLink = right.querySelector('a.bottom-right-link[href]');
  if (sourceLink) mediaCell.push(linkPara(document, sourceLink.href || sourceLink.getAttribute('href'), text(sourceLink)));

  if (!textCell.length && !mediaCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[textCell.length ? textCell : '', mediaCell.length ? mediaCell : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-stats', cells });
  element.replaceWith(block);
}
