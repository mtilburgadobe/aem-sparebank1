/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: sparebank1 section breaks + section metadata.
 *
 * Runs in afterTransform ONLY. Reads sections from payload.template.sections and,
 * for each section (reverse order):
 *   • inserts a clean <hr> section break before the section (all non-first sections)
 *   • creates a "Section Metadata" block for sections that declare a `style`
 *
 * For the bank-landing-page template (6 sections), section-5
 * (About / shortcuts link columns) carries style "warm-cream"; the rest have no
 * style. Expected output: 5 section breaks + 1 Section Metadata block.
 *
 * ── Resolving each section's anchor element ──────────────────────────────────
 * page-templates.json section selectors are `:nth-of-type()` paths against the
 * ORIGINAL DOM. This transformer must work in two contexts:
 *   1. Validator: runs alone on the raw page → the template selectors match
 *      exactly, so querySelector(section.selector) resolves each section.
 *   2. Real import pipeline: runs after the cleanup transformer (removes the
 *      div.hr spacers, hidden modals, h1, empty carousel) and after block parsers
 *      (replace block <div>s with <table>s). Those changes shift the nth-of-type
 *      counts, so the raw selectors no longer match. In that state #main-content's
 *      direct element children ARE the sections, one per section, in template
 *      order — so we fall back to a positional snapshot.
 * Inserted <hr> and Section Metadata <table> nodes are never <div>s, so they do
 * not disturb the `div:nth-of-type()` ordinals of sections resolved later.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  const sections = payload && payload.template && payload.template.sections;
  if (!Array.isArray(sections) || sections.length < 2) return;

  const mainContent = element.querySelector('#main-content') || element;

  // Positional fallback snapshot: top-level element children of #main-content that
  // are not section separators (<hr>) or Section Metadata tables. Captured BEFORE
  // any insertions. Used only when a section's template selector does not resolve
  // (i.e. in the real pipeline, post-cleanup/post-parser).
  const positional = Array.from(mainContent.children).filter((node) => {
    if (node.nodeType !== 1) return false;
    if (node.tagName === 'HR') return false;
    if (node.tagName === 'TABLE') {
      const th = node.querySelector('th');
      if (th && th.textContent.trim() === 'Section Metadata') return false;
    }
    return true;
  });

  const resolveSectionElement = (section, index) => {
    if (section.selector) {
      const bySelector = element.querySelector(section.selector);
      if (bySelector) return bySelector;
    }
    // Fallback: map by section order onto the current top-level children.
    return positional[index] || null;
  };

  // Reverse order so insertions never shift the anchors of not-yet-processed sections.
  for (let i = sections.length - 1; i >= 0; i -= 1) {
    const section = sections[i];
    const sectionEl = resolveSectionElement(section, i);
    if (!sectionEl) {
      // eslint-disable-next-line no-console
      console.warn(`[sparebank1-sections] Could not resolve section "${section.id || i}"`);
      continue;
    }

    // Section Metadata block for styled sections — placed after the section's
    // content so it sits inside this section (before the next section break).
    if (section.style) {
      const metaBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      sectionEl.after(metaBlock);
    }

    // Section break before every non-first section that has preceding content.
    if (i > 0 && sectionEl.previousElementSibling) {
      sectionEl.before(document.createElement('hr'));
    }
  }
}
