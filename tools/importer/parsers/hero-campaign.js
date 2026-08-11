/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-campaign
 * Base block: hero
 * Source: https://www.sparebank1.no/nb/bank/privat.html
 * Generated: 2026-08-11
 *
 * Library convention (hero): 1 column, 3 rows.
 *   Row 1: block name (added by createBlock)
 *   Row 2: background image (optional)
 *   Row 3: title (heading), subheading (text), call-to-action (linked text)
 */
export default function parse(element, { document }) {
  // Background image — the campaign image lives inside a background <a> wrapper.
  // Extract the <img> element itself (not the wrapping link) for the image row.
  const bgImage = element.querySelector(
    '.campaign-bg img, .campaign-bg__img img, img[class*="campaign-bg"], .image-wrapper img, img',
  );

  // Heading — source uses an <h2> inside the text wrapper.
  const heading = element.querySelector(
    '.campaign-content h1, .campaign-content h2, .campaign-content h3, .text-wrapper h1, .text-wrapper h2, .text-wrapper h3, h1, h2',
  );

  // Subheading / lead paragraph.
  const description = element.querySelector(
    '.text-wrapper p, .campaign-content p, p',
  );

  // Call-to-action button link. Only the action button — NOT the background image
  // link (a.background / a.campaign-bg__img), which merely makes the image clickable.
  const cta = element.querySelector(
    'a.action-btn, .button-wrapper a, a.ffe-button',
  );

  // Empty-block guard: bail gracefully if there is no meaningful content.
  if (!heading && !description && !cta && !bgImage) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: background image (optional).
  if (bgImage) {
    cells.push([bgImage]);
  }

  // Row 3: content cell holding heading, subheading, and CTA (1-column block → one cell).
  const contentCell = [];
  if (heading) contentCell.push(heading);
  if (description) contentCell.push(description);
  if (cta) contentCell.push(cta);
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-campaign', cells });
  element.replaceWith(block);
}
