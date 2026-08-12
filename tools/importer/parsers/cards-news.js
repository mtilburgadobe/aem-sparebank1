/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-news
 * Base block: cards
 * Source: https://www.sparebank1.no/nb/bank/privat.html
 * Generated: 2026-08-11
 *
 * Library convention (cards): 2 columns, multiple rows.
 *   Row 1: block name (added by createBlock)
 *   Each subsequent row = one card:
 *     Cell 1: Image or Icon (mandatory)
 *     Cell 2: Text content — Title (heading), Description, Call-to-Action
 *
 * Two source shapes are supported:
 *   1. Landing "Nytt og nyttig" feed: a `.newsfeed` of `.card` items — each has
 *      a main image, an uppercase `.card__tag`, a linked `.card__title`, and an
 *      optional `.card__date`.
 *   2. Article "Relaterte artikler" list: `article.related-list__item` items —
 *      each is a single `<a>` wrapping a thumbnail image and a title (no tag/date).
 * Each card becomes one 2-column row: [image | tag + title + date].
 */
export default function parse(element, { document }) {
  // Prefer the landing `.card` shape; fall back to article `.related-list__item`.
  let cards = Array.from(element.querySelectorAll('.card'));
  const relatedMode = cards.length === 0;
  if (relatedMode) {
    cards = Array.from(element.querySelectorAll('article.related-list__item, .related-list__item'));
  }

  const cells = [];

  cards.forEach((card) => {
    let image;
    let tag;
    let title;
    let date;

    if (relatedMode) {
      // Related-articles card: an <a> wrapping a (lazy-loaded) thumbnail image or
      // a video placeholder, plus a title in span.related-list__text.
      // Skip the decorative video placeholder icon (video-ikon.svg).
      const imageEl = Array.from(card.querySelectorAll('img'))
        .find((im) => im.getAttribute('src') && !/video-ikon/i.test(im.getAttribute('src')));
      image = imageEl || null;
      // Title = the dedicated text span; fall back to the anchor's own text.
      const link = card.querySelector('a[href]');
      const titleText = (card.querySelector('.related-list__text')?.textContent
        || link?.getAttribute('title')
        || link?.textContent
        || '').trim();
      if (link && titleText) {
        const a = document.createElement('a');
        a.setAttribute('href', link.getAttribute('href'));
        a.textContent = titleText;
        title = a;
      }
    } else {
      // Cell 1: main article image. Restrict to the image container so we never pick
      // up the decorative arrow icon in `.card__container-content-arrow`.
      const imageEl = card.querySelector(
        '.card__container-image img, .card__container-image picture img',
      );
      image = imageEl && imageEl.getAttribute('src') ? imageEl : null;

      // Cell 2 content — from the content wrapper (excludes the arrow container).
      tag = card.querySelector('.card__tag');
      title = card.querySelector('.card__title, a.card__title, .card__container-content-wrapper a');
      date = card.querySelector('.card__date');
    }

    // Skip structural/empty cards.
    if (!image && !tag && !title && !date) return;

    const contentCell = [];
    if (tag) contentCell.push(tag);
    if (title) contentCell.push(title);
    if (date) contentCell.push(date);

    // Fixed 2-column structure; pad the image cell if a card has no usable image.
    cells.push([image || '', contentCell]);
  });

  // Empty-block guard: bail gracefully if no cards were found.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-news', cells });
  element.replaceWith(block);
}
