/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: sparebank1 site-wide cleanup.
 *
 * Removes non-authorable site chrome and leftover markup so the import contains
 * only page-level authorable content. ALL selectors below were verified against
 * migration-work/cleaned.html for https://www.sparebank1.no/nb/bank/privat.html.
 *
 * ── Hook-timing rule (important for this site) ────────────────────────────────
 * Block/section selectors in page-templates.json rely on `:nth-of-type()` counts
 * of `#main-content > div` children, and block parsers run BETWEEN beforeTransform
 * and afterTransform. Two hidden widgets live inside #main-content *before* the
 * nth-of-type-targeted blocks:
 *   div.send-to-bank-modal          → div:nth-of-type(1)
 *   div.send-to-bank__loading       → div:nth-of-type(2)
 *   (campaign-carousel is nth-of-type(3), background-container nth-of-type(5))
 * Removing anything inside #main-content in beforeTransform would shift those
 * indices and break the parsers. Therefore:
 *   • beforeTransform → only chrome OUTSIDE #main-content (safe, no index shift)
 *   • afterTransform  → interior #main-content non-authorable + final cleanup
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Overlays / cookie consent — outside #main-content, safe to strip early.
    // Found in cleaned.html:
    //   line 2197 <div id="opt-in">           (cookie-consent banner)
    //   line  304 <div class="aem-optin-wrapper"> (opt-in placeholder, before <main>)
    //   line  116 <div id="search-area" class="search-overlay hide"> (search overlay)
    WebImporter.DOMUtils.remove(element, [
      '#opt-in',
      '.aem-optin-wrapper',
      '#search-area',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // 1) Structural site chrome — all direct children of #outer-main-wrap and
    //    siblings of #main-content (verified via outer-main-wrap child scan):
    //      <nav class="page-nav">        (skip links)
    //      <aside>                        (global message / notification)
    //      <header class="header ...">    (site nav + bank-picker)
    //      <div class="market-nav">       (market navigation)
    //      <div class="bank-choice">      (local bank-picker widget)
    //      <footer class="footer-wrapper">(site footer)
    //
    // On article pages (body.sb1-article__layout1) the nav header and the site
    // footer are rendered INSIDE #main-content as <header class="header"> and
    // <footer class="footer"> (NOT footer-wrapper) — hence the extra footer.footer
    // selector so the "Snarveier / Logg inn / Sosiale medier" footer band is not
    // ingested as article content.
    WebImporter.DOMUtils.remove(element, [
      'nav.page-nav',
      '#outer-main-wrap > aside',
      'header.header',
      'div.market-nav',
      'div.bank-choice',
      'footer.footer-wrapper',
      'footer.footer',
    ]);

    // 2) Interior #main-content non-authorable content. Removed AFTER parsers so
    //    the nth-of-type selectors stayed intact during block parsing.
    //      div.send-to-bank-modal            (line 311, hidden modal)
    //      div.send-to-bank__loading         (line 313, hidden loading spinner)
    //      h1.visually-hidden                (line 317, a11y-only page title "Privat")
    //      div.hr.parbase                    (spacer dividers; section transformer
    //                                         re-adds clean <hr> section breaks)
    WebImporter.DOMUtils.remove(element, [
      '#main-content div.send-to-bank-modal',
      '#main-content div.send-to-bank__loading',
      '#main-content > h1.visually-hidden',
      '#main-content > div.hr.parbase',
    ]);

    // 3) Empty campaign-carousel (page-structure.json: nth-of-type(8), childCount 0).
    //    It has no authorable content. Not targeted by the hero-campaign parser
    //    (which matches only nth-of-type(3)). Remove any empty campaign-carousel.
    element.querySelectorAll('#main-content > div.campaign-carousel.parbase.color-fillable')
      .forEach((el) => {
        if (el.textContent.trim() === '' && el.querySelectorAll('img, picture, a, table').length === 0) {
          el.remove();
        }
      });

    // 4) Article-page chrome (body.sb1-article__layout1). These live INSIDE the
    //    article and are non-authorable UI:
    //      div.some                 (Facebook/LinkedIn/Twitter share buttons)
    //      div.glossary-backdrop    (hidden glossary overlay)
    //      div.glossary-modal       (hidden per-term glossary popup)
    WebImporter.DOMUtils.remove(element, [
      'div.some',
      'div.glossary-backdrop',
      'div.glossary-modal',
    ]);

    // 5) Article "story" variant (body.sb1-story): the long-form layout renders
    //    a <header class="... sb1-story__header"> (site nav — already covered by
    //    header.header above) and a single <div class="sb1-story__body"> wrapper.
    //    There is no separate tag/byline/aside. Remove the "Les mer" modal button
    //    that trails pull-quotes (chrome).
    WebImporter.DOMUtils.remove(element, [
      'button.button--open-modal',
    ]);

    // 5b) Normalize internal link hrefs to EDS paths. The source authors internal
    //    links two ways, neither of which resolves on the migrated site:
    //      /content/sites/sb1/nb/bank/.../page.html  (AEM repository path)
    //      /nb/bank/.../page.html                     (public path WITH .html)
    //    EDS serves these at /nb/bank/.../page (no /content/sites/sb1 prefix, no
    //    .html extension), so related-article and topic links 404 otherwise. Strip
    //    the repo prefix and the .html suffix while preserving any query/hash.
    element.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href) return;
      // Only touch site-internal links. Cover root-relative links and absolute
      // links on any sparebank1.no host — including link-shortener/redirect
      // subdomains like lenker.sparebank1.no, which still carry /content paths.
      let path = href
        .replace(/^https?:\/\/[a-z0-9-]+\.sparebank1\.no/, '');
      if (!path.startsWith('/')) return;
      // Drop the AEM repository prefix.
      path = path.replace(/^\/content\/sites\/sb1(?=\/)/, '');
      // Strip .html before any ?query or #hash (e.g. /a/b.html?x=1 → /a/b?x=1).
      path = path.replace(/\.html(?=$|[?#])/, '');
      if (path !== href) a.setAttribute('href', path);
    });

    // 6) Unwrap the article container(s) so their regions become direct children
    //    of #main-content. For sb1-article that yields three sections (header,
    //    content, aside); for sb1-story it flattens the single body wrapper. The
    //    sections transformer maps top-level #main-content children to sections
    //    positionally, so the wrapper must be removed before it runs (cleanup is
    //    ordered before sections in the transformer registry). No-op when neither
    //    wrapper exists (non-article templates).
    element.querySelectorAll('div.sb1-article, div.sb1-story__body').forEach((wrapper) => {
      wrapper.replaceWith(...wrapper.childNodes);
    });

    // 6) Leftover non-authorable elements. Empty <source> tags exist inside
    //    <picture> (line 329-330); the others are defensive (none may be present).
    WebImporter.DOMUtils.remove(element, [
      'source',
      'noscript',
      'iframe',
      'link',
    ]);
  }
}
