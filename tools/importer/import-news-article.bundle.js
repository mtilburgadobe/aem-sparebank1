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

  // tools/importer/import-news-article.js
  var import_news_article_exports = {};
  __export(import_news_article_exports, {
    default: () => import_news_article_default
  });

  // tools/importer/parsers/article-header.js
  function parse(element, { document: document2 }) {
    const img = element.querySelector(".sb1-article__header-image img, figure img, img");
    let imageCell = "";
    if (img && img.getAttribute("src")) {
      const figcap = element.querySelector(".sb1-article__header-image figcaption, .sb1-article__header-image .image__text");
      if (figcap && figcap.textContent.trim()) {
        const fig = document2.createElement("figure");
        fig.append(img);
        const cap = document2.createElement("figcaption");
        cap.textContent = figcap.textContent.trim();
        fig.append(cap);
        imageCell = fig;
      } else {
        imageCell = img;
      }
    }
    const tagEl = element.querySelector(".tag .tag__item, .tag__item");
    let tagCell = "";
    if (tagEl && tagEl.textContent.trim()) {
      const p = document2.createElement("p");
      p.textContent = tagEl.textContent.trim();
      tagCell = p;
    }
    const h1 = element.querySelector(".title h1, h1");
    let titleCell = "";
    if (h1 && h1.textContent.trim()) {
      const heading = document2.createElement("h1");
      heading.textContent = h1.textContent.trim();
      titleCell = heading;
    }
    const nameEl = element.querySelector(".author-text__name");
    const dateEl = element.querySelector(".author-text__date");
    let nameCell = "";
    if (nameEl && nameEl.textContent.trim()) {
      const p = document2.createElement("p");
      p.textContent = nameEl.textContent.trim();
      nameCell = p;
    }
    let dateCell = "";
    if (dateEl && dateEl.textContent.trim()) {
      const p = document2.createElement("p");
      p.textContent = dateEl.textContent.trim();
      dateCell = p;
    }
    if (!imageCell && !tagCell && !titleCell && !nameCell && !dateCell) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [
      [imageCell],
      [tagCell],
      [titleCell],
      [nameCell],
      [dateCell]
    ];
    const block = WebImporter.Blocks.createBlock(document2, { name: "article-header", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/text-and-image.js
  function parse2(element, { document: document2 }) {
    const row = element.querySelector(".text-and-image__row") || element;
    const cols = Array.from(row.querySelectorAll(":scope > .text-and-image__col, :scope > .ffe-grid__col"));
    const buildCell = (col) => {
      const parts = [];
      const img = col.querySelector(".image img, figure img, img");
      if (img && img.getAttribute("src")) {
        const figcap = col.querySelector("figcaption.image__text, .image__text");
        if (figcap && figcap.textContent.trim()) {
          const fig = document2.createElement("figure");
          fig.append(img);
          const cap = document2.createElement("figcaption");
          cap.textContent = figcap.textContent.trim();
          fig.append(cap);
          parts.push(fig);
        } else {
          parts.push(img);
        }
      }
      const textWrap = col.querySelector(".text .text-content, .text-content, .text");
      if (textWrap) {
        textWrap.querySelectorAll(":scope > *").forEach((child) => {
          if (child.textContent.trim() || child.querySelector("img, a")) parts.push(child);
        });
      }
      col.querySelectorAll(".buttongroup a.ffe-button, a.ffe-button").forEach((a) => {
        if (!a.closest(".text-content")) {
          const p = document2.createElement("p");
          const link = document2.createElement("a");
          link.setAttribute("href", a.getAttribute("href") || "#");
          link.textContent = (a.textContent || "").trim();
          p.append(link);
          parts.push(p);
        }
      });
      return parts;
    };
    const cells = [];
    if (cols.length >= 2) {
      cells.push([buildCell(cols[0]), buildCell(cols[1])]);
    } else if (cols.length === 1) {
      cells.push([buildCell(cols[0])]);
    }
    const hasContent = cells.some((r) => r.some((c) => c.length));
    if (!cells.length || !hasContent) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "text-and-image", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-news.js
  function parse3(element, { document: document2 }) {
    let cards = Array.from(element.querySelectorAll(".card"));
    const relatedMode = cards.length === 0;
    if (relatedMode) {
      cards = Array.from(element.querySelectorAll("article.related-list__item, .related-list__item"));
    }
    const cells = [];
    cards.forEach((card) => {
      var _a;
      let image;
      let tag;
      let title;
      let date;
      if (relatedMode) {
        const imageEl = Array.from(card.querySelectorAll("img")).find((im) => im.getAttribute("src") && !/video-ikon/i.test(im.getAttribute("src")));
        image = imageEl || null;
        const link = card.querySelector("a[href]");
        const titleText = (((_a = card.querySelector(".related-list__text")) == null ? void 0 : _a.textContent) || (link == null ? void 0 : link.getAttribute("title")) || (link == null ? void 0 : link.textContent) || "").trim();
        if (link && titleText) {
          const a = document2.createElement("a");
          a.setAttribute("href", link.getAttribute("href"));
          a.textContent = titleText;
          title = a;
        }
      } else {
        const imageEl = card.querySelector(
          ".card__container-image img, .card__container-image picture img"
        );
        image = imageEl && imageEl.getAttribute("src") ? imageEl : null;
        tag = card.querySelector(".card__tag");
        title = card.querySelector(".card__title, a.card__title, .card__container-content-wrapper a");
        date = card.querySelector(".card__date");
      }
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

  // tools/importer/parsers/article-tags.js
  function parse4(element, { document: document2 }) {
    const heading = element.querySelector("h2, h3, .related-list__header");
    const links = Array.from(element.querySelectorAll("a[href]"));
    if (links.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    const headingText = heading && heading.textContent.trim();
    if (headingText) {
      const h = document2.createElement("h2");
      h.textContent = headingText;
      cells.push([h]);
    }
    const linkPara = document2.createElement("p");
    links.forEach((a) => {
      const link = document2.createElement("a");
      link.setAttribute("href", a.getAttribute("href"));
      link.textContent = (a.textContent || "").trim();
      linkPara.append(link);
      linkPara.append(document2.createTextNode(" "));
    });
    cells.push([linkPara]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "article-tags", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/quote.js
  function parse5(element, { document: document2 }) {
    const textEl = element.querySelector(".quote__text");
    const nameEl = element.querySelector(".quote__name, .quote__reference-person");
    const quoteText = ((textEl == null ? void 0 : textEl.textContent) || "").trim();
    if (!quoteText) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    const bq = document2.createElement("blockquote");
    bq.textContent = quoteText;
    cells.push([bq]);
    const attribution = ((nameEl == null ? void 0 : nameEl.textContent) || "").trim();
    if (attribution) {
      const p = document2.createElement("p");
      p.textContent = attribution;
      cells.push([p]);
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "quote", cells });
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
        "footer.footer-wrapper",
        "footer.footer"
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
        "div.some",
        "div.glossary-backdrop",
        "div.glossary-modal"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "button.button--open-modal"
      ]);
      element.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href");
        if (!href) return;
        let path = href.replace(/^https?:\/\/www\.sparebank1\.no/, "");
        if (!path.startsWith("/")) return;
        path = path.replace(/^\/content\/sites\/sb1(?=\/)/, "");
        path = path.replace(/\.html(?=$|[?#])/, "");
        if (path !== href) a.setAttribute("href", path);
      });
      element.querySelectorAll("div.sb1-article, div.sb1-story__body").forEach((wrapper) => {
        wrapper.replaceWith(...wrapper.childNodes);
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

  // tools/importer/import-news-article.js
  var parsers = {
    "article-header": parse,
    "text-and-image": parse2,
    "cards-news": parse3,
    "article-tags": parse4,
    quote: parse5
  };
  var PAGE_TEMPLATE = {
    name: "news-article",
    description: "News/article page (body class 'sb1-article__layout1'): article header (hero image + caption, category tag chip, H1, author/date byline), a rich article body (ingress + H2 sections + paragraphs + captioned images + text-and-image bands + centered CTA buttons), and an aside with related-article cards and topic tags.",
    urls: [
      "https://www.sparebank1.no/nb/bank/privat/sparing/markedsnytt/artikler/topp-10-fond.html"
    ],
    blocks: [
      {
        name: "article-header",
        instances: ["#main-content div.sb1-article__header"]
      },
      {
        name: "text-and-image",
        instances: [
          "#main-content div.sb1-article__content div.text-and-image",
          "#main-content div.text-and-image"
        ]
      },
      {
        name: "quote",
        instances: [
          "#main-content section.quote",
          "#main-content div.quote"
        ]
      },
      {
        name: "cards-news",
        instances: [
          "#main-content div.sb1-article__aside div.sb1-article__aside-related",
          "#main-content div.sb1-article__aside div.related-list"
        ]
      },
      {
        name: "article-tags",
        instances: ["#main-content div.sb1-article__aside div.tags"]
      }
    ],
    sections: [
      {
        id: "section-1",
        name: "Article header",
        selector: "#main-content div.sb1-article__header",
        style: null,
        blocks: ["article-header"],
        defaultContent: []
      },
      {
        id: "section-2",
        name: "Article body (ingress + rich text)",
        selector: "#main-content div.sb1-article__content",
        style: "article-body",
        blocks: ["text-and-image"],
        defaultContent: ["#main-content div.sb1-article__content"]
      },
      {
        id: "section-3",
        name: "Relaterte artikler + tema",
        selector: "#main-content div.sb1-article__aside",
        style: null,
        blocks: ["cards-news", "article-tags"],
        defaultContent: ["#main-content div.sb1-article__aside h2"]
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
      for (const selector of blockDef.instances) {
        const elements = document2.querySelectorAll(selector);
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
  var import_news_article_default = {
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
  return __toCommonJS(import_news_article_exports);
})();
