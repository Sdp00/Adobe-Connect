/**
 * newsletter.js — Adobe Connect EDS block
 *
 * Reads newsletters data from mock.json in the public folder.
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

  book: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>`,

  externalLink: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>`,
};

/* ── Category badge colour map ──────────────────────────── */
const categoryColors = {
  'Weekly Digest':   { bg: '#fef2f2', color: '#e11d48' },
  'Design Systems':  { bg: '#eff6ff', color: '#2563eb' },
  'Product Updates': { bg: '#f0fdf4', color: '#16a34a' },
  'Community':       { bg: '#faf5ff', color: '#7c3aed' },
};

function getCategoryStyle(category) {
  return categoryColors[category] || { bg: '#f4f4f4', color: '#8e8e8e' };
}

/* ── Fetch mock.json trying multiple paths ──────────────── */
async function fetchMockData() {
  /* EDS serves files from /public at the root in production.
     In local dev (localhost:3000) the same applies.
     Try these paths in order until one works. */
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
        /* Validate it has the expected shape */
        if (data && (data.newsletters || data.trends)) {
          // eslint-disable-next-line no-console
          console.log(`[newsletter] loaded mock.json from: ${path}`);
          return data;
        }
      }
    } catch {
      /* try next path */
    }
  }
  // eslint-disable-next-line no-console
  console.warn('[newsletter] Could not load mock.json from any path');
  return null;
}

/* ── Build one newsletter card ──────────────────────────── */
function buildCard(item) {
  const card = document.createElement('div');
  card.className = 'nl-card';

  /* Category badge */
  const { bg, color } = getCategoryStyle(item.category);
  const badge = document.createElement('span');
  badge.className = 'nl-badge';
  badge.textContent = item.category;
  badge.style.background = bg;
  badge.style.color = color;

  /* Title */
  const title = document.createElement('h3');
  title.className = 'nl-card-title';
  title.textContent = item.title;

  /* Source */
  const sourceRow = document.createElement('div');
  sourceRow.className = 'nl-source-row';
  const source = document.createElement('span');
  source.className = 'nl-source';
  source.textContent = item.source;
  sourceRow.append(source);

  /* Meta row: time + read time */
  const metaRow = document.createElement('div');
  metaRow.className = 'nl-meta-row';

  const timeEl = document.createElement('span');
  timeEl.className = 'nl-meta-item';
  timeEl.innerHTML = `${icons.clock} ${item.time_ago}`;

  const readEl = document.createElement('span');
  readEl.className = 'nl-meta-item';
  readEl.innerHTML = `${icons.book} ${item.read_time}`;

  metaRow.append(timeEl, readEl);

  /* Read button */
  const btn = document.createElement('button');
  btn.className = 'btn nl-read-btn';
  btn.type = 'button';
  btn.innerHTML = `${icons.externalLink}<span>Read Newsletter</span>`;

  card.append(badge, title, sourceRow, metaRow, btn);
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

  /* Page heading — shown immediately while data loads */
  const heading = document.createElement('h1');
  heading.className = 'nl-heading';
  heading.textContent = 'Newsletters';
  block.append(heading);

  /* Loading state */
  const loader = document.createElement('p');
  loader.className = 'nl-empty';
  loader.textContent = 'Loading…';
  block.append(loader);

  /* Fetch data */
  const data = await fetchMockData();
  const items = data?.newsletters?.items || [];
  if (data?.newsletters?.title) heading.textContent = data.newsletters.title;

  loader.remove();

  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'nl-empty';
    empty.textContent = 'No newsletters available.';
    block.append(empty);
    return;
  }

  /* Card grid */
  const grid = document.createElement('div');
  grid.className = 'nl-grid';
  items.forEach((item) => grid.append(buildCard(item)));
  block.append(grid);
}