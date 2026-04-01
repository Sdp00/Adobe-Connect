/**
 * industry-updates.js — Adobe Connect EDS block
 *
 * Reads trends data from mock.json in the public folder.
 * Tries multiple paths to handle EDS local dev + production.
 */

/* ── SVG icons ──────────────────────────────────────────── */
const icons = {
  clock: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>`,

  externalLink: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>`,
};

/* ── Category colour map ────────────────────────────────── */
const categoryColors = {
  'Design':      { bg: '#fef2f2', color: '#e11d48' },
  'AI':          { bg: '#faf5ff', color: '#7c3aed' },
  'Development': { bg: '#eff6ff', color: '#2563eb' },
  'UX Research': { bg: '#f0fdf4', color: '#16a34a' },
};

function getCategoryStyle(category) {
  return categoryColors[category] || { bg: '#f4f4f4', color: '#8e8e8e' };
}

/* ── Fetch mock.json trying multiple paths ──────────────── */
async function fetchMockData() {
  const paths = [
    '/mock.json',
    '/public/mock.json',
    `${window.hlx?.codeBasePath || ''}/mock.json`,
  ];

  for (const path of paths) {
    try {
      const res = await fetch(path);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.newsletters || data.trends)) {
          // eslint-disable-next-line no-console
          console.log(`[industry-updates] loaded mock.json from: ${path}`);
          return data;
        }
      }
    } catch {
      /* try next path */
    }
  }
  // eslint-disable-next-line no-console
  console.warn('[industry-updates] Could not load mock.json from any path');
  return null;
}

/* ── Build one industry update card ─────────────────────── */
function buildCard(item) {
  const card = document.createElement('div');
  card.className = 'iu-card';

  /* Header row: category badge + time */
  const headerRow = document.createElement('div');
  headerRow.className = 'iu-card-header';

  const { bg, color } = getCategoryStyle(item.category);
  const badge = document.createElement('span');
  badge.className = 'iu-badge';
  badge.textContent = item.category;
  badge.style.background = bg;
  badge.style.color = color;

  const timeEl = document.createElement('span');
  timeEl.className = 'iu-time';
  timeEl.innerHTML = `${icons.clock} ${item.time_ago}`;

  headerRow.append(badge, timeEl);

  /* Title */
  const title = document.createElement('h3');
  title.className = 'iu-card-title';
  title.textContent = item.title;

  /* Source */
  const source = document.createElement('p');
  source.className = 'iu-source';
  source.textContent = item.source;

  /* Read more button */
  const btn = document.createElement('button');
  btn.className = 'btn iu-read-btn';
  btn.type = 'button';
  btn.innerHTML = `${icons.externalLink}<span>Read Article</span>`;

  card.append(headerRow, title, source, btn);
  return card;
}

/* ── EDS decorate ───────────────────────────────────────── */
export default async function decorate(block) {
  /* Load buttons.css */
  if (!document.querySelector('link[href="/styles/buttons.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/styles/buttons.css';
    document.head.append(link);
  }

  block.innerHTML = '';

  /* Page heading — shown immediately */
  const heading = document.createElement('h1');
  heading.className = 'iu-heading';
  heading.textContent = 'Industry Updates';
  block.append(heading);

  /* Loading state */
  const loader = document.createElement('p');
  loader.className = 'iu-empty';
  loader.textContent = 'Loading…';
  block.append(loader);

  /* Fetch data */
  const data = await fetchMockData();
  const items = data?.trends?.items || [];
  if (data?.trends?.title) heading.textContent = data.trends.title;

  loader.remove();

  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'iu-empty';
    empty.textContent = 'No industry updates available.';
    block.append(empty);
    return;
  }

  /* Card grid */
  const grid = document.createElement('div');
  grid.className = 'iu-grid';
  items.forEach((item) => grid.append(buildCard(item)));
  block.append(grid);
}