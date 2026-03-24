/**
 * nominations.js — Adobe Connect EDS block
 *
 * DA.live: add a "nominations" block table on your /nominations document.
 *
 *   | nominations |
 *   |-------------|
 *   |             |
 *
 * Folder structure:
 *   /blocks/nominations/nominations.js
 *   /blocks/nominations/nominations.css
 *   /blocks/nominations/mock.json
 */

/* ── Avatar colour pool (initials fallback) ─────────────── */
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

  /* Photo */
  card.append(buildAvatar(nominee));

  /* Name */
  const name = document.createElement('h3');
  name.className = 'nom-name';
  name.textContent = nominee.name;

  /* Role */
  const role = document.createElement('p');
  role.className = 'nom-role';
  role.textContent = nominee.role;

  /* Category badge */
  const badge = document.createElement('span');
  badge.className = 'nom-badge';
  badge.textContent = nominee.category;

  card.append(name, role, badge);
  return card;
}

/* ── Build category section ─────────────────────────────── */
function buildCategory(category) {
  const section = document.createElement('div');
  section.className = 'nom-section';

  const heading = document.createElement('h2');
  heading.className = 'nom-section-label';
  heading.textContent = category.name;
  section.append(heading);

  const grid = document.createElement('div');
  grid.className = 'nom-grid';
  category.nominees.forEach((n) => grid.append(buildCard(n)));
  section.append(grid);

  return section;
}

/* ── EDS decorate ───────────────────────────────────────── */
export default async function decorate(block) {
  let data = { categories: [] };
  try {
    const res = await fetch('/blocks/nominations/mock.json');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[nominations] data fetch failed:', err);
  }

  block.innerHTML = '';

  const heading = document.createElement('h1');
  heading.className = 'nom-heading';
  heading.textContent = 'Nominations';
  block.append(heading);

  data.categories.forEach((cat) => block.append(buildCategory(cat)));
}