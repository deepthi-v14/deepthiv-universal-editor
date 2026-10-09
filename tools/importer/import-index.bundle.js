/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-index.js
  var import_index_exports = {};
  __export(import_index_exports, {
    default: () => import_index_default
  });

  // tools/importer/parsers/hero-video.js
  var SOURCE_ORIGIN = "https://www.medtronic.com";
  function absolutize(url) {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith("//")) return `https:${url}`;
    if (url.startsWith("/")) return `${SOURCE_ORIGIN}${url}`;
    return url;
  }
  function hinted(document2, field, nodes) {
    const frag = document2.createDocumentFragment();
    frag.appendChild(document2.createComment(` field:${field} `));
    nodes.forEach((n) => frag.appendChild(n));
    return frag;
  }
  function parse(element, { document: document2 }) {
    const hero = element.matches("section.hero-jon, .hero-jon") ? element : element.querySelector("section.hero-jon, .hero-jon") || element;
    const card = hero.querySelector(".hero-jon__card") || hero;
    const videoEl = hero.querySelector("video.hero-jon__bg, video");
    let videoSrc = "";
    if (videoEl) {
      const src = [...videoEl.querySelectorAll("source")].map((s) => s.getAttribute("src")).find((s) => s && s.trim());
      videoSrc = src || videoEl.getAttribute("src") || "";
    }
    videoSrc = absolutize(videoSrc.trim());
    const image = card.querySelector("figure.hero-jon__media img, .hero-jon__media img");
    const textRoot = card.querySelector(".hero-jon__text") || card;
    const textNodes = [];
    const eyebrowEl = textRoot.querySelector(".eyebrow-content, .eyebrow");
    if (eyebrowEl && eyebrowEl.textContent.trim()) {
      const p = document2.createElement("p");
      p.textContent = eyebrowEl.textContent.trim();
      textNodes.push(p);
    }
    const heading = textRoot.querySelector("h1, h2, h3");
    if (heading) textNodes.push(heading);
    textRoot.querySelectorAll(":scope > p").forEach((p) => {
      if (p.textContent.trim()) textNodes.push(p);
    });
    const ctas = [...textRoot.querySelectorAll("a[href]")];
    ctas.forEach((a) => {
      const link = document2.createElement("a");
      link.href = a.href || a.getAttribute("href");
      link.textContent = a.textContent.trim();
      const p = document2.createElement("p");
      p.appendChild(link);
      textNodes.push(p);
    });
    if (!heading && !image && !videoSrc) {
      return;
    }
    const cells = [];
    if (videoSrc) {
      const a = document2.createElement("a");
      a.href = videoSrc;
      a.textContent = videoSrc;
      cells.push([hinted(document2, "video", [a])]);
    } else {
      cells.push([""]);
    }
    cells.push([image ? hinted(document2, "image", [image]) : ""]);
    cells.push([textNodes.length ? hinted(document2, "text", textNodes) : ""]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-video", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-banner.js
  function cleanLink(document2, a) {
    const link = document2.createElement("a");
    link.href = a.href || a.getAttribute("href");
    link.textContent = a.textContent.replace(/\s+/g, " ").trim();
    const p = document2.createElement("p");
    p.appendChild(link);
    return p;
  }
  function parse2(element, { document: document2 }) {
    const media = element.querySelector(".award-banner__media") || element;
    const image = media.querySelector('img:not([src^="data:"])') || element.querySelector('img:not([src^="data:"])');
    const textRoot = element.querySelector(".award-banner__text") || element;
    const textCell = [];
    const eyebrow = textRoot.querySelector(".eyebrow");
    if (eyebrow && eyebrow.textContent.trim()) {
      const p = document2.createElement("p");
      p.textContent = eyebrow.textContent.trim();
      textCell.push(p);
    }
    const heading = textRoot.querySelector("h1, h2, h3, h4, .headline");
    if (heading) {
      const h = document2.createElement(/^H[1-6]$/.test(heading.tagName) ? heading.tagName : "h3");
      h.textContent = heading.textContent.replace(/\s+/g, " ").trim();
      textCell.push(h);
    }
    textRoot.querySelectorAll(":scope > p").forEach((p) => {
      if (p.textContent.trim()) textCell.push(p);
    });
    textRoot.querySelectorAll("a[href]").forEach((a) => textCell.push(cleanLink(document2, a)));
    if (!image && !textCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[image || "", textCell.length ? textCell : ""]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-news.js
  function hinted2(document2, field, nodes) {
    const frag = document2.createDocumentFragment();
    frag.appendChild(document2.createComment(` field:${field} `));
    nodes.forEach((n) => frag.appendChild(n));
    return frag;
  }
  function parse3(element, { document: document2 }) {
    let items = [...element.querySelectorAll(":scope > .news-item")];
    if (!items.length) items = [...element.querySelectorAll(".news-item")];
    const seen = /* @__PURE__ */ new Set();
    const cells = [];
    items.forEach((item) => {
      const link = item.querySelector("a[href]");
      const href = link ? link.href || link.getAttribute("href") : "";
      const headingEl = item.querySelector(".news-title, h2, h3, h4");
      const headingText = headingEl ? headingEl.textContent.replace(/\s+/g, " ").trim() : "";
      const key = `${href}|${headingText}`;
      if (!href && !headingText) return;
      if (seen.has(key)) return;
      seen.add(key);
      const img = item.querySelector("img");
      const textNodes = [];
      const category = item.querySelector(".category");
      if (category && category.textContent.trim()) {
        const p = document2.createElement("p");
        p.textContent = category.textContent.trim();
        textNodes.push(p);
      }
      if (headingEl) {
        const h = document2.createElement(/^H[1-6]$/.test(headingEl.tagName) ? headingEl.tagName.toLowerCase() : "h3");
        if (href) {
          const a = document2.createElement("a");
          a.href = href;
          a.innerHTML = headingEl.innerHTML;
          h.appendChild(a);
        } else {
          h.innerHTML = headingEl.innerHTML;
        }
        textNodes.push(h);
      } else if (href) {
        const p = document2.createElement("p");
        const a = document2.createElement("a");
        a.href = href;
        a.textContent = href;
        p.appendChild(a);
        textNodes.push(p);
      }
      cells.push([
        img ? hinted2(document2, "media_image", [img]) : "",
        textNodes.length ? hinted2(document2, "content_text", textNodes) : ""
      ]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel-news", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-stats.js
  var SOURCE_ORIGIN2 = "https://www.medtronic.com";
  function absolutize2(url) {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith("//")) return `https:${url}`;
    if (url.startsWith("/")) return `${SOURCE_ORIGIN2}${url}`;
    return url;
  }
  function text(el) {
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }
  function linkPara(document2, href, label) {
    const p = document2.createElement("p");
    const a = document2.createElement("a");
    a.href = href;
    a.textContent = label;
    p.appendChild(a);
    return p;
  }
  function parse4(element, { document: document2 }) {
    const left = element.querySelector(".left-content") || element;
    const right = element.querySelector(".right-content") || element;
    const textCell = [];
    const eyebrow = left.querySelector(".eyebrow");
    if (text(eyebrow)) {
      const p = document2.createElement("p");
      p.textContent = text(eyebrow);
      textCell.push(p);
    }
    const heading = left.querySelector("h1, h2, h3, .headline");
    if (heading) {
      const h = document2.createElement(/^H[1-6]$/.test(heading.tagName) ? heading.tagName.toLowerCase() : "h2");
      h.textContent = text(heading);
      textCell.push(h);
    }
    left.querySelectorAll("p.copy, .link-container > p").forEach((p) => {
      if (text(p) && !textCell.some((n) => n.textContent === text(p))) {
        const np = document2.createElement("p");
        np.textContent = text(p);
        textCell.push(np);
      }
    });
    const cta = left.querySelector(".cta a[href], a.link--arrowed[href]");
    if (cta) textCell.push(linkPara(document2, cta.href || cta.getAttribute("href"), text(cta)));
    const mediaCell = [];
    const image = right.querySelector("img.background-image-middle") || right.querySelector('img:not([src^="data:"])');
    if (image) mediaCell.push(image);
    const videoEl = right.querySelector("video");
    if (videoEl) {
      const src = [...videoEl.querySelectorAll("source")].map((s) => s.getAttribute("src")).find((s) => s && s.trim()) || videoEl.getAttribute("src");
      if (src) {
        const url = absolutize2(src.trim());
        mediaCell.push(linkPara(document2, url, url));
      }
    }
    const statBlocks = [...right.querySelectorAll(".info-bar .info-block, .info-block")].filter((b, i, arr) => arr.indexOf(b) === i);
    if (statBlocks.length) {
      const ul = document2.createElement("ul");
      statBlocks.forEach((b) => {
        const value = text(b.querySelector(".large-copy"));
        const label = text(b.querySelector(".subtext"));
        if (!value && !label) return;
        const li = document2.createElement("li");
        if (value) {
          const strong = document2.createElement("strong");
          strong.textContent = value.replace(/\s+(?=\+)/g, "");
          li.appendChild(strong);
        }
        if (label) li.appendChild(document2.createTextNode(`${value ? " " : ""}${label}`));
        ul.appendChild(li);
      });
      if (ul.children.length) mediaCell.push(ul);
    }
    const sourceLink = right.querySelector("a.bottom-right-link[href]");
    if (sourceLink) mediaCell.push(linkPara(document2, sourceLink.href || sourceLink.getAttribute("href"), text(sourceLink)));
    if (!textCell.length && !mediaCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[textCell.length ? textCell : "", mediaCell.length ? mediaCell : ""]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-stats", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-cta.js
  function text2(el) {
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }
  function parse5(element, { document: document2 }) {
    const root = element.querySelector(".banner-container") || element;
    const textCell = [];
    const eyebrow = root.querySelector(".left-section .eyebrow, .eyebrow");
    if (text2(eyebrow)) {
      const p = document2.createElement("p");
      p.textContent = text2(eyebrow);
      textCell.push(p);
    }
    const headline = root.querySelector(".left-section .headline, .headline, h2, h3");
    if (text2(headline)) {
      const h = document2.createElement("h2");
      h.textContent = text2(headline);
      textCell.push(h);
    }
    const copy = root.querySelector(".center-section .copy, .copy");
    if (text2(copy)) {
      const p = document2.createElement("p");
      p.textContent = text2(copy);
      textCell.push(p);
    }
    const ctaCell = [];
    const cta = root.querySelector(".right-section .cta a[href], .right-section a[href], a.link--arrowed[href]");
    const wrapLink = root.querySelector(":scope > a[href]");
    const ctaHref = cta ? cta.href || cta.getAttribute("href") : wrapLink && (wrapLink.href || wrapLink.getAttribute("href"));
    if (ctaHref) {
      const p = document2.createElement("p");
      const a = document2.createElement("a");
      a.href = ctaHref;
      a.textContent = text2(cta) || "Learn more";
      p.appendChild(a);
      ctaCell.push(p);
    }
    if (!textCell.length && !ctaCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[textCell.length ? textCell : "", ctaCell.length ? ctaCell : ""]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-cta", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-impact.js
  var SOURCE_ORIGIN3 = "https://www.medtronic.com";
  function absolutize3(url) {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith("//")) return `https:${url}`;
    if (url.startsWith("/")) return `${SOURCE_ORIGIN3}${url}`;
    return url;
  }
  function text3(el) {
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }
  function hinted3(document2, field, nodes) {
    const frag = document2.createDocumentFragment();
    frag.appendChild(document2.createComment(` field:${field} `));
    nodes.forEach((n) => frag.appendChild(n));
    return frag;
  }
  function para(document2, value) {
    const p = document2.createElement("p");
    p.textContent = value;
    return p;
  }
  function linkPara2(document2, a) {
    const p = document2.createElement("p");
    const link = document2.createElement("a");
    link.href = absolutize3(a.getAttribute("href")) || a.href;
    link.textContent = text3(a);
    p.appendChild(link);
    return p;
  }
  function parse6(element, { document: document2 }) {
    let tiles = [...element.querySelectorAll(":scope > div")];
    if (!tiles.length) tiles = [...element.querySelectorAll('.our-impact-card, [class^="div"], .access-card')];
    const cells = [];
    let headingCount = 0;
    tiles.forEach((tile) => {
      const textNodes = [];
      let image = null;
      const headline = tile.querySelector(".headline, h2, h3");
      if (headline) {
        headingCount += 1;
        const img = [...tile.querySelectorAll("img")].find((i) => !(i.getAttribute("src") || "").startsWith("data:") && !i.closest(".cta, a"));
        if (img && img.hasAttribute("alt") && img.getAttribute("alt").trim()) image = img;
        const eyebrow = tile.querySelector(".eyebrow");
        if (text3(eyebrow)) textNodes.push(para(document2, text3(eyebrow)));
        const h = document2.createElement(headingCount === 1 ? "h2" : "h3");
        h.textContent = text3(headline);
        textNodes.push(h);
        const copy = tile.querySelector(".copy");
        if (text3(copy)) textNodes.push(para(document2, text3(copy)));
        const cta = tile.querySelector(".cta a[href]") || tile.querySelector("a.link-container[href]");
        if (cta) {
          const p = linkPara2(document2, cta);
          if (!p.textContent.trim() || cta.classList.contains("link-container")) p.querySelector("a").textContent = "Learn more";
          textNodes.push(p);
        }
      } else {
        image = tile.querySelector(".animation-icon img") || tile.querySelector('img:not([src^="data:"])');
        const value = text3(tile.querySelector(".large-copy"));
        if (value) textNodes.push(para(document2, value.replace(/\s+(?=\+)/g, "")));
        const label = text3(tile.querySelector(".subtext"));
        if (label) textNodes.push(para(document2, label));
        tile.querySelectorAll("a[href]").forEach((a) => {
          if (text3(a)) textNodes.push(linkPara2(document2, a));
        });
      }
      if (!image && !textNodes.length) return;
      cells.push([
        image ? hinted3(document2, "image", [image]) : "",
        textNodes.length ? hinted3(document2, "text", textNodes) : ""
      ]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-impact", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-promo.js
  function text4(el) {
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }
  function hinted4(document2, field, nodes) {
    const frag = document2.createDocumentFragment();
    frag.appendChild(document2.createComment(` field:${field} `));
    nodes.forEach((n) => frag.appendChild(n));
    return frag;
  }
  function makeLink(document2, a) {
    const link = document2.createElement("a");
    link.href = a.href || a.getAttribute("href");
    link.textContent = text4(a);
    return link;
  }
  var ICON_SELECTOR = ".careers-jobs, .investors-icons";
  function parse7(element, { document: document2 }) {
    const content = element.querySelector(".careers-content, .investors-content") || element.querySelector('[class$="-content"]') || element;
    const iconTiles = [...element.querySelectorAll(ICON_SELECTOR)];
    const candidates = [...element.querySelectorAll("img")].filter((img) => {
      const src = img.getAttribute("src") || "";
      return src && !src.startsWith("data:") && !img.closest(ICON_SELECTOR) && !content.contains(img);
    });
    let image = candidates.find((img) => (img.getAttribute("alt") || "").trim()) || candidates[0] || null;
    if (!image) {
      const bgHosts = [element, ...element.querySelectorAll(":scope > div")];
      for (const host of bgHosts) {
        let bg = host.style && host.style.backgroundImage || "";
        if ((!bg || bg === "none") && typeof window !== "undefined" && window.getComputedStyle) {
          try {
            bg = window.getComputedStyle(host).backgroundImage || "";
          } catch (e) {
            bg = "";
          }
        }
        const m = bg && bg.match(/url\(["']?([^"')]+)["']?\)/);
        if (m && m[1] && !m[1].startsWith("data:")) {
          image = document2.createElement("img");
          image.src = m[1];
          image.alt = "";
          break;
        }
      }
    }
    const textNodes = [];
    const eyebrow = content.querySelector(".eyebrow");
    if (text4(eyebrow)) {
      const p = document2.createElement("p");
      p.textContent = text4(eyebrow);
      textNodes.push(p);
    }
    const heading = content.querySelector("h1, h2, h3");
    if (heading) {
      const h = document2.createElement(heading.tagName.toLowerCase());
      h.textContent = text4(heading);
      textNodes.push(h);
    }
    content.querySelectorAll(":scope > p").forEach((p) => {
      if (text4(p)) {
        const np = document2.createElement("p");
        np.textContent = text4(p);
        textNodes.push(np);
      }
    });
    const linkGroup = content.querySelector('.careers-links, .investors-links, [class$="-links"]');
    const primary = [...content.querySelectorAll("a[href]")].find((a) => text4(a) && !(linkGroup && linkGroup.contains(a)));
    if (primary) {
      const p = document2.createElement("p");
      p.appendChild(makeLink(document2, primary));
      textNodes.push(p);
    }
    if (linkGroup) {
      const secondary = [...linkGroup.querySelectorAll("a[href]")].filter((a) => text4(a));
      if (secondary.length) {
        const ul = document2.createElement("ul");
        secondary.forEach((a) => {
          const li = document2.createElement("li");
          li.appendChild(makeLink(document2, a));
          ul.appendChild(li);
        });
        textNodes.push(ul);
      }
    }
    if (!heading && !image && !textNodes.length) {
      return;
    }
    const cells = [
      [image ? hinted4(document2, "image", [image]) : ""],
      [textNodes.length ? hinted4(document2, "text", textNodes) : ""]
    ];
    const preserved = iconTiles.map((tile) => {
      const holder = document2.createElement("div");
      holder.className = tile.classList.contains("careers-jobs") ? "careers-section" : "investors-section";
      holder.appendChild(tile);
      return holder;
    });
    if (preserved.length) element.after(...preserved);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-promo", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-icon-link.js
  function hinted5(document2, field, nodes) {
    const frag = document2.createDocumentFragment();
    frag.appendChild(document2.createComment(` field:${field} `));
    nodes.forEach((n) => frag.appendChild(n));
    return frag;
  }
  function parse8(element, { document: document2 }) {
    let tiles = [...element.querySelectorAll(":scope > a[href]")];
    if (!tiles.length) tiles = [...element.querySelectorAll("a[href]")];
    const cells = [];
    tiles.forEach((tile) => {
      const img = tile.querySelector("img");
      const label = tile.textContent.replace(/\s+/g, " ").trim() || img && img.getAttribute("alt") || "";
      const href = tile.href || tile.getAttribute("href");
      if (!href && !label) return;
      const p = document2.createElement("p");
      const a = document2.createElement("a");
      a.href = href;
      a.textContent = label || href;
      p.appendChild(a);
      const textNodes = [];
      let icon = null;
      if (img) {
        const src = img.getAttribute("src") || img.src || "";
        const svg = src.split("?")[0].match(/([a-z0-9-]+)\.svg$/i);
        if (svg) {
          const iconP = document2.createElement("p");
          iconP.textContent = `:${svg[1].toLowerCase()}:`;
          textNodes.push(iconP);
        } else {
          icon = document2.createElement("img");
          icon.src = img.src || src;
          icon.alt = img.getAttribute("alt") || "";
        }
      }
      textNodes.push(p);
      cells.push([
        icon ? hinted5(document2, "image", [icon]) : "",
        hinted5(document2, "text", textNodes)
      ]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const name = element.matches(".investors-icons") ? "cards-icon-link (solid)" : "cards-icon-link";
    const block = WebImporter.Blocks.createBlock(document2, { name, cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/medtronic-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk",
        // OneTrust cookie banner + preference center (line ~6453)
        "#contactusFormComp",
        // hidden contact-us trigger (line ~2017)
        ".xfpage.page.basicpage .contact-us-form-container"
        // contact-us modal forms (lines ~2020-6240)
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        ".com-header-container",
        // header: skip buttons, logo, search, mega nav, breadcrumb (lines 7-1496)
        "footer",
        // global footer, migrated separately (line ~6240)
        ".xfpage.page.basicpage",
        // remaining experience-fragment modal wrappers after main
        ".share",
        // share/print/social bar (line ~1943)
        ".warn-on-leave",
        // empty leave-site warning component (line ~2012)
        ".disclaimer",
        // empty disclaimer component (line ~1888)
        ".ghost",
        // empty AEM ghost placeholders in main (lines ~1567-1570)
        ".hero-main-content .dom",
        // empty freeform DOM container in hero (line ~1535)
        "button.hero-jon__pause",
        // video pause/play control (line ~1511)
        "iframe.ot-text-resize",
        // OneTrust helper iframe
        // Medallia survey invite injected at runtime (not in cleaned.html)
        '[id^="kampyle"]',
        '[class*="kampyle"]',
        '[id*="medallia" i]',
        '[class*="medallia" i]'
      ]);
      removeSurveyInvite(element);
    }
  }
  function removeSurveyInvite(element) {
    [...element.querySelectorAll("strong, b, p, div")].filter((el) => /^Your feedback matters!?$/i.test(el.textContent.trim())).forEach((el) => {
      let target = el;
      while (target.parentElement && target.parentElement !== element && /^Your feedback matters/i.test(target.parentElement.textContent.trim())) {
        target = target.parentElement;
      }
      target.remove();
    });
  }

  // tools/importer/transformers/medtronic-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      if (!sel) continue;
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2) return;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-index.js
  var parsers = {
    "hero-video": parse,
    "columns-banner": parse2,
    "carousel-news": parse3,
    "columns-stats": parse4,
    "columns-cta": parse5,
    "cards-impact": parse6,
    "hero-promo": parse7,
    "cards-icon-link": parse8
  };
  var PAGE_TEMPLATE = {
    "name": "index",
    "description": "Medtronic US homepage: video hero, impact banner, news carousel, who-we-are stats, CTA banner, impact bento, careers and investors promos",
    "urls": [
      "https://www.medtronic.com/en-us/index.html"
    ],
    "blocks": [
      {
        "name": "hero-video",
        "instances": [
          "#Header-video",
          "section.hero-jon"
        ]
      },
      {
        "name": "columns-banner",
        "instances": [
          "#hero-banner-patients .award-banner",
          ".award-banner"
        ]
      },
      {
        "name": "carousel-news",
        "instances": [
          "#News-Media .scroller",
          ".news-media-sectionTarget-wrapper > .scroller"
        ]
      },
      {
        "name": "columns-stats",
        "instances": [
          "#who-we-are .who-we-are-section",
          ".who-we-are-section"
        ]
      },
      {
        "name": "columns-cta",
        "instances": [
          ".wrapper-cta-banner .cta-banner",
          ".cta-banner"
        ]
      },
      {
        "name": "cards-impact",
        "instances": [
          "#Our-Impact .wrapper-parent > .parent",
          "#Our-Impact .parent"
        ]
      },
      {
        "name": "hero-promo",
        "instances": [
          ".wrapper-careers-section",
          ".wrapper-investors-section"
        ]
      },
      {
        "name": "cards-icon-link",
        "instances": [
          ".careers-section .careers-jobs",
          ".investors-section .investors-icons"
        ]
      }
    ],
    "sections": [
      {
        "id": "section-1",
        "name": "Hero + Impact Report banner",
        "selector": [
          ".hero-main-content"
        ],
        "style": null,
        "blocks": [
          "hero-video",
          "columns-banner"
        ],
        "defaultContent": []
      },
      {
        "id": "section-2",
        "name": "The latest - news carousel",
        "selector": [
          "#News-Media"
        ],
        "style": null,
        "blocks": [
          "carousel-news"
        ],
        "defaultContent": [
          "#News-Media .news-media-sectionTarget .eyebrow",
          "#News-Media .news-media-sectionTarget h2.headline"
        ]
      },
      {
        "id": "section-3",
        "name": "Who we are - stats",
        "selector": [
          "#who-we-are"
        ],
        "style": "dark",
        "blocks": [
          "columns-stats"
        ],
        "defaultContent": []
      },
      {
        "id": "section-4",
        "name": "CTA story banner",
        "selector": [
          ".wrapper-cta-banner"
        ],
        "style": "black",
        "blocks": [
          "columns-cta"
        ],
        "defaultContent": []
      },
      {
        "id": "section-5",
        "name": "Our impact bento",
        "selector": [
          "#Our-Impact"
        ],
        "style": "grey",
        "blocks": [
          "cards-impact"
        ],
        "defaultContent": []
      },
      {
        "id": "section-6",
        "name": "Careers",
        "selector": [
          "#Careers",
          ".wrapper-careers-section"
        ],
        "style": null,
        "blocks": [
          "hero-promo",
          "cards-icon-link"
        ],
        "defaultContent": []
      },
      {
        "id": "section-7",
        "name": "Investors",
        "selector": [
          ".wrapper-investors-section"
        ],
        "style": null,
        "blocks": [
          "hero-promo",
          "cards-icon-link"
        ],
        "defaultContent": []
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    const seen = /* @__PURE__ */ new Set();
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          if (seen.has(element)) return;
          seen.add(element);
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_index_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_index_exports);
})();
