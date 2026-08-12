/* eslint-disable */
/* global WebImporter */
/**
 * Parser for article-header
 * Base block: standalone
 * Source: https://www.sparebank1.no/nb/bank/privat/sparing/markedsnytt/artikler/*.html
 * Generated: 2026-08-11
 *
 * Source region: div.sb1-article__header — contains a hero image (figure with an
 * optional caption), a category tag chip (div.tag > div.tag__item), the H1 title
 * (div.title > h1), a byline (section.author with author name + date), and social
 * share buttons (div.some — CHROME, excluded).
 *
 * Emitted as a fixed 5-row, single-column block so the block JS can decorate by
 * position even when a field is absent (empty cell is emitted to keep positions):
 *   Row 1: hero image (figure/picture/img)
 *   Row 2: category tag text
 *   Row 3: H1 title
 *   Row 4: author name text
 *   Row 5: publish date text
 */
export default function parse(element, { document }) {
  // Row 1 — hero image. Prefer the actual <img>; keep the figcaption if present.
  const img = element.querySelector('.sb1-article__header-image img, figure img, img');
  let imageCell = '';
  if (img && img.getAttribute('src')) {
    const figcap = element.querySelector('.sb1-article__header-image figcaption, .sb1-article__header-image .image__text');
    if (figcap && figcap.textContent.trim()) {
      const fig = document.createElement('figure');
      fig.append(img);
      const cap = document.createElement('figcaption');
      cap.textContent = figcap.textContent.trim();
      fig.append(cap);
      imageCell = fig;
    } else {
      imageCell = img;
    }
  }

  // Row 2 — category tag chip text.
  const tagEl = element.querySelector('.tag .tag__item, .tag__item');
  let tagCell = '';
  if (tagEl && tagEl.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = tagEl.textContent.trim();
    tagCell = p;
  }

  // Row 3 — H1 title.
  const h1 = element.querySelector('.title h1, h1');
  let titleCell = '';
  if (h1 && h1.textContent.trim()) {
    const heading = document.createElement('h1');
    heading.textContent = h1.textContent.trim();
    titleCell = heading;
  }

  // Rows 4/5 — byline: author name + publish date.
  const nameEl = element.querySelector('.author-text__name');
  const dateEl = element.querySelector('.author-text__date');
  let nameCell = '';
  if (nameEl && nameEl.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = nameEl.textContent.trim();
    nameCell = p;
  }
  let dateCell = '';
  if (dateEl && dateEl.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = dateEl.textContent.trim();
    dateCell = p;
  }

  // Empty-block guard: bail gracefully if there is no meaningful content.
  if (!imageCell && !tagCell && !titleCell && !nameCell && !dateCell) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [
    [imageCell],
    [tagCell],
    [titleCell],
    [nameCell],
    [dateCell],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'article-header', cells });
  element.replaceWith(block);
}
