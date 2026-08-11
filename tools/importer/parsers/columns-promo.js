/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-promo
 * Base block: columns
 * Source: https://www.sparebank1.no/nb/bank/privat.html
 * Generated: 2026-08-11
 *
 * Library convention (columns): multiple columns/rows. First row = block name.
 * Subsequent rows have one cell per visual column; all rows share the same
 * column count. Column count is derived from the natural grouping in the source.
 *
 * Source: a `.banner-small` with two side-by-side promo panels, each a
 * `.banner-small__content` (bank-switch panel + LO-membership panel). Each panel
 * has an illustration/icon image, a heading, a short paragraph, and a CTA link.
 * → one row with two columns, one column per panel.
 */
export default function parse(element, { document }) {
  // Each promo panel is a `.banner-small__content`.
  const panels = Array.from(element.querySelectorAll('.banner-small__content'));

  const cells = [];
  const row = [];

  panels.forEach((panel) => {
    // Illustration/icon image for the panel (may sit at top or bottom of the panel).
    // Guard against empty inline-SVG placeholders that carry no usable src (the live
    // DOM lazy-swaps these); only keep an image that actually references an asset.
    const imageEl = panel.querySelector('.banner-small__image img, .banner-small__bottom--image img, picture img, img');
    const image = imageEl && imageEl.getAttribute('src') ? imageEl : null;
    // Heading.
    const heading = panel.querySelector('.banner-small__header, h2, h3, h4');
    // Short promo text.
    const description = panel.querySelector('.banner-small__infotext, p');
    // CTA link — the button anchor, not any image wrapper link.
    const cta = panel.querySelector('.banner-small__bottom--button a, a.ffe-button, .button-wrapper a');

    const columnCell = [];
    if (image) columnCell.push(image);
    if (heading) columnCell.push(heading);
    if (description) columnCell.push(description);
    if (cta) columnCell.push(cta);

    // Only add a column if it holds content (keeps the row's column count meaningful).
    if (columnCell.length > 0) row.push(columnCell);
  });

  // Empty-block guard: bail gracefully if no panels held content.
  if (row.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  cells.push(row);

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-promo', cells });
  element.replaceWith(block);
}
