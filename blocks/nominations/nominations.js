/**
 * nominations.js — Adobe Connect EDS block
 *
 * DA.live sheet at /nominations-data with columns:
 *   name | role | department | category | image
 */

/* ── Avatar colour pool ─────────────────────────────────── */
const avatarColors = [
  '#e11d48', '#7c3aed', '#0284c7', '#059669',
  '#d97706', '#dc2626', '#4f46e5', '#0891b2',
];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getInitials(name) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

/* ── Build avatar ───────────────────────────────────────── */
function buildAvatar(nominee) {
  const wrap = document.createElement('div');
  wrap.className = 'nom-avatar-wrap';

  if (nominee.image) {
    const img = document.createElement('img');
    img.src = nominee.image;
    img.alt = nominee.name;
    img.className = 'nom-avatar-img';
    img.loading = 'lazy';
    img.onerror = () => {
      wrap.innerHTML = '';
      const fallback = document.createElement('div');
      fallback.className = 'nom-avatar-fallback';
      fallback.style.background = getAvatarColor(nominee.name);
      fallback.textContent = getInitials(nominee.name);
      wrap.append(fallback);
    };
    wrap.append(img);
  } else {
    const fallback = document.createElement('div');
    fallback.className = 'nom-avatar-fallback';
    fallback.style.background = getAvatarColor(nominee.name);
    fallback.textContent = getInitials(nominee.name);
    wrap.append(fallback);
  }

  return wrap;
}

/* ── Build one nominee card ─────────────────────────────── */
function buildCard(nominee) {
  const card = document.createElement('div');
  card.className = 'nom-card';

  card.append(buildAvatar(nominee));

  const name = document.createElement('h3');
  name.className = 'nom-name';
  name.textContent = nominee.name;

  const role = document.createElement('p');
  role.className = 'nom-role';
  role.textContent = nominee.role;

  const badge = document.createElement('span');
  badge.className = 'nom-badge';
  badge.textContent = nominee.category;

  card.append(name, role, badge);
  return card;
}

/* ── Build category section ─────────────────────────────── */
function buildCategory(categoryName, nominees) {
  const section = document.createElement('div');
  section.className = 'nom-section';

  const heading = document.createElement('h2');
  heading.className = 'nom-section-label';
  heading.textContent = categoryName;
  section.append(heading);

  const grid = document.createElement('div');
  grid.className = 'nom-grid';
  nominees.forEach((n) => grid.append(buildCard(n)));
  section.append(grid);

  return section;
}

/* ── Group flat rows by category, preserving order ──────── */
function groupByCategory(rows) {
  const map = new Map();
  rows.forEach((row) => {
    // Try all possible casing variants DA.live might return
    const cat = row.category
      || row.Category
      || row.CATEGORY
      || 'Uncategorised';

    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push({
      name:       (row.name       || row.Name       || '').trim(),
      role:       (row.role       || row.Role       || '').trim(),
      department: (row.department || row.Department || '').trim(),
      category:   cat,
      image:      (row.image      || row.Image      || '').trim(),
    });
  });
  return map;
}

/* ── Resolve fetch URL ──────────────────────────────────── */
function resolveUrl(block) {
  const anchor = block.querySelector('a');
  if (anchor?.href) return anchor.href;

  const text = block.querySelector('p')?.textContent?.trim()
    || block.querySelector('div')?.textContent?.trim()
    || '';

  if (text.startsWith('http')) return text;
  if (text) return `/${text}.json`;

  return '/nominations-data.json';
}

/* ── EDS decorate ───────────────────────────────────────── */
export default async function decorate(block) {
  const fetchUrl = resolveUrl(block);
  let categoryMap = new Map();

  try {
    const res = await fetch(fetchUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    // DA.live sheet returns { data: [...rows] }
    const rows = json.data || [];
    if (rows.length) categoryMap = groupByCategory(rows);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[nominations] data fetch failed:', err);
  }

  block.innerHTML = '';

  const heading = document.createElement('h1');
  heading.className = 'nom-heading';
  heading.textContent = 'Nominations';
  block.append(heading);

  categoryMap.forEach((nominees, categoryName) => {
    block.append(buildCategory(categoryName, nominees));
  });
}