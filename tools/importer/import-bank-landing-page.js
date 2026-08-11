/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroCampaignParser from './parsers/hero-campaign.js';
import cardsTopicParser from './parsers/cards-topic.js';
import columnsPromoParser from './parsers/columns-promo.js';
import cardsNewsParser from './parsers/cards-news.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/sparebank1-cleanup.js';
import sectionsTransformer from './transformers/sparebank1-sections.js';

// PARSER REGISTRY - Map parser names to functions
const parsers = {
  'hero-campaign': heroCampaignParser,
  'cards-topic': cardsTopicParser,
  'columns-promo': columnsPromoParser,
  'cards-news': cardsNewsParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'bank-landing-page',
  description: 'SpareBank 1 privat banking landing page: hero campaign banner, multi-column link/topic grids in a background container, a two-column small banner (bank switch / LO membership), a news & tips card feed, an about/shortcuts link section, and a price comparison text block.',
  urls: [
    'https://www.sparebank1.no/nb/bank/privat.html',
  ],
  blocks: [
    {
      name: 'hero-campaign',
      instances: ['#main-content > div.campaign-carousel.parbase.color-fillable:nth-of-type(3)'],
    },
    {
      name: 'cards-topic',
      instances: ['#main-content > div.background-container.parbase.color-fillable:nth-of-type(5)'],
    },
    {
      name: 'columns-promo',
      instances: ['#main-content > div.banner-small.parbase'],
    },
    {
      name: 'cards-news',
      instances: ['#main-content > div.related-topics.parbase.color-fillable div.newsfeed'],
    },
  ],
  sections: [
    {
      id: 'section-1',
      name: 'Hero campaign banner',
      selector: '#main-content > div.campaign-carousel.parbase.color-fillable:nth-of-type(3)',
      style: null,
      blocks: ['hero-campaign'],
      defaultContent: [],
    },
    {
      id: 'section-2',
      name: 'Product/topic link grid',
      selector: '#main-content > div.background-container.parbase.color-fillable:nth-of-type(5)',
      style: null,
      blocks: ['cards-topic'],
      defaultContent: [],
    },
    {
      id: 'section-3',
      name: 'Two-column small banner',
      selector: '#main-content > div.banner-small.parbase',
      style: null,
      blocks: ['columns-promo'],
      defaultContent: [],
    },
    {
      id: 'section-4',
      name: 'News & tips card feed',
      selector: '#main-content > div.related-topics.parbase.color-fillable',
      style: null,
      blocks: ['cards-news'],
      defaultContent: ['#main-content > div.related-topics.parbase.color-fillable div.title h2'],
    },
    {
      id: 'section-5',
      name: 'About / shortcuts link columns',
      selector: '#main-content > div.background-container.parbase.color-fillable:nth-of-type(12)',
      style: 'warm-cream',
      blocks: [],
      defaultContent: ['#main-content > div.background-container.parbase.color-fillable:nth-of-type(12)'],
    },
    {
      id: 'section-6',
      name: 'Price-comparison text block',
      selector: '#main-content > div.text',
      style: null,
      blocks: [],
      defaultContent: ['#main-content > div.text'],
    },
  ],
};

// TRANSFORMER REGISTRY - Array of transformer functions.
// Section transformer runs after cleanup (in afterTransform hook), and only when the
// template has 2+ sections.
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - The hook name ('beforeTransform' or 'afterTransform')
 * @param {Element} element - The DOM element to transform (typically document.body or main)
 * @param {Object} payload - The payload containing { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  // Pass PAGE_TEMPLATE to transformers so they can access section information
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

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

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
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

    // 1. Execute beforeTransform transformers (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // Already replaced by earlier parser
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

    // 4. Execute afterTransform transformers (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path (full localized path without extension).
    //    Map the root/homepage URL to `/index` to avoid the bundled importer's
    //    empty-path crash (`.cwd is not a function`).
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
