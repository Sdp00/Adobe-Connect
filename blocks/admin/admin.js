const STATS = [
  { icon: 'events',      count: '4', label: 'Events' },
  { icon: 'training',    count: '6', label: 'Trainings' },
  { icon: 'newsletters', count: '3', label: 'Newsletters Sent' },
];

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

export default async function decorate(block) {
  const svgs = await Promise.all(STATS.map((s) => fetchIcon(s.icon)));

  const grid = document.createElement('div');
  grid.className = 'admin-stats-grid';

  STATS.forEach((stat, i) => {
    const card = document.createElement('div');
    card.className = 'admin-stats-card';

    const iconWrap = document.createElement('div');
    iconWrap.className = `admin-stats-icon admin-stats-icon-${stat.icon}`;
    iconWrap.innerHTML = svgs[i];

    const count = document.createElement('p');
    count.className = 'admin-stats-count';
    count.textContent = stat.count;

    const label = document.createElement('p');
    label.className = 'admin-stats-label';
    label.textContent = stat.label;

    card.append(iconWrap, count, label);
    grid.append(card);
  });

  block.replaceChildren(grid);
}
