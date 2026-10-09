import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Marks the paragraph directly before the first heading as an eyebrow label.
 * @param {Element} col
 */
function markEyebrow(col) {
  const heading = col.querySelector('h1, h2, h3, h4, h5, h6');
  const prev = heading?.previousElementSibling;
  if (prev && prev.tagName === 'P' && !prev.querySelector('a, picture')) {
    prev.classList.add('columns-banner-eyebrow');
  }
}

/**
 * loads and decorates the columns-banner block
 * Contract: 1 row, 2 cells — [image | eyebrow, heading, CTA link]
 * @param {Element} block The block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('columns-banner-row');
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      const onlyImage = pic && !col.textContent.trim();
      if (onlyImage) {
        col.classList.add('columns-banner-img-col');
        col.querySelectorAll('picture > img').forEach((img) => {
          const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
          moveInstrumentation(img, optimized.querySelector('img'));
          img.closest('picture').replaceWith(optimized);
        });
      } else {
        col.classList.add('columns-banner-text-col');
        markEyebrow(col);
      }
    });
  });
}
