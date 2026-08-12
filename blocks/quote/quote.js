/**
 * Decorates a pull-quote: quotation text + optional attribution.
 * @param {Element} block The quote block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  block.textContent = '';

  const textRow = rows[0];
  const text = textRow?.textContent.trim();
  if (text) {
    const bq = document.createElement('blockquote');
    bq.className = 'quote-text';
    bq.textContent = text;
    block.append(bq);
  }

  const attrRow = rows[1];
  const attr = attrRow?.textContent.trim();
  if (attr) {
    const cite = document.createElement('p');
    cite.className = 'quote-attribution';
    cite.textContent = attr;
    block.append(cite);
  }
}
