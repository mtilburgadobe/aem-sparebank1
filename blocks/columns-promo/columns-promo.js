export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-promo-${cols.length}-cols`);

  // Each card lays out text on the left and its illustration on the right.
  // Split the flat children (picture, heading, text, link) into a text column
  // and a media column so the two can sit side by side.
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      col.classList.add('columns-promo-card');

      const pic = col.querySelector('picture');
      const media = pic ? (pic.closest('p') || pic) : null;

      const text = document.createElement('div');
      text.className = 'columns-promo-text';
      [...col.children].forEach((child) => {
        if (child !== media) text.append(child);
      });
      col.prepend(text);

      if (media) media.classList.add('columns-promo-media');
      else col.classList.add('no-media');
    });
  });
}
