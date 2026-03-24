/* ── Static config — icon names must match /icons/<name>.svg ── */
const STAT_CONFIG = [
  { key: 'events',      icon: 'events',      label: 'Events' },
  { key: 'trainings',   icon: 'training',    label: 'Trainings' },
  { key: 'newsletters', icon: 'newsletters', label: 'Newsletters Sent' },
];

/* ── Data layer ───────────────────────────────────────────────
   Replace the mock return below with a real API/DB call.
   Must resolve to { events, trainings, newsletters } counts.
   ─────────────────────────────────────────────────────────── */
async function fetchStats() {
  // TODO: replace with real API call, e.g.:
  // const res = await fetch('/api/admin/stats');
  // return res.json();
  return {
    events: 4,
    trainings: 6,
    newsletters: 3,
  };
}

/* ── Icon fetcher ─────────────────────────────────────────── */
const iconCache = {};

async function fetchIcon(name) {
  if (iconCache[name]) return iconCache[name];
  try {
    const res = await fetch(`/icons/${name}.svg`);
    if (!res.ok) throw res.status;
    const svg = (await res.text()).replace(/<\?xml[^>]*\?>/g, '').trim();
    iconCache[name] = svg;
    return svg;
  } catch {
    return '';
  }
}

/* ── Block decorator ──────────────────────────────────────── */
export default async function decorate(block) {
  const [stats, svgs] = await Promise.all([
    fetchStats(),
    Promise.all(STAT_CONFIG.map((s) => fetchIcon(s.icon))),
  ]);

  const grid = document.createElement('div');
  grid.className = 'admin-stats-grid';

  STAT_CONFIG.forEach((stat, i) => {
    const card = document.createElement('div');
    card.className = 'admin-stats-card';

    const iconWrap = document.createElement('div');
    iconWrap.className = `admin-stats-icon admin-stats-icon-${stat.icon}`;
    iconWrap.innerHTML = svgs[i];

    const count = document.createElement('p');
    count.className = 'admin-stats-count';
    count.textContent = stats[stat.key] ?? '—';

    const label = document.createElement('p');
    label.className = 'admin-stats-label';
    label.textContent = stat.label;

    card.append(iconWrap, count, label);
    grid.append(card);
  });

  block.replaceChildren(grid);
}
