import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Samples the area of the background image behind the text column (left 40%)
 * and sets the light (dark text) or dark (white text) scheme from its brightness.
 * If the image cannot be read (e.g. cross-origin) the content-based hint is kept.
 * @param {Element} block The block element
 * @param {HTMLImageElement} img The background image
 */
function detectScheme(block, img) {
  try {
    const size = 16;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, img.naturalWidth * 0.4, img.naturalHeight, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    }
    const luminance = sum / (data.length / 4) / 255;
    const light = luminance > 0.6;
    block.classList.toggle('light', light);
    block.classList.toggle('dark', !light);
  } catch (e) {
    // tainted canvas (cross-origin image) or decode failure: keep the content hint
  }
}

/**
 * loads and decorates the hero-promo block
 * Contract: row 1 — background image; row 2 — eyebrow, heading, text, CTA, list of secondary links
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const background = document.createElement('div');
  background.className = 'hero-promo-background';
  const content = document.createElement('div');
  content.className = 'hero-promo-content';
  const links = document.createElement('div');
  links.className = 'hero-promo-links';

  [...block.children].forEach((row) => {
    const cell = row.querySelector(':scope > div') || row;
    const onlyImage = cell.querySelector('picture') && !cell.textContent.trim();
    if (onlyImage && !background.children.length) {
      moveInstrumentation(row, background);
      if (cell !== row) moveInstrumentation(cell, background);
      background.append(...cell.childNodes);
    } else {
      moveInstrumentation(row, content);
      if (cell !== row) moveInstrumentation(cell, content);
      content.append(...cell.childNodes);
    }
  });

  // secondary links are authored as a list; move them to their own column
  content.querySelectorAll(':scope > ul, :scope > ol').forEach((list) => {
    list.classList.add('hero-promo-link-list');
    links.append(list);
  });

  const heading = content.querySelector('h1, h2, h3, h4, h5, h6');
  const prev = heading?.previousElementSibling;
  if (prev && prev.tagName === 'P' && !prev.querySelector('a, picture')) {
    prev.classList.add('hero-promo-eyebrow');
  }

  // primary CTA: a paragraph that holds nothing but a single link
  content.querySelectorAll(':scope > p').forEach((p) => {
    const link = p.querySelector(':scope > a');
    if (link && p.children.length === 1 && p.textContent.trim() === link.textContent.trim()) {
      p.classList.add('hero-promo-cta');
    }
  });

  background.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [
      { media: '(min-width: 900px)', width: '2000' },
      { width: '750' },
    ]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });

  const inner = document.createElement('div');
  inner.className = 'hero-promo-inner';
  inner.append(content);
  if (links.children.length) inner.append(links);

  const nodes = [];
  if (background.children.length) nodes.push(background);
  else block.classList.add('hero-promo-no-image');
  nodes.push(inner);
  block.replaceChildren(...nodes);

  // colour scheme: an authored "light" / "dark" option wins; otherwise detect it
  if (!block.classList.contains('light') && !block.classList.contains('dark')) {
    const img = background.querySelector('img');
    if (img) {
      // synchronous content hint: a decorative (empty-alt) background is an
      // abstract texture -> light; a described photo -> dark (default)
      if (!img.getAttribute('alt')?.trim()) block.classList.add('light');
      // refine from the pixels when the image is readable (same-origin)
      if (img.complete && img.naturalWidth) detectScheme(block, img);
      else img.addEventListener('load', () => detectScheme(block, img), { once: true });
    }
  }
}
