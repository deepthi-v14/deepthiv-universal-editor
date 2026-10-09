/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-promo. Base: hero.
 * Source: https://www.medtronic.com/en-us/index.html
 *
 * Source structure (validated in block-context/hero-promo/source.html + instances/01.html):
 *   .wrapper-careers-section > .careers-section
 *     img (decorative copy), img.careers-image[alt]    -> background image
 *     .careers-content > .eyebrow, h2, p, .cta a, .careers-links .cta a
 *     .careers-jobs                                     -> cards-icon-link (preserved)
 *   .wrapper-investors-section
 *     img                                               -> background image
 *     .investors-section > .investors-content > .eyebrow, h2, p, a.cta, .investors-links .cta a
 *     .investors-section > .investors-icons             -> cards-icon-link (preserved)
 *
 * The icon-link tiles are parsed separately by cards-icon-link. The import
 * script collects block elements up-front, so the ORIGINAL tile node is moved
 * (not cloned) to just after this block, inside a wrapper carrying its source
 * section class so both the held reference and the instance selectors
 * (.careers-section .careers-jobs / .investors-section .investors-icons) still resolve.
 *
 * UE model (hero-promo): image (+imageAlt collapsed), text.
 * Output: 1 column, 2 rows [background image] [eyebrow, h2, p, CTA, ul of secondary links].
 */
function text(el) {
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
}

function hinted(document, field, nodes) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  nodes.forEach((n) => frag.appendChild(n));
  return frag;
}

function makeLink(document, a) {
  const link = document.createElement('a');
  link.href = a.href || a.getAttribute('href');
  link.textContent = text(a);
  return link;
}

const ICON_SELECTOR = '.careers-jobs, .investors-icons';

export default function parse(element, { document }) {
  const content = element.querySelector('.careers-content, .investors-content')
    || element.querySelector('[class$="-content"]')
    || element;
  const iconTiles = [...element.querySelectorAll(ICON_SELECTOR)];

  // ---- Background image: prefer the one with alt text, outside content / icon tiles
  const candidates = [...element.querySelectorAll('img')].filter((img) => {
    const src = img.getAttribute('src') || '';
    return src && !src.startsWith('data:') && !img.closest(ICON_SELECTOR) && !content.contains(img);
  });
  let image = candidates.find((img) => (img.getAttribute('alt') || '').trim()) || candidates[0] || null;

  // Fallback: live investors section paints its background via CSS background-image
  // (cleaned.html shows it as an <img> because the scraper materialises backgrounds).
  if (!image) {
    const bgHosts = [element, ...element.querySelectorAll(':scope > div')];
    for (const host of bgHosts) {
      let bg = (host.style && host.style.backgroundImage) || '';
      if ((!bg || bg === 'none') && typeof window !== 'undefined' && window.getComputedStyle) {
        try { bg = window.getComputedStyle(host).backgroundImage || ''; } catch (e) { bg = ''; }
      }
      const m = bg && bg.match(/url\(["']?([^"')]+)["']?\)/);
      if (m && m[1] && !m[1].startsWith('data:')) {
        image = document.createElement('img');
        image.src = m[1];
        image.alt = '';
        break;
      }
    }
  }

  // ---- Text
  const textNodes = [];
  const eyebrow = content.querySelector('.eyebrow');
  if (text(eyebrow)) {
    const p = document.createElement('p');
    p.textContent = text(eyebrow);
    textNodes.push(p);
  }
  const heading = content.querySelector('h1, h2, h3');
  if (heading) {
    const h = document.createElement(heading.tagName.toLowerCase());
    h.textContent = text(heading);
    textNodes.push(h);
  }
  content.querySelectorAll(':scope > p').forEach((p) => {
    if (text(p)) {
      const np = document.createElement('p');
      np.textContent = text(p);
      textNodes.push(np);
    }
  });

  const linkGroup = content.querySelector('.careers-links, .investors-links, [class$="-links"]');
  // Primary CTA: first non-empty link outside the secondary-links group
  const primary = [...content.querySelectorAll('a[href]')]
    .find((a) => text(a) && !(linkGroup && linkGroup.contains(a)));
  if (primary) {
    const p = document.createElement('p');
    p.appendChild(makeLink(document, primary));
    textNodes.push(p);
  }
  if (linkGroup) {
    const secondary = [...linkGroup.querySelectorAll('a[href]')].filter((a) => text(a));
    if (secondary.length) {
      const ul = document.createElement('ul');
      secondary.forEach((a) => {
        const li = document.createElement('li');
        li.appendChild(makeLink(document, a));
        ul.appendChild(li);
      });
      textNodes.push(ul);
    }
  }

  if (!heading && !image && !textNodes.length) {
    return;
  }

  const cells = [
    [image ? hinted(document, 'image', [image]) : ''],
    [textNodes.length ? hinted(document, 'text', textNodes) : ''],
  ];

  // Preserve icon-link tiles for the cards-icon-link parser (placed after this block).
  const preserved = iconTiles.map((tile) => {
    const holder = document.createElement('div');
    holder.className = tile.classList.contains('careers-jobs') ? 'careers-section' : 'investors-section';
    holder.appendChild(tile);
    return holder;
  });
  if (preserved.length) element.after(...preserved);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-promo', cells });
  element.replaceWith(block);
}
