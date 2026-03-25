/* ── Nav definitions ──────────────────────────────────────── */

const PUBLIC_NAV = [
  { label: 'Home',                icon: 'home',             href: '/' },
  { label: 'Events and Training', icon: 'events-training',  href: '/events-training' },
  { label: 'Tech Talk',           icon: 'tech-talk',        href: '/tech-talk' },
  { label: 'Nominations',         icon: 'nominations',      href: '/nominations' },
  { label: 'My Team',             icon: 'my-team',          href: '/my-team' },
  { label: 'Industry Updates',    icon: 'industry-updates', href: '/industry-updates' },
  { label: 'Newsletters',         icon: 'newsletters',      href: '/newsletter' },
];

const ADMIN_NAV = [
  { label: 'Dashboard',           icon: 'dashboard',        href: '/admin' },
  { label: 'Events and Training', icon: 'events-training',  href: '/admin#events-training' },
  { label: 'Participation',       icon: 'participation',    href: '/admin#participation' },
];

/* ── Icon fetcher ─────────────────────────────────────────── */

const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="1.5"
  stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
</svg>`;

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
    return FALLBACK_SVG;
  }
}

/* ── Helpers ──────────────────────────────────────────────── */

function isActive(href) {
  const cur = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
  const curHash = window.location.hash; // e.g. '#newsletter'
  const [hrefPath, hrefHash] = href.split('#');
  const tgt = hrefPath.replace(/\.html$/, '').replace(/\/$/, '');

  if (cur !== tgt && !cur.startsWith(`${tgt}/`)) return false;
  if (hrefHash) return curHash === `#${hrefHash}`;
  return !curHash; // Dashboard active only when no hash
}

function isAdminPage() {
  return window.location.pathname.toLowerCase().includes('/admin');
}

/* ── Layout sync ──────────────────────────────────────────── */

function syncLayout() {
  const updateTop = () => {
    const navEl = document.querySelector('.nav-inner') ?? document.querySelector('header');
    const h = navEl ? navEl.getBoundingClientRect().height : 0;
    if (h > 0) document.documentElement.style.setProperty('--ac-sidebar-top', `${h}px`);
  };

  const updatePush = () => {
    const main = document.querySelector('main');
    if (main) main.style.marginLeft = window.innerWidth <= 768 ? '0' : 'var(--ac-sidebar-w, 56px)';
  };

  updateTop();
  updatePush();
  setTimeout(updateTop, 300);
  window.addEventListener('resize', () => { updateTop(); updatePush(); });
}

/* ── Nav builder ──────────────────────────────────────────── */

async function buildNav(isAdmin) {
  const navItems = isAdmin ? ADMIN_NAV : PUBLIC_NAV;

  const nav = document.createElement('nav');
  nav.id = 'ac-sidebar';
  nav.className = 'ac-sidebar';
  nav.setAttribute('aria-label', isAdmin ? 'Admin navigation' : 'Main navigation');

  const ul = document.createElement('ul');
  ul.className = 'ac-sidebar-nav';

  const svgs = await Promise.all(navItems.map((item) => fetchIcon(item.icon)));

  navItems.forEach((item, i) => {
    const active = isActive(item.href);

    const li = document.createElement('li');
    li.className = 'ac-sidebar-item';

    const a = document.createElement('a');
    a.className = `ac-sidebar-link${active ? ' is-active' : ''}`;
    a.href = item.href;
    a.setAttribute('aria-label', item.label);
    a.setAttribute('aria-current', active ? 'page' : 'false');

    const iconEl = document.createElement('span');
    iconEl.className = 'ac-sidebar-icon';
    iconEl.setAttribute('aria-hidden', 'true');
    iconEl.innerHTML = svgs[i];

    const labelEl = document.createElement('span');
    labelEl.className = 'ac-sidebar-label';
    labelEl.textContent = item.label;

    a.append(iconEl, labelEl);

    const tip = document.createElement('span');
    tip.className = 'ac-sidebar-tooltip';
    tip.setAttribute('aria-hidden', 'true');
    tip.textContent = item.label;

    li.append(a, tip);
    ul.append(li);
  });

  nav.append(ul);
  return nav;
}

/* ── Overlay ──────────────────────────────────────────────── */

function buildOverlay() {
  const el = document.createElement('div');
  el.id = 'ac-sidebar-overlay';
  el.className = 'ac-sidebar-overlay';
  return el;
}

/* ── Interactions ─────────────────────────────────────────── */

function wireInteractions(sidebar, overlay) {
  const close = () => {
    sidebar.classList.remove('is-open');
    overlay.classList.remove('is-visible');
    document.dispatchEvent(new CustomEvent('ac:sidebar-closed'));
  };
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  sidebar.querySelectorAll('.ac-sidebar-link').forEach((a) => {
    a.addEventListener('click', () => { if (window.innerWidth <= 768) close(); });
  });
}

/* ── Block decorator ──────────────────────────────────────── */

export default async function decorate(block) {
  document.getElementById('ac-sidebar')?.remove();
  document.getElementById('ac-sidebar-overlay')?.remove();

  const sidebar = await buildNav(isAdminPage());
  const overlay = buildOverlay();

  document.body.prepend(overlay);
  document.body.prepend(sidebar);
  wireInteractions(sidebar, overlay);
  syncLayout();

  block.remove();
}
