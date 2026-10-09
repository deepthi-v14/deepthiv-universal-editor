const SITE_HOST = 'www.medtronic.com';

/**
 * Fetches the footer fragment: /content first (local preview), then the site root (DA/EDS).
 * @returns {Promise<HTMLElement|null>} container holding the footer sections
 */
async function fetchFooter() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  // resolve relative image paths against the fragment location
  container.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), resp.url).href;
    img.loading = 'lazy';
  });
  return container;
}

/**
 * Opens off-site links in a new window, as on the source site
 * @param {Element} root The footer content
 */
function decorateLinks(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    let url;
    try { url = new URL(a.href); } catch { return; }
    if (url.hostname === SITE_HOST || url.hostname === window.location.hostname) return;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    const name = a.textContent.trim() || a.querySelector('img')?.alt || '';
    a.setAttribute('aria-label', `${name} (opens in a new window)`);
  });
}

/**
 * Wraps the given nodes in a div with a class
 * @param {string} className The wrapper class
 * @param {Node[]} nodes The nodes to wrap
 * @returns {Element} The wrapper
 */
function wrap(className, nodes) {
  const div = document.createElement('div');
  div.className = className;
  nodes.filter(Boolean).forEach((n) => div.append(n));
  return div;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  block.textContent = '';
  if (!fragment) return;

  const [linksSrc, brandSrc, bottomSrc] = [...fragment.children];
  const footer = document.createElement('div');
  footer.className = 'footer-inner';

  // band 1: site link columns
  if (linksSrc) {
    const columns = [...linksSrc.querySelectorAll(':scope > ul')].map((ul) => wrap('footer-links-column', [ul]));
    footer.append(wrap('footer-links', columns));
  }

  // band 2: brand, legal links, social icons
  if (brandSrc) {
    const paragraphs = [...brandSrc.querySelectorAll(':scope > p')];
    const lists = [...brandSrc.querySelectorAll(':scope > ul')];
    // a list whose links contain only images is the social row
    const isIconList = (ul) => [...ul.querySelectorAll('a')].every((a) => a.querySelector('img') && !a.textContent.trim());
    const social = lists.find(isIconList);
    const legal = lists.filter((ul) => ul !== social);
    const brand = wrap('footer-brand', paragraphs);
    paragraphs.find((p) => p.querySelector('img'))?.classList.add('footer-logo');
    paragraphs.find((p) => !p.querySelector('img'))?.classList.add('footer-tagline');
    legal.forEach((ul) => ul.classList.add('footer-legal'));
    if (social) social.classList.add('footer-social');
    footer.append(wrap('footer-brand-row', [brand, ...legal, social]));
  }

  // band 3: address, code, copyright
  if (bottomSrc) {
    const paragraphs = [...bottomSrc.querySelectorAll(':scope > p')];
    const address = paragraphs.find((p) => p.querySelector('strong'));
    address?.classList.add('footer-address');
    const meta = paragraphs.filter((p) => p !== address);
    footer.append(wrap('footer-bottom', [address, wrap('footer-meta', meta)]));
  }

  decorateLinks(footer);

  // "Your Privacy Choices" opens the consent manager's preference center when one is loaded
  footer.querySelectorAll('a[href*="#your-privacy-choices"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      if (typeof window.OneTrust?.ToggleInfoDisplay !== 'function') return;
      e.preventDefault();
      window.OneTrust.ToggleInfoDisplay();
    });
  });

  block.append(footer);
}
