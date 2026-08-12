import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-news-card-image';
      else div.className = 'cards-news-card-body';
    });
    ul.append(li);
  });

  // The body arrives as a single <p> holding: category text, the title link,
  // then a date text. Split those into labelled elements so they can be styled
  // as tag / title / date (matches the source card layout).
  ul.querySelectorAll('.cards-news-card-body').forEach((body) => {
    const p = body.querySelector('p') || body;
    const link = p.querySelector('a');
    if (!link) return;

    const category = (link.previousSibling?.textContent || '').trim();
    const date = (link.nextSibling?.textContent || '').trim();

    const frag = document.createDocumentFragment();
    if (category) {
      const tag = document.createElement('span');
      tag.className = 'cards-news-tag';
      tag.textContent = category;
      frag.append(tag);
    }
    link.classList.add('cards-news-title');
    frag.append(link);
    if (date) {
      const dateEl = document.createElement('span');
      dateEl.className = 'cards-news-date';
      dateEl.textContent = date;
      frag.append(dateEl);
    }
    p.replaceWith(frag);
  });

  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));

  // On news-article pages the block is the "Relaterte artikler" aside. Two things
  // are added here, scoped to that aside so the landing "Nytt og nyttig" feed
  // (heading authored as default content above the block) stays untouched:
  //   1. The publish date, relocated from the article header into a white band at
  //      the very top of the (grey) aside column.
  //   2. The fixed "Relaterte artikler" section heading — the parser drops it
  //      because it lived inside the related-list wrapper the parser replaces.
  const isArticleAside = document.querySelector('main .article-header')
    && block.closest('.cards-news-container');
  if (isArticleAside) {
    const children = [];

    // Move the date out of the header byline to the top of the aside. The header
    // (eager section) is decorated before this lazy aside, so the element exists.
    const dateEl = document.querySelector('.article-header-date');
    const dateText = dateEl?.textContent.trim();
    if (dateText) {
      const dateBand = document.createElement('div');
      dateBand.className = 'cards-news-aside-date';
      dateBand.textContent = dateText;
      children.push(dateBand);
      dateEl.remove();
    }

    const heading = document.createElement('h2');
    heading.className = 'cards-news-heading';
    heading.textContent = 'Relaterte artikler';
    children.push(heading, ul);
    block.replaceChildren(...children);
  } else {
    block.replaceChildren(ul);
  }
}
