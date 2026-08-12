import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Decorates a two-column text-and-image band: one column holds a captioned image,
 * the other holds rich text (and optional buttons). Columns stack on mobile and
 * sit side-by-side on desktop, preserving the authored visual order.
 * @param {Element} block The text-and-image block element
 */
export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;
  const cols = [...row.children];
  block.classList.add(`text-and-image-${cols.length}-cols`);

  cols.forEach((col) => {
    col.classList.add('text-and-image-col');
    // Optimize images and flag image-only columns for layout.
    const img = col.querySelector('img');
    if (img) {
      col.classList.add('text-and-image-media');
      const optimized = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '750' }]);
      img.closest('picture')?.replaceWith(optimized);
      if (!img.closest('picture')) img.replaceWith(optimized);
    }
  });
}
