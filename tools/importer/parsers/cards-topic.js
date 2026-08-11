/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-topic
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
 * Source: a background container holding topic columns (`.columns-grid__column`),
 * split across two `.columns-grid` rows separated by an <hr>. Each column has an
 * icon image and a text wrapper with a linked <h2> heading plus a list of link
 * paragraphs. Each column becomes one card row.
 */
export default function parse(element, { document }) {
  // Each topic item is a grid column. querySelectorAll picks up all columns across
  // both inner columns-grid rows.
  const cards = Array.from(element.querySelectorAll('.columns-grid__column'));

  const cells = [];

  cards.forEach((card) => {
    // Cell 1: icon/image for the card.
    const image = card.querySelector('.image img, picture img, img');

    // Cell 2: text content — linked heading followed by the list of link paragraphs.
    const heading = card.querySelector('.text-wrapper h2, .text h2, h2, h3, h4');
    const paragraphs = Array.from(
      card.querySelectorAll('.text-wrapper p, .text p'),
    );

    // Skip empty/structural columns with no heading and no links.
    if (!heading && paragraphs.length === 0 && !image) return;

    const contentCell = [];
    if (heading) contentCell.push(heading);
    contentCell.push(...paragraphs);

    // Keep a fixed 2-column structure; pad the image cell if the icon is missing.
    cells.push([image || '', contentCell]);
  });

  // Empty-block guard: bail gracefully if no cards were found.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-topic', cells });
  element.replaceWith(block);
}
