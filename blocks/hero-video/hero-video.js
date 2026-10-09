import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const OPTION_CLASSES = [];
const VIDEO_PATTERN = /\.(mp4|webm|ogg|m3u8)(\?|#|$)/i;

/**
 * Returns the video URL if the row only carries a link to a video file.
 * @param {Element} row
 * @returns {string|null}
 */
function getVideoUrl(row) {
  if (row.querySelector('picture')) return null;
  const link = row.querySelector('a[href]');
  if (link && VIDEO_PATTERN.test(link.href)) return link.href;
  const text = row.textContent.trim();
  if (text && VIDEO_PATTERN.test(text) && !/\s/.test(text)) return text;
  return null;
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
  source.type = src.toLowerCase().includes('.webm') ? 'video/webm' : 'video/mp4';
  video.append(source);
  return video;
}

/**
 * loads and decorates the hero-video block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));
  const rows = [...block.children];

  const background = document.createElement('div');
  background.className = 'hero-video-background';
  const card = document.createElement('div');
  card.className = 'hero-video-card';
  const content = document.createElement('div');
  content.className = 'hero-video-content';
  const media = document.createElement('div');
  media.className = 'hero-video-media';

  let videoUrl = null;
  rows.forEach((row) => {
    const cell = row.querySelector(':scope > div') || row;
    const url = videoUrl ? null : getVideoUrl(row);
    if (url) {
      videoUrl = url;
      moveInstrumentation(row, background);
      if (cell !== row) moveInstrumentation(cell, background);
      return;
    }
    const pic = cell.querySelector('picture');
    const hasText = [...cell.children].some((el) => !el.querySelector('picture') && el.tagName !== 'PICTURE' && el.textContent.trim());
    if (pic && !hasText) {
      moveInstrumentation(row, media);
      if (cell !== row) moveInstrumentation(cell, media);
      media.append(...cell.childNodes);
    } else {
      moveInstrumentation(row, content);
      if (cell !== row) moveInstrumentation(cell, content);
      content.append(...cell.childNodes);
    }
  });

  if (videoUrl) {
    const video = buildVideo(videoUrl);
    background.append(video);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion) {
      // start playback after the page has settled to protect LCP
      const start = () => {
        video.preload = 'auto';
        video.play().catch(() => {});
      };
      if (document.readyState === 'complete') setTimeout(start, 0);
      else window.addEventListener('load', () => setTimeout(start, 0), { once: true });
    }
  }

  // first paragraph before the heading is the eyebrow
  const heading = content.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    const prev = heading.previousElementSibling;
    if (prev && prev.tagName === 'P' && !prev.querySelector('a')) prev.classList.add('hero-video-eyebrow');
  }

  // paragraphs holding only a link are the arrowed CTA
  content.querySelectorAll(':scope > p').forEach((p) => {
    const link = p.querySelector(':scope > a:only-child');
    if (link && p.textContent.trim() === link.textContent.trim()) {
      p.classList.add('hero-video-cta');
      link.classList.add('hero-video-cta-link');
    }
  });

  media.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, true, [{ media: '(min-width: 900px)', width: '1000' }, { width: '750' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });

  card.append(content);
  if (media.children.length) card.append(media);
  const nodes = [];
  if (videoUrl) nodes.push(background);
  nodes.push(card);
  block.replaceChildren(...nodes);
  if (!videoUrl) block.classList.add('hero-video-no-video');
}
