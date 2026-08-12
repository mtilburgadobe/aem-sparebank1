/**
 * Decorates the "Relaterte tema" tag list: a heading followed by hashtag links
 * rendered as pill chips.
 * @param {Element} block The article-tags block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  block.textContent = '';

  // First row = heading (optional); remaining row(s) = the tag links.
  const headingRow = rows[0];
  const headingEl = headingRow?.querySelector('h2, h3');
  if (headingEl) {
    const h = document.createElement('h2');
    h.className = 'article-tags-heading';
    h.textContent = headingEl.textContent.trim();
    block.append(h);
  }

  const list = document.createElement('div');
  list.className = 'article-tags-list';
  const linkRow = headingEl ? rows[1] : rows[0];
  linkRow?.querySelectorAll('a[href]').forEach((a) => {
    a.classList.add('article-tags-chip');
    list.append(a);
  });
  block.append(list);
}
