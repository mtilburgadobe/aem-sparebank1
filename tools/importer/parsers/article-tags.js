/* eslint-disable */
/* global WebImporter */
/**
 * Parser for article-tags
 * Base block: standalone
 * Source: https://www.sparebank1.no/nb/bank/.../artikler/*.html
 * Generated: 2026-08-11
 *
 * Source region: div.tags inside the article aside — a heading ("Relaterte tema")
 * followed by one or more hashtag links (e.g. #Fondssparing) that filter the
 * article index by topic.
 *
 * Emitted as a single-column block:
 *   Row 1: heading text (e.g. "Relaterte tema")
 *   Row 2: a paragraph holding all tag links
 */
export default function parse(element, { document }) {
  const heading = element.querySelector('h2, h3, .related-list__header');
  const links = Array.from(element.querySelectorAll('a[href]'));

  if (links.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  const headingText = heading && heading.textContent.trim();
  if (headingText) {
    const h = document.createElement('h2');
    h.textContent = headingText;
    cells.push([h]);
  }

  const linkPara = document.createElement('p');
  links.forEach((a) => {
    const link = document.createElement('a');
    link.setAttribute('href', a.getAttribute('href'));
    link.textContent = (a.textContent || '').trim();
    linkPara.append(link);
    linkPara.append(document.createTextNode(' '));
  });
  cells.push([linkPara]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'article-tags', cells });
  element.replaceWith(block);
}
