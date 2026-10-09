/* eslint-disable */
/* global WebImporter */

/**
 * Parser for carousel-news. Base: carousel.
 * Source: https://www.medtronic.com/en-us/index.html
 *
 * Source structure (validated in block-context/carousel-news/source.html):
 *   .scroller#scroller
 *     div.news-item  (x12 - last 6 are infinite-loop clones of the first 6)
 *       a[href]
 *         img                         -> media_image
 *         .news-content
 *           p.category                -> eyebrow (content_text)
 *           h3.news-title             -> linked heading (content_text)
 *
 * Iteration is keyed on the div.news-item block wrapper (not the inner <a>)
 * so html2md's inline-anchor merging cannot collapse items. Items are
 * de-duplicated by link href + heading text so loop clones are dropped.
 *
 * UE model (carousel-news-item): media_image (+media_imageAlt collapsed), content_text.
 * Output: one row per slide, 2 columns [image | text].
 */
function hinted(document, field, nodes) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  nodes.forEach((n) => frag.appendChild(n));
  return frag;
}

export default function parse(element, { document }) {
  let items = [...element.querySelectorAll(':scope > .news-item')];
  if (!items.length) items = [...element.querySelectorAll('.news-item')];

  const seen = new Set();
  const cells = [];

  items.forEach((item) => {
    const link = item.querySelector('a[href]');
    const href = link ? (link.href || link.getAttribute('href')) : '';
    const headingEl = item.querySelector('.news-title, h2, h3, h4');
    const headingText = headingEl ? headingEl.textContent.replace(/\s+/g, ' ').trim() : '';
    const key = `${href}|${headingText}`;
    if (!href && !headingText) return;
    if (seen.has(key)) return;
    seen.add(key);

    const img = item.querySelector('img');

    const textNodes = [];
    const category = item.querySelector('.category');
    if (category && category.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = category.textContent.trim();
      textNodes.push(p);
    }
    if (headingEl) {
      const h = document.createElement(/^H[1-6]$/.test(headingEl.tagName) ? headingEl.tagName.toLowerCase() : 'h3');
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.innerHTML = headingEl.innerHTML;
        h.appendChild(a);
      } else {
        h.innerHTML = headingEl.innerHTML;
      }
      textNodes.push(h);
    } else if (href) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = href;
      a.textContent = href;
      p.appendChild(a);
      textNodes.push(p);
    }

    cells.push([
      img ? hinted(document, 'media_image', [img]) : '',
      textNodes.length ? hinted(document, 'content_text', textNodes) : '',
    ]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-news', cells });
  element.replaceWith(block);
}
