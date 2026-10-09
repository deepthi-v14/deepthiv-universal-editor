import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

let carouselNewsId = 0;

/**
 * Builds one news item from an authored row: [image | category, linked heading].
 * @param {Element} row
 * @param {number} idx
 * @returns {HTMLLIElement}
 */
function createItem(row, idx) {
  const li = document.createElement('li');
  li.className = 'carousel-news-item';
  li.dataset.itemIndex = idx;
  moveInstrumentation(row, li);

  [...row.children].forEach((col) => {
    const pic = col.querySelector('picture');
    if (pic && !col.textContent.trim()) {
      col.className = 'carousel-news-item-image';
    } else {
      col.className = 'carousel-news-item-content';
      const heading = col.querySelector('h1, h2, h3, h4, h5, h6');
      const prevEl = heading?.previousElementSibling;
      if (prevEl && prevEl.tagName === 'P' && !prevEl.querySelector('a')) {
        prevEl.classList.add('carousel-news-item-category');
      }
    }
    li.append(col);
  });

  li.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '600' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });

  return li;
}

/**
 * Mouse drag-to-scroll (touch and trackpad use native scrolling).
 * Suppresses the click that ends a drag so links are not followed accidentally.
 * @param {HTMLElement} track
 */
function enableDragScroll(track) {
  let startX = 0;
  let startScroll = 0;
  let dragging = false;
  let moved = false;

  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    startScroll = track.scrollLeft;
  });

  track.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 5) {
      moved = true;
      track.classList.add('is-dragging');
      track.setPointerCapture(e.pointerId);
    }
    if (moved) track.scrollLeft = startScroll - dx;
  });

  const end = () => {
    dragging = false;
    track.classList.remove('is-dragging');
  };
  track.addEventListener('pointerup', end);
  track.addEventListener('pointercancel', end);

  track.addEventListener('click', (e) => {
    if (moved) {
      e.preventDefault();
      e.stopPropagation();
      moved = false;
    }
  }, true);

  track.addEventListener('dragstart', (e) => e.preventDefault());
}

/**
 * loads and decorates the carousel-news block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  carouselNewsId += 1;
  const id = `carousel-news-${carouselNewsId}`;
  block.id = id;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');

  const sectionHeading = block.closest('.section')?.querySelector('.default-content-wrapper h2');
  if (sectionHeading) {
    if (!sectionHeading.id) sectionHeading.id = `${id}-heading`;
    block.setAttribute('aria-labelledby', sectionHeading.id);
  }

  const rows = [...block.children];
  const track = document.createElement('ul');
  track.className = 'carousel-news-track';
  track.id = `${id}-track`;
  rows.forEach((row, idx) => track.append(createItem(row, idx)));

  enableDragScroll(track);
  block.replaceChildren(track);
}
