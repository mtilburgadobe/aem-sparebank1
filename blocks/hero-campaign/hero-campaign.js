export default function decorate(block) {
  const columns = [...block.children];
  const imageCol = columns.find((col) => col.querySelector('picture'));
  const contentCol = columns.find((col) => !col.querySelector('picture'));

  if (imageCol) imageCol.classList.add('hero-campaign-image');
  if (contentCol) contentCol.classList.add('hero-campaign-content');

  if (!imageCol) {
    block.classList.add('no-image');
  }
}
