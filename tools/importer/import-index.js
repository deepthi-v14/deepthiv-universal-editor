/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroVideoParser from './parsers/hero-video.js';
import columnsBannerParser from './parsers/columns-banner.js';
import carouselNewsParser from './parsers/carousel-news.js';
import columnsStatsParser from './parsers/columns-stats.js';
import columnsCtaParser from './parsers/columns-cta.js';
import cardsImpactParser from './parsers/cards-impact.js';
import heroPromoParser from './parsers/hero-promo.js';
import cardsIconLinkParser from './parsers/cards-icon-link.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/medtronic-cleanup.js';
import sectionsTransformer from './transformers/medtronic-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-video': heroVideoParser,
  'columns-banner': columnsBannerParser,
  'carousel-news': carouselNewsParser,
  'columns-stats': columnsStatsParser,
  'columns-cta': columnsCtaParser,
  'cards-impact': cardsImpactParser,
  'hero-promo': heroPromoParser,
  'cards-icon-link': cardsIconLinkParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
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

// TRANSFORMER REGISTRY - cleanup first, then section breaks/metadata
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration.
 * Deduplicates elements matched by more than one selector of the same block.
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({
          name: blockDef.name, selector, element, section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. Initial cleanup + section break markers
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip elements detached by an earlier parser)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Final cleanup + section metadata
    executeTransformers('afterTransform', main, payload);

    // 5. Built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path (root maps to /index)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
