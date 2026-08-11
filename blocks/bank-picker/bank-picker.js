/**
 * Bank Picker block — the "Vi er flere banker i hele Norge" band.
 *
 * Content model (rows):
 *   row 1: heading            e.g. "Vi er flere banker i hele Norge"
 *   row 2: sublead            e.g. "Velg en bank for å se betingelser"
 *   row 3: toggle label       e.g. "Se alle banker"
 *   row 4+: one row per bank  [ link (name) | description ]
 *
 * The block renders the blue band with a centered heading/sublead and an
 * expandable list of the alliance's regional banks. Postal-code lookup,
 * geolocation and the cookie-gated "last visited bank" from the source are
 * intentionally omitted (app-specific behavior, not meaningful in EDS).
 */
export default function decorate(block) {
  const rows = [...block.children];

  // First three rows are heading, sublead, and the toggle label.
  const headingRow = rows[0];
  const subleadRow = rows[1];
  const toggleRow = rows[2];
  const bankRows = rows.slice(3);

  const heading = headingRow?.textContent.trim() || '';
  const sublead = subleadRow?.textContent.trim() || '';
  const toggleLabel = toggleRow?.textContent.trim() || 'Se alle banker';

  // Build the banks list from the remaining rows: each row is [name-link | desc].
  const banks = bankRows.map((row) => {
    const cells = [...row.children];
    const link = cells[0]?.querySelector('a');
    const desc = cells[1]?.textContent.trim() || '';
    return link
      ? { href: link.getAttribute('href'), name: link.innerHTML, desc }
      : null;
  }).filter(Boolean);

  const banksId = 'bank-picker-list';

  block.textContent = '';

  const inner = document.createElement('div');
  inner.className = 'bank-picker-inner';

  const content = document.createElement('div');
  content.className = 'bank-picker-content';

  if (heading) {
    const h = document.createElement('p');
    h.className = 'bank-picker-heading';
    h.textContent = heading;
    content.append(h);
  }
  if (sublead) {
    const s = document.createElement('p');
    s.className = 'bank-picker-sublead';
    s.textContent = sublead;
    content.append(s);
  }

  // Search row: postal-code input + "use my location" button. These are form
  // controls, so they are built here (not in the fragment content). The lookup
  // itself is not wired up — this mirrors the source's search affordance.
  const search = document.createElement('div');
  search.className = 'bank-picker-search';
  search.setAttribute('role', 'search');
  search.innerHTML = `
    <div class="bank-picker-field">
      <label for="bank-picker-postnummer">Ditt postnummer</label>
      <input id="bank-picker-postnummer" class="bank-picker-input" type="text"
        inputmode="numeric" maxlength="4" autocomplete="off" placeholder="Postnummer">
    </div>
    <button type="button" class="bank-picker-position">
      <span class="bank-picker-position-icon" aria-hidden="true"></span>
      <span>Bruk min posisjon</span>
    </button>`;
  content.append(search);

  if (banks.length) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'bank-picker-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', banksId);
    toggle.innerHTML = `<span>${toggleLabel}</span>`;

    const list = document.createElement('ul');
    list.className = 'bank-picker-list';
    list.id = banksId;
    list.hidden = true;
    banks.forEach((bank) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = bank.href;
      a.innerHTML = bank.name;
      const desc = document.createElement('span');
      desc.className = 'bank-picker-bank-desc';
      desc.textContent = bank.desc;
      li.append(a, desc);
      list.append(li);
    });

    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      list.hidden = open;
    });

    content.append(toggle, list);
  }

  inner.append(content);
  block.append(inner);
}
