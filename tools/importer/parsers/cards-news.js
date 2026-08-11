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
 * Source: a `.newsfeed` holding article `.card` items (split across two
 * `.newsfeed-wrap` groups). Each card has a main image, an uppercase category
 * tag (`.card__tag`), a linked title (`.card__title`), and an optional date
 * (`.card__date`). Each card becomes one 2-column row: [image | tag + title + date].
 */
export default function parse(element, { document }) {
  // Each article is a `.card`.
  const cards = Array.from(element.querySelectorAll('.card'));

  const cells = [];

  cards.forEach((card) => {
    // Cell 1: main article image. Restrict to the image container so we never pick
    // up the decorative arrow icon in `.card__container-content-arrow`.
    const imageEl = card.querySelector(
      '.card__container-image img, .card__container-image picture img',
    );
    const image = imageEl && imageEl.getAttribute('src') ? imageEl : null;

    // Cell 2 content — from the content wrapper (excludes the arrow container).
    const tag = card.querySelector('.card__tag');
    const title = card.querySelector('.card__title, a.card__title, .card__container-content-wrapper a');
    const date = card.querySelector('.card__date');

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
