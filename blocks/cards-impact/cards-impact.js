import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Classifies a tile by its content:
 * - feature: heading, no image (large lead tile)
 * - story:   heading + image (tall photo tile)
 * - stat:    no heading (icon + number + label)
 * @param {HTMLLIElement} li
 * @returns {'feature'|'story'|'stat'}
 */
function tileType(li) {
  const hasHeading = li.querySelector('h1, h2, h3, h4, h5, h6');
  const hasImage = li.querySelector('picture');
  if (hasHeading && hasImage) return 'story';
  if (hasHeading) return 'feature';
  return 'stat';
}

/**
 * Wraps a trailing symbol (e.g. the "+" in "3.3M+") in a <sup>.
 * @param {HTMLElement} el The stat value element
 */
function decorateValue(el) {
  if (el.children.length) return;
  const match = el.textContent.trim().match(/^(.*\d.*?)([+*†]+)$/);
  if (!match) return;
  const [, value, symbol] = match;
  const sup = document.createElement('sup');
  sup.textContent = symbol;
  el.textContent = value;
  el.append(sup);
}

/**
 * Marks paragraphs containing only a link.
 * @param {HTMLElement} body The card body
 * @param {string} className Class to apply
 */
function markLinks(body, className) {
  body.querySelectorAll(':scope > p').forEach((p) => {
    const a = p.querySelector(':scope > a');
    if (a && p.children.length === 1 && p.textContent.trim() === a.textContent.trim()) {
      p.classList.add(className);
    }
  });
}

/**
 * loads and decorates the cards-impact block
 * Contract: N rows, 2 cells — [image (optional) | rich text]
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.querySelector('picture') && !div.textContent.trim()) {
        div.className = 'cards-impact-card-image';
      } else if (!div.textContent.trim() && !div.children.length) {
        div.remove();
      } else {
        div.className = 'cards-impact-card-body';
      }
    });
    li.querySelectorAll('.cards-impact-card-image:empty').forEach((el) => el.remove());

    const type = tileType(li);
    li.classList.add('cards-impact-card', `cards-impact-${type}`);

    const body = li.querySelector('.cards-impact-card-body');
    const heading = body?.querySelector('h1, h2, h3, h4, h5, h6');
    const prev = heading?.previousElementSibling;
    if (prev && prev.tagName === 'P' && !prev.querySelector('a, picture')) {
      prev.classList.add('cards-impact-eyebrow');
    }
    if (body) markLinks(body, type === 'stat' ? 'cards-impact-link' : 'cards-impact-cta');
    if (type !== 'stat' && body) {
      body.querySelectorAll(':scope > p:not([class])').forEach((p) => p.classList.add('cards-impact-copy'));
    }
    if (type === 'stat' && body) {
      const first = body.querySelector(':scope > p:not(.cards-impact-link)');
      if (first) {
        first.classList.add('cards-impact-value');
        decorateValue(first);
      }
    }
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    // keep externally hosted assets and animated GIF icons as authored
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || url.pathname.endsWith('.gif')) return;
    const isStory = img.closest('.cards-impact-story');
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: isStory ? '750' : '200' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });
  block.replaceChildren(ul);
}
