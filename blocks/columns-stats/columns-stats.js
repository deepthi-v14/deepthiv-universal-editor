import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const VIDEO_PATTERN = /\.(mp4|webm|ogg|m3u8)(\?|#|$)/i;
const STAT_PATTERN = /^\s*([$€£]?\s?[\d.,]+\s?[A-Za-z%]{0,2}\+?)\s+(.+)$/;

function markEyebrow(col) {
  const heading = col.querySelector('h1, h2, h3, h4, h5, h6');
  const prev = heading?.previousElementSibling;
  if (prev && prev.tagName === 'P' && !prev.querySelector('a, picture')) {
    prev.classList.add('columns-stats-eyebrow');
  }
}

/**
 * Splits a stat element into value + label.
 * Accepts "<strong>140+</strong> Active clinical trials" or "140+ Active clinical trials".
 * @param {Element} el
 * @returns {HTMLLIElement}
 */
function buildStat(el) {
  const li = document.createElement('li');
  li.className = 'columns-stats-stat';
  moveInstrumentation(el, li);
  const value = document.createElement('span');
  value.className = 'columns-stats-value';
  const label = document.createElement('span');
  label.className = 'columns-stats-label';

  const strong = el.querySelector('strong, b');
  if (strong) {
    value.textContent = strong.textContent.trim();
    strong.remove();
    label.textContent = el.textContent.trim();
  } else {
    const text = el.textContent.trim();
    const match = text.match(STAT_PATTERN);
    if (match) {
      [, value.textContent, label.textContent] = match;
    } else {
      value.textContent = text;
    }
  }
  // render a trailing "+" as a superscript, as on the source design
  const valueText = value.textContent;
  if (valueText.length > 1 && valueText.endsWith('+')) {
    value.textContent = valueText.slice(0, -1);
    const sup = document.createElement('sup');
    sup.textContent = '+';
    value.append(sup);
  }
  li.append(value);
  if (label.textContent) li.append(label);
  return li;
}

function buildVideo(src) {
  const video = document.createElement('video');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  video.setAttribute('loop', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('aria-hidden', 'true');
  video.preload = 'none';
  const source = document.createElement('source');
  source.src = src;
  source.type = 'video/mp4';
  video.append(source);
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        video.preload = 'auto';
        video.play().catch(() => {});
      }
    });
    observer.observe(video);
  }
  return video;
}

/**
 * Restructures the media column into media, stats overlay and source note.
 * @param {Element} col
 */
function decorateMediaCol(col) {
  col.classList.add('columns-stats-media-col');
  const media = document.createElement('div');
  media.className = 'columns-stats-media';
  const stats = document.createElement('ul');
  stats.className = 'columns-stats-list';
  const source = document.createElement('div');
  source.className = 'columns-stats-source';

  [...col.children].forEach((el) => {
    const link = el.querySelector('a[href]') || (el.tagName === 'A' ? el : null);
    if (el.querySelector('picture') || el.tagName === 'PICTURE') {
      media.prepend(el);
    } else if (link && VIDEO_PATTERN.test(link.href)) {
      media.append(buildVideo(link.href));
      el.remove();
    } else if (el.tagName === 'UL' || el.tagName === 'OL') {
      [...el.children].forEach((item) => stats.append(buildStat(item)));
      el.remove();
    } else if (link) {
      source.append(el);
    } else if (el.textContent.trim()) {
      stats.append(buildStat(el));
      el.remove();
    }
  });

  media.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ media: '(min-width: 900px)', width: '1200' }, { width: '750' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });
  if (media.querySelector('video')) media.classList.add('columns-stats-has-video');

  const nodes = [media];
  if (stats.children.length) nodes.push(stats);
  if (source.children.length) nodes.push(source);
  col.replaceChildren(...nodes);
}

/**
 * loads and decorates the columns-stats block
 * Contract: 1 row, 2 cells —
 * [eyebrow, heading, text, CTA | image (+ video link), stats, source link]
 * @param {Element} block The block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('columns-stats-row');
    [...row.children].forEach((col) => {
      const hasVideo = [...col.querySelectorAll('a[href]')].some((a) => VIDEO_PATTERN.test(a.href));
      const hasMedia = col.querySelector('picture') || hasVideo;
      const hasHeading = col.querySelector('h1, h2, h3, h4, h5, h6');
      if (hasMedia && !hasHeading) {
        decorateMediaCol(col);
      } else {
        col.classList.add('columns-stats-text-col');
        markEyebrow(col);
      }
    });
  });
}
