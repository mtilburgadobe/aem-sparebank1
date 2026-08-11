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
    WebImporter.DOMUtils.remove(element, [
      'nav.page-nav',
      '#outer-main-wrap > aside',
      'header.header',
      'div.market-nav',
      'div.bank-choice',
      'footer.footer-wrapper',
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

    // 4) Leftover non-authorable elements. Empty <source> tags exist inside
    //    <picture> (line 329-330); the others are defensive (none may be present).
    WebImporter.DOMUtils.remove(element, [
      'source',
      'noscript',
      'iframe',
      'link',
    ]);
  }
}
