/**
 * loads and decorates the columns-cta block
 * Contract: 1 row, 2 cells — [eyebrow, heading, description | CTA link]
 * @param {Element} block The block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('columns-cta-row');
    const cols = [...row.children];
    cols.forEach((col, idx) => {
      const hasHeading = col.querySelector('h1, h2, h3, h4, h5, h6');
      const textOnlyLinks = !hasHeading && col.querySelector('a[href]')
        && [...col.children].every((el) => el.querySelector('a[href]') || el.tagName === 'A');
      if (textOnlyLinks || (!hasHeading && idx === cols.length - 1 && cols.length > 1)) {
        col.classList.add('columns-cta-action');
      } else {
        col.classList.add('columns-cta-text');
        const prev = hasHeading?.previousElementSibling;
        if (prev && prev.tagName === 'P' && !prev.querySelector('a')) {
          prev.classList.add('columns-cta-eyebrow');
        }
      }
    });
  });
}
