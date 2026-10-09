// media query match that indicates desktop width (source switches to the full nav at 1024px)
const isDesktop = window.matchMedia('(width >= 1024px)');

const SEARCH_ICON = '<svg viewBox="0 0 17 17" width="17" height="17" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="6.5" stroke="currentColor"/><path d="M16 16L12 12" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const SEARCH_URL = 'https://www.medtronic.com/en-us/search-results.html';

/**
 * Fetches the nav fragment: /content first (local preview), then the site root (DA/EDS).
 * @returns {Promise<HTMLElement|null>} container holding the nav sections
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  // resolve relative image paths against the fragment location
  container.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), resp.url).href;
    img.loading = 'eager';
  });
  return container;
}

/**
 * Collapses every open flyout inside a nav list
 * @param {Element} root The element containing the flyouts
 */
function closeFlyouts(root) {
  root.querySelectorAll('[aria-expanded="true"]').forEach((el) => el.setAttribute('aria-expanded', 'false'));
  root.querySelectorAll('.nav-flyout-open').forEach((el) => {
    el.classList.remove('nav-flyout-open');
    el.style.minHeight = '';
  });
}

/**
 * Turns a nested list into a cascading flyout menu.
 * Items with children toggle their sub-list; leaf items navigate.
 * @param {Element} list The top-level list
 * @param {number} level The list depth
 */
function decorateNavList(list, level = 0) {
  list.classList.add(`nav-level-${level}`);
  [...list.children].forEach((li) => {
    const sub = li.querySelector(':scope > ul');
    let label = li.querySelector(':scope > a');
    if (!label) {
      // plain-text label: wrap it so it can be focused and styled like a link
      label = document.createElement('span');
      [...li.childNodes].filter((n) => n !== sub).forEach((n) => label.append(n));
      li.prepend(label);
    }
    label.classList.add('nav-item-label');
    if (level === 0) label.classList.add('nav-top-label');
    if (!sub) return;

    li.classList.add('nav-drop');
    // the section's Overview entry: hidden on desktop, the back row of the mobile sub-panel
    const overview = sub.querySelector(':scope > li:first-child > a');
    if (overview && label.href && overview.href === label.href) {
      overview.parentElement.classList.add('nav-overview');
      overview.addEventListener('click', (e) => {
        if (isDesktop.matches) return;
        e.preventDefault();
        closeFlyouts(li);
        label.setAttribute('aria-expanded', 'false');
        label.focus();
      });
    }
    label.setAttribute('role', 'button');
    label.setAttribute('aria-expanded', 'false');
    if (!label.hasAttribute('href')) label.tabIndex = 0;
    decorateNavList(sub, level + 1);

    const toggle = (e) => {
      e.preventDefault();
      const expanded = label.getAttribute('aria-expanded') === 'true';
      // close siblings (and their descendants) at this level
      [...list.children].forEach((sibling) => {
        if (sibling !== li) closeFlyouts(sibling);
        sibling.querySelector(':scope > .nav-item-label')?.setAttribute('aria-expanded', 'false');
      });
      if (expanded) closeFlyouts(li);
      label.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      list.classList.toggle('nav-flyout-open', !expanded && level > 0);
      // cascading columns share the height of the tallest open column
      if (level > 0) list.style.minHeight = !expanded && isDesktop.matches ? `${sub.scrollHeight}px` : '';
    };
    label.addEventListener('click', toggle);
    label.addEventListener('keydown', (e) => {
      if (e.code === 'Enter' || e.code === 'Space') toggle(e);
    });
  });
}

/**
 * Builds the search form from the authored placeholder and audience options
 * @param {Element} section The search section of the nav fragment
 * @returns {Element} The search form
 */
function buildSearch(section) {
  const placeholder = section.querySelector('p')?.textContent.trim() || 'Search';
  const options = [...section.querySelectorAll('li')].map((li) => li.textContent.trim());
  const form = document.createElement('form');
  form.className = 'nav-search-form';
  form.setAttribute('role', 'search');
  if (options.length) {
    const select = document.createElement('select');
    select.className = 'nav-search-filter';
    select.setAttribute('aria-label', options[0]);
    options.forEach((text, i) => {
      const option = document.createElement('option');
      option.textContent = text;
      option.value = i === 0 ? '' : text;
      select.append(option);
    });
    form.append(select);
  }
  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = placeholder;
  input.setAttribute('aria-label', placeholder);
  input.autocomplete = 'off';
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'nav-search-submit';
  submit.setAttribute('aria-label', placeholder);
  submit.innerHTML = SEARCH_ICON;
  form.append(input, submit);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (q) window.location.href = `${SEARCH_URL}#q=${encodeURIComponent(q)}`;
  });
  return form;
}

/**
 * Builds the country selector trigger and slide-in drawer
 * @param {Element} section The locale section of the nav fragment
 * @returns {Element} The locale selector
 */
function buildLocale(section) {
  const wrapper = document.createElement('div');
  wrapper.className = 'nav-locale';
  const current = section.querySelector('p');
  const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
  const list = section.querySelector('ul');

  // link-styled trigger (role=button), as on the source site
  const trigger = document.createElement('a');
  trigger.href = '#';
  trigger.setAttribute('role', 'button');
  trigger.className = 'nav-locale-trigger';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-haspopup', 'dialog');
  if (current) {
    const icon = current.querySelector('img');
    if (icon) {
      // rendered as a mask so it follows the text color (white on desktop, grey in the drawer)
      const glyph = document.createElement('span');
      glyph.className = 'nav-locale-icon';
      glyph.style.setProperty('--nav-icon', `url("${icon.src}")`);
      trigger.append(glyph);
    }
    const text = document.createElement('span');
    text.textContent = current.textContent.trim();
    trigger.append(text);
  }

  const drawer = document.createElement('div');
  drawer.className = 'nav-locale-drawer';
  drawer.id = 'nav-locale-drawer';
  trigger.setAttribute('aria-controls', drawer.id);
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-label', heading?.textContent.trim() || 'Country/Language');
  const head = document.createElement('div');
  head.className = 'nav-locale-head';
  const title = document.createElement('p');
  title.className = 'nav-locale-title';
  title.textContent = heading?.textContent.trim() || '';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'nav-locale-close';
  close.setAttribute('aria-label', 'Close');
  head.append(title, close);
  drawer.append(head);
  if (list) {
    list.className = 'nav-locale-list';
    list.querySelectorAll('li').forEach((li) => {
      if (li.querySelector('strong')) li.classList.add('nav-locale-current');
    });
    const listNav = document.createElement('nav');
    listNav.setAttribute('aria-label', 'Country Navigation');
    listNav.append(list);
    drawer.append(listNav);
  }
  const backdrop = document.createElement('div');
  backdrop.className = 'nav-locale-backdrop';

  const setOpen = (open) => {
    wrapper.classList.toggle('is-open', open);
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('nav-locale-open', open);
    if (open) close.focus();
  };
  trigger.addEventListener('click', (e) => { e.preventDefault(); setOpen(true); });
  trigger.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); setOpen(true); }
  });
  close.addEventListener('click', () => { setOpen(false); trigger.focus(); });
  backdrop.addEventListener('click', () => setOpen(false));
  drawer.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') { setOpen(false); trigger.focus(); }
  });

  wrapper.append(trigger, drawer, backdrop);
  return wrapper;
}

/**
 * Opens or closes the mobile menu
 * @param {Element} nav The nav element
 * @param {boolean|null} force Force open (true) or closed (false)
 */
function toggleMenu(nav, force = null) {
  const expanded = nav.getAttribute('aria-expanded') === 'true';
  const open = force !== null ? force : !expanded;
  nav.setAttribute('aria-expanded', open ? 'true' : 'false');
  const button = nav.querySelector('.nav-hamburger button');
  button?.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  button?.setAttribute('aria-expanded', open ? 'true' : 'false');
  document.body.style.overflowY = open && !isDesktop.matches ? 'hidden' : '';
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  block.textContent = '';
  if (!fragment) return;

  const [brandSrc, searchSrc, sectionsSrc, toolsSrc, localeSrc] = [...fragment.children];
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main');

  // row 1: brand, search, tools, locale
  const top = document.createElement('div');
  top.className = 'nav-top';
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  if (brandSrc) brand.append(...brandSrc.childNodes);
  const logo = brand.querySelector('img');
  if (logo) brand.querySelector('a')?.style.setProperty('--nav-logo', `url("${logo.src}")`);
  top.append(brand);
  if (searchSrc) {
    const search = document.createElement('div');
    search.className = 'nav-search';
    search.append(buildSearch(searchSrc));
    top.append(search);
  }
  const utility = document.createElement('div');
  utility.className = 'nav-utility';
  const toolLinks = toolsSrc ? [...toolsSrc.querySelectorAll('a')] : [];
  const iconLinks = toolLinks.filter((a) => a.querySelector('img'));
  const ctaLinks = toolLinks.filter((a) => !a.querySelector('img'));
  iconLinks.forEach((a) => {
    a.className = 'nav-icon-link';
    const img = a.querySelector('img');
    a.setAttribute('aria-label', img.alt);
    a.title = img.alt;
    img.alt = '';
    // render the icon as a mask so it can follow the link color on hover
    a.style.setProperty('--nav-icon', `url("${img.src}")`);
    utility.append(a);
  });
  if (localeSrc) utility.append(buildLocale(localeSrc));
  top.append(utility);

  // row 2: main sections + CTA
  const main = document.createElement('div');
  main.className = 'nav-main';
  const sections = document.createElement('div');
  sections.className = 'nav-sections';
  const list = sectionsSrc?.querySelector('ul');
  if (list) {
    decorateNavList(list);
    sections.append(list);
  }
  main.append(sections);
  if (ctaLinks.length) {
    const cta = document.createElement('div');
    cta.className = 'nav-cta';
    ctaLinks.forEach((a) => { a.className = 'nav-cta-link'; cta.append(a); });
    main.append(cta);
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-expanded="false" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav));

  nav.append(hamburger, top, main);
  nav.setAttribute('aria-expanded', 'false');

  // close flyouts on outside click and Escape
  document.addEventListener('click', (e) => {
    if (isDesktop.matches && !sections.contains(e.target)) closeFlyouts(sections);
  });
  nav.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    if (sections.querySelector('[aria-expanded="true"]')) {
      const opener = sections.querySelector('.nav-top-label[aria-expanded="true"]');
      closeFlyouts(sections);
      opener?.focus();
    } else if (!isDesktop.matches && nav.getAttribute('aria-expanded') === 'true') {
      toggleMenu(nav, false);
      hamburger.querySelector('button').focus();
    }
  });

  // reset state when crossing the desktop breakpoint
  isDesktop.addEventListener('change', () => {
    closeFlyouts(sections);
    toggleMenu(nav, false);
  });

  // transparent header over a leading hero; solid elsewhere
  const firstBlock = document.querySelector('main .section:first-child [class*="hero"]');
  if (firstBlock) block.closest('header')?.classList.add('header-overlay');

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
