/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-video. Base: hero.
 * Source: https://www.medtronic.com/en-us/index.html
 *
 * Source structure (validated in block-context/hero-video/source.html):
 *   #Header-video > section.hero-jon
 *     video.hero-jon__bg > source[src]          -> Background Video URL (field:video)
 *     button.hero-jon__pause                    -> excluded
 *     .hero-jon__card
 *       .hero-jon__text
 *         .eyebrow-container .eyebrow-content   -> eyebrow paragraph
 *         h2, p, a.cta                          -> text
 *       figure.hero-jon__media img              -> foreground image (field:image)
 *
 * Both instance selectors (#Header-video, section.hero-jon) resolve to the
 * same hero, so the parser normalises to the outermost wrapper and bails if
 * the hero was already converted.
 *
 * UE model (blocks/hero-video/_hero-video.json): video, image (+imageAlt collapsed), text.
 * Output: 1 column, 3 content rows (video, image, text).
 */
const SOURCE_ORIGIN = 'https://www.medtronic.com';

function absolutize(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return `${SOURCE_ORIGIN}${url}`;
  return url;
}

function hinted(document, field, nodes) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  nodes.forEach((n) => frag.appendChild(n));
  return frag;
}

export default function parse(element, { document }) {
  // Normalise: section.hero-jon nested in #Header-video is the same block.
  const hero = element.matches('section.hero-jon, .hero-jon')
    ? element
    : element.querySelector('section.hero-jon, .hero-jon') || element;
  const card = hero.querySelector('.hero-jon__card') || hero;

  // ---- Background video (first <source> with a non-empty src, or video[src])
  const videoEl = hero.querySelector('video.hero-jon__bg, video');
  let videoSrc = '';
  if (videoEl) {
    const src = [...videoEl.querySelectorAll('source')]
      .map((s) => s.getAttribute('src'))
      .find((s) => s && s.trim());
    videoSrc = src || videoEl.getAttribute('src') || '';
  }
  videoSrc = absolutize(videoSrc.trim());

  // ---- Foreground product image
  const image = card.querySelector('figure.hero-jon__media img, .hero-jon__media img');

  // ---- Text card
  const textRoot = card.querySelector('.hero-jon__text') || card;
  const textNodes = [];
  const eyebrowEl = textRoot.querySelector('.eyebrow-content, .eyebrow');
  if (eyebrowEl && eyebrowEl.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = eyebrowEl.textContent.trim();
    textNodes.push(p);
  }
  const heading = textRoot.querySelector('h1, h2, h3');
  if (heading) textNodes.push(heading);
  textRoot.querySelectorAll(':scope > p').forEach((p) => {
    if (p.textContent.trim()) textNodes.push(p);
  });
  const ctas = [...textRoot.querySelectorAll('a[href]')];
  ctas.forEach((a) => {
    const link = document.createElement('a');
    link.href = a.href || a.getAttribute('href');
    link.textContent = a.textContent.trim();
    const p = document.createElement('p');
    p.appendChild(link);
    textNodes.push(p);
  });

  // Empty-block guard (also covers the already-converted duplicate match)
  if (!heading && !image && !videoSrc) {
    return;
  }

  const cells = [];

  // Row 1: video URL authored as a link
  if (videoSrc) {
    const a = document.createElement('a');
    a.href = videoSrc;
    a.textContent = videoSrc;
    cells.push([hinted(document, 'video', [a])]);
  } else {
    cells.push(['']);
  }

  // Row 2: foreground image
  cells.push([image ? hinted(document, 'image', [image]) : '']);

  // Row 3: text
  cells.push([textNodes.length ? hinted(document, 'text', textNodes) : '']);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-video', cells });
  element.replaceWith(block);
}
