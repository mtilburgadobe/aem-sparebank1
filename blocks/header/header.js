import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates desktop width
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Toggles the mobile menu open/closed.
 * @param {Element} nav The nav element
 * @param {boolean} [forceExpanded] optional force state
 */
function toggleMenu(nav, forceExpanded = null) {
  const expanded = forceExpanded !== null
    ? !forceExpanded
    : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  if (button) {
    button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment. The migrated content lives under /content/nav; prefer it,
  // then fall back to a nav metadata override or the site root default.
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : null;
  let fragment = await loadFragment('/content/nav');
  if (!fragment) fragment = await loadFragment(navPath || '/nav');

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // Section 0 = brand bar (logo + top-level section links),
  // section 1 = main navigation, section 2 = tools (Bli kunde / Logg inn).
  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // Brand bar: separate the logo link from the section-link list.
  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const logoLink = navBrand.querySelector('a');
    if (logoLink) logoLink.classList.add('nav-logo');
    const sectionLinks = navBrand.querySelector('ul');
    if (sectionLinks) sectionLinks.classList.add('nav-brand-links');
  }

  // The nav fragment uses relative image paths (e.g. images/logo.svg) which the
  // browser would otherwise resolve against the current page URL. Rebase them
  // against the nav content location so they resolve regardless of page depth.
  nav.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('/') && !/^https?:\/\//.test(src)) {
      img.src = new URL(src, new URL('/content/nav.plain.html', window.location)).href;
    }
  });

  // Tools: style the CTA and login controls.
  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    // Top-level tool links: "Bli kunde" (CTA) and "Logg inn" (login).
    // The nav list may render as bare `<li><a>` (GitHub) or `<li><p><a>` (DA/
    // markdown conversion wraps links in a paragraph), so take each top-level
    // <li>'s first anchor rather than assuming a direct <li> > <a> relationship.
    const toolsList = navTools.querySelector('ul');
    toolsList?.querySelectorAll(':scope > li').forEach((li) => {
      const a = li.querySelector('a');
      if (!a) return;
      if (/logg\s*inn/i.test(a.textContent)) a.classList.add('nav-login');
      else a.classList.add('nav-cta');
    });

    // Login has a sub-list (Nettbank privat/bedrift) — mark it as a dropdown
    // that reveals its panel on hover/focus (CSS-driven). The "Logg inn" link
    // itself still navigates to the login page on click.
    const loginItem = navTools.querySelector('.nav-login')?.closest('li');
    const loginPanel = loginItem?.querySelector('ul');
    if (loginItem && loginPanel) {
      loginItem.classList.add('nav-login-item');
      loginPanel.classList.add('nav-login-panel');
    }

    // Build the search control as a link to the search page (matches the source,
    // where "Søk" opens search). Form controls live in JS per the nav contract.
    const search = document.createElement('a');
    search.className = 'nav-search';
    search.href = '/nb/bank/privat.html?search=';
    search.setAttribute('aria-label', 'Søk');
    search.innerHTML = '<span class="nav-search-icon"></span><span>Søk</span>';
    navTools.prepend(search);
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  // Keep desktop/mobile states consistent across viewport changes.
  const applyViewportState = () => {
    if (isDesktop.matches) {
      nav.setAttribute('aria-expanded', 'false');
      document.body.style.overflowY = '';
    }
  };
  applyViewportState();
  isDesktop.addEventListener('change', applyViewportState);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
