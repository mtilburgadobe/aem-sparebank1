import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/* Decorative inline SVG icons for the contact tiles (source uses inline SVGs,
   not image files). Keyed by the tile's link label. */
const TILE_ICONS = {
  'Ring oss': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15.6 15.6 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .57 3.6 1 1 0 0 1-.25 1z"/></svg>',
  'Avtal møte': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2zm12 8v9H5v-9zM5 6h14v2H5z"/></svg>',
  'Skriv til oss': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 4.2V18h16V8.2l-8 5z M20 6H4l8 5z"/></svg>',
  'Finn kontor': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
  Chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 1-2z"/></svg>',
};

/**
 * Builds the contact section (band 1): heading, "go to service" link, a row of
 * icon tiles, and a back-to-top link.
 * @param {Element} section The first fragment section div
 */
function decorateContactSection(section) {
  section.classList.add('footer-contact');

  // The tile list is the <ul>; turn each <li> into an icon tile.
  const list = section.querySelector('ul');
  if (list) {
    list.classList.add('footer-contact-tiles');
    [...list.children].forEach((li) => {
      li.classList.add('footer-contact-tile');
      const link = li.querySelector('a');
      if (!link) return;
      // The label is the link text; any trailing text node is the subtext.
      const label = link.textContent.trim();
      const subtext = (link.nextSibling?.textContent || '').trim();
      const icon = TILE_ICONS[label] || '';

      link.classList.add('footer-contact-tile-link');
      const subMarkup = subtext ? `<span class="footer-contact-tile-sub">${subtext}</span>` : '';
      link.innerHTML = `<span class="footer-contact-tile-icon">${icon}</span><span class="footer-contact-tile-label">${label}</span>${subMarkup}`;
      // Remove the loose trailing text node now that it lives in the link.
      [...li.childNodes].forEach((n) => { if (n !== link) n.remove(); });
    });
  }

  // The last paragraph is the back-to-top link.
  const backToTop = section.querySelector('p:last-of-type a[href="#top"]');
  if (backToTop) {
    backToTop.closest('p').classList.add('footer-back-to-top');
    backToTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

/**
 * Builds the navy band (band 2): link columns, social icons, legal links, and
 * the address. The fragment provides h2 + ul groups in order; the final ul
 * (all-legal links) and trailing paragraph (address) form the bottom bar.
 * @param {Element} section The second fragment section div
 */
function decorateLinkSection(section) {
  section.classList.add('footer-links');

  const headings = [...section.querySelectorAll('h2')];
  const lists = [...section.querySelectorAll('ul')];

  // Wrap each heading + its following list into a column.
  const columns = document.createElement('div');
  columns.className = 'footer-columns';
  headings.forEach((h) => {
    const col = document.createElement('div');
    col.className = 'footer-column';
    const list = h.nextElementSibling && h.nextElementSibling.tagName === 'UL' ? h.nextElementSibling : null;
    col.append(h);
    if (list) {
      if (h.textContent.trim() === 'Sosiale medier') list.classList.add('footer-social');
      col.append(list);
    }
    columns.append(col);
  });
  section.prepend(columns);

  // The remaining ul (no heading before it) is the legal-links row.
  const legalList = lists.find((ul) => !ul.classList.contains('footer-social')
    && !ul.closest('.footer-column'));
  const bottomBar = document.createElement('div');
  bottomBar.className = 'footer-bottom-bar';
  if (legalList) {
    legalList.classList.add('footer-legal');
    bottomBar.append(legalList);
  }
  const address = section.querySelector('p');
  if (address) {
    address.classList.add('footer-address');
    bottomBar.append(address);
  }
  section.append(bottomBar);
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment. Content is served under /content/ on the local dev
  // server and at root in production; prefer /content/footer when the current
  // page is itself under /content/ so the authored footer resolves locally
  // (loadFragment falls back to the alternate prefix otherwise).
  const footerMeta = getMetadata('footer');
  let footerPath;
  if (footerMeta) {
    footerPath = new URL(footerMeta, window.location).pathname;
  } else if (window.location.pathname.startsWith('/content/')) {
    footerPath = '/content/footer';
  } else {
    footerPath = '/footer';
  }
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Fragment image src values (e.g. images/linkedin.svg) are relative to the
  // footer fragment, not the host page. Rebase them against the fragment path
  // so they resolve regardless of how deep the current page is.
  const base = footerPath.replace(/\/[^/]*$/, '/');
  footer.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('/') && !/^https?:\/\//.test(src)) {
      img.setAttribute('src', `${base}${src}`);
    }
  });

  const sections = [...footer.children];
  if (sections[0]) decorateContactSection(sections[0]);
  if (sections[1]) decorateLinkSection(sections[1]);

  block.append(footer);
}
