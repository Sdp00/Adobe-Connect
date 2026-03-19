/**
 * sidebar.js — Adobe Connect EDS
 *
 * Exported function: loadSidebar()
 * Called from scripts/scripts.js inside loadLazy()
 *
 * Icons loaded from /icons/<name>.svg
 * Admin/public detection: URL contains /admin
 * Sidebar top auto-detects header height at runtime
 */
 
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
  { label: 'Dashboard',           icon: 'dashboard',        href: '/admin/dashboard' },
  { label: 'Events and Training', icon: 'events-training',  href: '/admin/events-training' },
  { label: 'Newsletter',          icon: 'newsletters',      href: '/admin/newsletter' },
  { label: 'Participation',       icon: 'participation',    href: '/admin/participation' },
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
    const txt = await res.text();
    const svg = txt.replace(/<\?xml[^>]*\?>/g, '').trim();
    iconCache[name] = svg;
    return svg;
  } catch {
    return FALLBACK_SVG;
  }
}
 
/* ── Helpers ──────────────────────────────────────────────── */
 
function isActive(href) {
  const cur = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
  const tgt = href.replace(/\.html$/, '').replace(/\/$/, '');
  // /admin root → highlight Dashboard
  if (cur === '/admin' && tgt === '/admin/dashboard') return true;
  // / root → highlight Home
  if (!tgt) return cur === '';
  return cur === tgt || cur.startsWith(tgt + '/');
}
 
function isAdminPage() {
  return window.location.pathname.toLowerCase().includes('/admin');
}
 
/* ── Sync sidebar top + main margin (single resize listener) ─ */
 
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
  setTimeout(updateTop, 300); // re-measure after header finishes rendering
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
 
/* ── Wire interactions (no hamburger — sidebar is icon rail) ─ */
 
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
 
/* ── Main export ──────────────────────────────────────────── */
 
export async function loadSidebar() {
  document.getElementById('ac-sidebar')?.remove();
  document.getElementById('ac-sidebar-overlay')?.remove();
 
  const isAdmin = isAdminPage();
 
  // Inject CSS once
  if (!document.querySelector('link[href="/blocks/sidebar/sidebar.css"]')) {
    await new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/blocks/sidebar/sidebar.css';
      link.onload = resolve;
      link.onerror = resolve;
      document.head.append(link);
    });
  }
 
  const sidebar = await buildNav(isAdmin);
  const overlay = buildOverlay();
 
  document.body.prepend(overlay);
  document.body.prepend(sidebar);
  wireInteractions(sidebar, overlay);
  syncLayout();
}
 
export default function decorate() {}