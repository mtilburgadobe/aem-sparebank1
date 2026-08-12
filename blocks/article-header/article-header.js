import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Decorates the article header: hero image (with optional caption), category tag
 * chip, H1 title, and an author/date byline.
 *
 * Expected authored structure — 5 rows, one cell each, in order:
 *   1: hero image (img/figure)   2: category tag text   3: H1 title
 *   4: author name text          5: publish date text
 * Any row may be empty; decoration is positional.
 * @param {Element} block The article-header block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const cellOf = (i) => rows[i]?.firstElementChild;

  const imageCell = cellOf(0);
  const tagCell = cellOf(1);
  const titleCell = cellOf(2);
  const nameCell = cellOf(3);
  const dateCell = cellOf(4);

  block.textContent = '';

  // Hero image (keep any caption). The caption may arrive as a <figcaption> or,
  // after the import round-trip flattens it, as plain text/paragraph sitting
  // alongside the image — so fall back to any text in the cell that isn't the
  // image itself.
  if (imageCell) {
    const img = imageCell.querySelector('img');
    let captionText = imageCell.querySelector('figcaption')?.textContent.trim() || '';
    if (!captionText) {
      // Any paragraph in the cell that doesn't contain the image is the caption.
      const captionPara = [...imageCell.querySelectorAll('p')]
        .find((p) => !p.querySelector('img, picture') && p.textContent.trim());
      captionText = captionPara?.textContent.trim() || '';
    }
    if (img) {
      const wrap = document.createElement('div');
      wrap.className = 'article-header-image';
      const optimized = createOptimizedPicture(img.src, img.alt || '', true, [{ width: '1200' }]);
      const figure = document.createElement('figure');
      figure.append(optimized);
      if (captionText) {
        const cap = document.createElement('figcaption');
        cap.textContent = captionText;
        figure.append(cap);
      }
      wrap.append(figure);
      block.append(wrap);
    }
  }

  // Category tag chip.
  const tagText = tagCell?.textContent.trim();
  if (tagText) {
    const tag = document.createElement('div');
    tag.className = 'article-header-tag';
    tag.textContent = tagText;
    block.append(tag);
  }

  // H1 title.
  const titleText = titleCell?.textContent.trim();
  if (titleText) {
    const h1 = document.createElement('h1');
    h1.className = 'article-header-title';
    h1.textContent = titleText;
    block.append(h1);
  }

  // Byline: "AV: <name>" + date.
  const nameText = nameCell?.textContent.trim();
  const dateText = dateCell?.textContent.trim();
  if (nameText || dateText) {
    const byline = document.createElement('div');
    byline.className = 'article-header-byline';
    if (nameText) {
      const name = document.createElement('span');
      name.className = 'article-header-author';
      name.textContent = `AV: ${nameText}`;
      byline.append(name);
    }
    if (dateText) {
      const date = document.createElement('span');
      date.className = 'article-header-date';
      date.textContent = dateText;
      byline.append(date);
    }
    block.append(byline);
  }
}
