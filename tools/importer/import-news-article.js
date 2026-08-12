/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import articleHeaderParser from './parsers/article-header.js';
import textAndImageParser from './parsers/text-and-image.js';
import cardsNewsParser from './parsers/cards-news.js';
import articleTagsParser from './parsers/article-tags.js';
import quoteParser from './parsers/quote.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/sparebank1-cleanup.js';
import sectionsTransformer from './transformers/sparebank1-sections.js';

// PARSER REGISTRY - Map parser names to functions
const parsers = {
  'article-header': articleHeaderParser,
  'text-and-image': textAndImageParser,
  'cards-news': cardsNewsParser,
  'article-tags': articleTagsParser,
  quote: quoteParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'news-article',
  description: "News/article page (body class 'sb1-article__layout1'): article header (hero image + caption, category tag chip, H1, author/date byline), a rich article body (ingress + H2 sections + paragraphs + captioned images + text-and-image bands + centered CTA buttons), and an aside with related-article cards and topic tags.",
  urls: [
    'https://www.sparebank1.no/nb/bank/privat/sparing/markedsnytt/artikler/topp-10-fond.html',
  ],
  blocks: [
    {
      name: 'article-header',
      instances: ['#main-content div.sb1-article__header'],
    },
    {
      name: 'text-and-image',
      instances: [
        '#main-content div.sb1-article__content div.text-and-image',
        '#main-content div.text-and-image',
      ],
    },
    {
      name: 'quote',
      instances: [
        '#main-content section.quote',
        '#main-content div.quote',
      ],
    },
    {
      name: 'cards-news',
      instances: [
        '#main-content div.sb1-article__aside div.sb1-article__aside-related',
        '#main-content div.sb1-article__aside div.related-list',
      ],
    },
    {
      name: 'article-tags',
      instances: ['#main-content div.sb1-article__aside div.tags'],
    },
  ],
  sections: [
    {
      id: 'section-1',
      name: 'Article header',
      selector: '#main-content div.sb1-article__header',
      style: null,
      blocks: ['article-header'],
      defaultContent: [],
    },
    {
      id: 'section-2',
      name: 'Article body (ingress + rich text)',
      selector: '#main-content div.sb1-article__content',
      style: 'article-body',
      blocks: ['text-and-image'],
      defaultContent: ['#main-content div.sb1-article__content'],
    },
    {
      id: 'section-3',
      name: 'Relaterte artikler + tema',
      selector: '#main-content div.sb1-article__aside',
      style: null,
      blocks: ['cards-news', 'article-tags'],
      defaultContent: ['#main-content div.sb1-article__aside h2'],
    },
  ],
};

// TRANSFORMER REGISTRY - cleanup, then sections (only when 2+ sections).
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - The hook name ('beforeTransform' or 'afterTransform')
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
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
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Array of block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();

  template.blocks.forEach((blockDef) => {
    // Use the first instance selector that matches, so overlapping fallbacks
    // (e.g. related-articles then the whole aside) don't double-parse.
    for (const selector of blockDef.instances) {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) continue;
      let added = false;
      elements.forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({ name: blockDef.name, selector, element, section: blockDef.section || null });
        added = true;
      });
      if (added) break;
    }
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  /**
   * Main transformation function (Helix Importer "one input / multiple outputs")
   */
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform cleanup
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // already replaced
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

    // 4. afterTransform cleanup + section breaks/metadata
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path (full localized path without extension). Map root → /index.
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
