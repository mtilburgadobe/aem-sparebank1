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

  // tools/importer/import-bank-landing-page.js
  var import_bank_landing_page_exports = {};
  __export(import_bank_landing_page_exports, {
    default: () => import_bank_landing_page_default
  });

  // tools/importer/parsers/hero-campaign.js
  function parse(element, { document: document2 }) {
    const bgImage = element.querySelector(
      '.campaign-bg img, .campaign-bg__img img, img[class*="campaign-bg"], .image-wrapper img, img'
    );
    const heading = element.querySelector(
      ".campaign-content h1, .campaign-content h2, .campaign-content h3, .text-wrapper h1, .text-wrapper h2, .text-wrapper h3, h1, h2"
    );
    const description = element.querySelector(
      ".text-wrapper p, .campaign-content p, p"
    );
    const cta = element.querySelector(
      "a.action-btn, .button-wrapper a, a.ffe-button"
    );
    if (!heading && !description && !cta && !bgImage) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (bgImage) {
      cells.push([bgImage]);
    }
    const contentCell = [];
    if (heading) contentCell.push(heading);
    if (description) contentCell.push(description);
    if (cta) contentCell.push(cta);
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-campaign", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-topic.js
  function parse2(element, { document: document2 }) {
    const cards = Array.from(element.querySelectorAll(".columns-grid__column"));
    const cells = [];
    cards.forEach((card) => {
      const image = card.querySelector(".image img, picture img, img");
      const heading = card.querySelector(".text-wrapper h2, .text h2, h2, h3, h4");
      const paragraphs = Array.from(
        card.querySelectorAll(".text-wrapper p, .text p")
      );
      if (!heading && paragraphs.length === 0 && !image) return;
      const contentCell = [];
      if (heading) contentCell.push(heading);
      contentCell.push(...paragraphs);
      cells.push([image || "", contentCell]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-topic", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-promo.js
  function parse3(element, { document: document2 }) {
    const panels = Array.from(element.querySelectorAll(".banner-small__content"));
    const cells = [];
    const row = [];
    panels.forEach((panel) => {
      const imageEl = panel.querySelector(".banner-small__image img, .banner-small__bottom--image img, picture img, img");
      const image = imageEl && imageEl.getAttribute("src") ? imageEl : null;
      const heading = panel.querySelector(".banner-small__header, h2, h3, h4");
      const description = panel.querySelector(".banner-small__infotext, p");
      const cta = panel.querySelector(".banner-small__bottom--button a, a.ffe-button, .button-wrapper a");
      const columnCell = [];
      if (image) columnCell.push(image);
      if (heading) columnCell.push(heading);
      if (description) columnCell.push(description);
      if (cta) columnCell.push(cta);
      if (columnCell.length > 0) row.push(columnCell);
    });
    if (row.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    cells.push(row);
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-promo", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-news.js
  function parse4(element, { document: document2 }) {
    const cards = Array.from(element.querySelectorAll(".card"));
    const cells = [];
    cards.forEach((card) => {
      const imageEl = card.querySelector(
        ".card__container-image img, .card__container-image picture img"
      );
      const image = imageEl && imageEl.getAttribute("src") ? imageEl : null;
      const tag = card.querySelector(".card__tag");
      const title = card.querySelector(".card__title, a.card__title, .card__container-content-wrapper a");
      const date = card.querySelector(".card__date");
      if (!image && !tag && !title && !date) return;
      const contentCell = [];
      if (tag) contentCell.push(tag);
      if (title) contentCell.push(title);
      if (date) contentCell.push(date);
      cells.push([image || "", contentCell]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-news", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/sparebank1-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#opt-in",
        ".aem-optin-wrapper",
        "#search-area"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "nav.page-nav",
        "#outer-main-wrap > aside",
        "header.header",
        "div.market-nav",
        "div.bank-choice",
        "footer.footer-wrapper"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "#main-content div.send-to-bank-modal",
        "#main-content div.send-to-bank__loading",
        "#main-content > h1.visually-hidden",
        "#main-content > div.hr.parbase"
      ]);
      element.querySelectorAll("#main-content > div.campaign-carousel.parbase.color-fillable").forEach((el) => {
        if (el.textContent.trim() === "" && el.querySelectorAll("img, picture, a, table").length === 0) {
          el.remove();
        }
      });
      WebImporter.DOMUtils.remove(element, [
        "source",
        "noscript",
        "iframe",
        "link"
      ]);
    }
  }

  // tools/importer/transformers/sparebank1-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.afterTransform) return;
    const sections = payload && payload.template && payload.template.sections;
    if (!Array.isArray(sections) || sections.length < 2) return;
    const mainContent = element.querySelector("#main-content") || element;
    const positional = Array.from(mainContent.children).filter((node) => {
      if (node.nodeType !== 1) return false;
      if (node.tagName === "HR") return false;
      if (node.tagName === "TABLE") {
        const th = node.querySelector("th");
        if (th && th.textContent.trim() === "Section Metadata") return false;
      }
      return true;
    });
    const resolveSectionElement = (section, index) => {
      if (section.selector) {
        const bySelector = element.querySelector(section.selector);
        if (bySelector) return bySelector;
      }
      return positional[index] || null;
    };
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const sectionEl = resolveSectionElement(section, i);
      if (!sectionEl) {
        console.warn(`[sparebank1-sections] Could not resolve section "${section.id || i}"`);
        continue;
      }
      if (section.style) {
        const metaBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        sectionEl.after(metaBlock);
      }
      if (i > 0 && sectionEl.previousElementSibling) {
        sectionEl.before(document.createElement("hr"));
      }
    }
  }

  // tools/importer/import-bank-landing-page.js
  var parsers = {
    "hero-campaign": parse,
    "cards-topic": parse2,
    "columns-promo": parse3,
    "cards-news": parse4
  };
  var PAGE_TEMPLATE = {
    name: "bank-landing-page",
    description: "SpareBank 1 privat banking landing page: hero campaign banner, multi-column link/topic grids in a background container, a two-column small banner (bank switch / LO membership), a news & tips card feed, an about/shortcuts link section, and a price comparison text block.",
    urls: [
      "https://www.sparebank1.no/nb/bank/privat.html"
    ],
    blocks: [
      {
        name: "hero-campaign",
        instances: ["#main-content > div.campaign-carousel.parbase.color-fillable:nth-of-type(3)"]
      },
      {
        name: "cards-topic",
        instances: ["#main-content > div.background-container.parbase.color-fillable:nth-of-type(5)"]
      },
      {
        name: "columns-promo",
        instances: ["#main-content > div.banner-small.parbase"]
      },
      {
        name: "cards-news",
        instances: ["#main-content > div.related-topics.parbase.color-fillable div.newsfeed"]
      }
    ],
    sections: [
      {
        id: "section-1",
        name: "Hero campaign banner",
        selector: "#main-content > div.campaign-carousel.parbase.color-fillable:nth-of-type(3)",
        style: null,
        blocks: ["hero-campaign"],
        defaultContent: []
      },
      {
        id: "section-2",
        name: "Product/topic link grid",
        selector: "#main-content > div.background-container.parbase.color-fillable:nth-of-type(5)",
        style: null,
        blocks: ["cards-topic"],
        defaultContent: []
      },
      {
        id: "section-3",
        name: "Two-column small banner",
        selector: "#main-content > div.banner-small.parbase",
        style: null,
        blocks: ["columns-promo"],
        defaultContent: []
      },
      {
        id: "section-4",
        name: "News & tips card feed",
        selector: "#main-content > div.related-topics.parbase.color-fillable",
        style: null,
        blocks: ["cards-news"],
        defaultContent: ["#main-content > div.related-topics.parbase.color-fillable div.title h2"]
      },
      {
        id: "section-5",
        name: "About / shortcuts link columns",
        selector: "#main-content > div.background-container.parbase.color-fillable:nth-of-type(12)",
        style: "warm-cream",
        blocks: [],
        defaultContent: ["#main-content > div.background-container.parbase.color-fillable:nth-of-type(12)"]
      },
      {
        id: "section-6",
        name: "Price-comparison text block",
        selector: "#main-content > div.text",
        style: null,
        blocks: [],
        defaultContent: ["#main-content > div.text"]
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
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
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
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
  var import_bank_landing_page_default = {
    /**
     * Main transformation function (Helix Importer "one input / multiple outputs")
     */
    transform: (payload) => {
      const {
        document: document2,
        url,
        html,
        params
      } = payload;
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
  return __toCommonJS(import_bank_landing_page_exports);
})();
