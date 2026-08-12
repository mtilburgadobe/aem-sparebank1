/* eslint-disable */
/* global WebImporter */
/**
 * Parser for text-and-image
 * Base block: columns
 * Source: https://www.sparebank1.no/nb/bank/.../artikler/*.html
 * Generated: 2026-08-11
 *
 * Source region: div.text-and-image — a two-column band inside the article body.
 *   div.text-and-image__row
 *     div.text-and-image__col (may carry --reverse)  → an <img>/figure OR rich text
 *     div.text-and-image__col                        → the other of the two
 * The `--reverse` modifier only changes which side the image sits on; the source
 * DOM already lays the two columns out in visual order, so we preserve that order
 * in the emitted 2-column row and let CSS render them side by side. Captions
 * (figcaption.image__text) are preserved.
 */
export default function parse(element, { document }) {
  const row = element.querySelector('.text-and-image__row') || element;
  const cols = Array.from(row.querySelectorAll(':scope > .text-and-image__col, :scope > .ffe-grid__col'));

  const buildCell = (col) => {
    const parts = [];
    // Image (with optional caption).
    const img = col.querySelector('.image img, figure img, img');
    if (img && img.getAttribute('src')) {
      const figcap = col.querySelector('figcaption.image__text, .image__text');
      if (figcap && figcap.textContent.trim()) {
        const fig = document.createElement('figure');
        fig.append(img);
        const cap = document.createElement('figcaption');
        cap.textContent = figcap.textContent.trim();
        fig.append(cap);
        parts.push(fig);
      } else {
        parts.push(img);
      }
    }
    // Rich text — take the text-content wrapper's meaningful children.
    const textWrap = col.querySelector('.text .text-content, .text-content, .text');
    if (textWrap) {
      textWrap.querySelectorAll(':scope > *').forEach((child) => {
        if (child.textContent.trim() || child.querySelector('img, a')) parts.push(child);
      });
    }
    // Buttons in the column.
    col.querySelectorAll('.buttongroup a.ffe-button, a.ffe-button').forEach((a) => {
      if (!a.closest('.text-content')) {
        const p = document.createElement('p');
        const link = document.createElement('a');
        link.setAttribute('href', a.getAttribute('href') || '#');
        link.textContent = (a.textContent || '').trim();
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

  // Empty-block guard.
  const hasContent = cells.some((r) => r.some((c) => c.length));
  if (!cells.length || !hasContent) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'text-and-image', cells });
  element.replaceWith(block);
}
