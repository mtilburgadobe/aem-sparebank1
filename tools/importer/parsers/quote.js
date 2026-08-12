/* eslint-disable */
/* global WebImporter */
/**
 * Parser for quote
 * Base block: standalone
 * Source: https://www.sparebank1.no/nb/bank/.../artikler/*.html (sb1-story layout)
 * Generated: 2026-08-11
 *
 * Source region: section.quote > blockquote.bio-quote — a pull-quote with the
 * quotation text (.quote__text) and an attribution name (.quote__name). The
 * "Les mer" modal button is chrome and is excluded.
 *
 * Emitted as a single-column, 2-row block:
 *   Row 1: quotation text (blockquote)
 *   Row 2: attribution (paragraph) — omitted when absent
 */
export default function parse(element, { document }) {
  const textEl = element.querySelector('.quote__text');
  const nameEl = element.querySelector('.quote__name, .quote__reference-person');

  const quoteText = (textEl?.textContent || '').trim();
  if (!quoteText) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  const bq = document.createElement('blockquote');
  bq.textContent = quoteText;
  cells.push([bq]);

  const attribution = (nameEl?.textContent || '').trim();
  if (attribution) {
    const p = document.createElement('p');
    p.textContent = attribution;
    cells.push([p]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'quote', cells });
  element.replaceWith(block);
}
