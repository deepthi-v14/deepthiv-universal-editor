import { createOptimizedPicture, decorateIcons } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * loads and decorates the cards-icon-link block
 * Contract: N rows, 2 cells — [icon image | link]
 * The whole tile becomes one link (icon above label).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-icon-link-card';
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);

    let icon = null;
    let body = null;
    [...li.children].forEach((div) => {
      if (div.querySelector('picture') && !div.textContent.trim()) {
        div.className = 'cards-icon-link-icon';
        icon = div;
      } else if (div.textContent.trim()) {
        div.className = 'cards-icon-link-body';
        body = div;
      } else {
        div.remove();
      }
    });

    // fall back to a project icon (:icon-name:) authored in the text field.
    // The backend usually renders the token as span.icon; if it arrives as
    // literal text (e.g. static html), convert it here.
    if (body && !body.querySelector('span.icon')) {
      const token = [...body.querySelectorAll('p')]
        .find((p) => /^:[a-z0-9-]+:$/i.test(p.textContent.trim()));
      if (token) {
        const name = token.textContent.trim().slice(1, -1).toLowerCase();
        const span = document.createElement('span');
        span.className = `icon icon-${name}`;
        token.replaceChildren(span);
      }
    }
    const iconSpan = body?.querySelector('span.icon');
    if (!icon && iconSpan) {
      icon = document.createElement('div');
      icon.className = 'cards-icon-link-icon';
      icon.append(iconSpan);
    }

    const link = body?.querySelector('a[href]');
    if (link) {
      // turn the whole tile into a single link target
      const tile = document.createElement('a');
      tile.className = 'cards-icon-link-tile';
      tile.href = link.href;
      if (link.target) tile.target = link.target;
      if (link.title && link.title !== link.textContent) tile.title = link.title;
      if (icon) tile.append(icon);
      const label = document.createElement('span');
      label.className = 'cards-icon-link-label';
      label.textContent = link.textContent.trim();
      // keep the richtext cell editable in Universal Editor
      moveInstrumentation(body, label);
      moveInstrumentation(link, label);
      tile.append(label);
      li.replaceChildren(tile);
    }
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '96' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });
  decorateIcons(ul);
  ul.querySelectorAll('.cards-icon-link-icon .icon img').forEach((img) => {
    img.alt = '';
    img.width = 32;
    img.height = 32;
  });
  block.replaceChildren(ul);
}
