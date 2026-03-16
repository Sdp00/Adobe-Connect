/**
 * sidebar.js — Adobe Connect EDS
 *
 * Exported function: loadSidebar()
 * Called from scripts/scripts.js inside loadLazy()
 */

const NAV_MAP = {
  home: { icon: 'home', href: '/' },
  events: { icon: 'events', href: '/events' },
  training: { icon: 'training', href: '/training' },
  'tech talk': { icon: 'tech-talk', href: '/tech-talk' },
  nominations: { icon: 'nominations', href: '/nominations' },
  'my team': { icon: 'my-team', href: '/my-team' },
  'industry updates': { icon: 'industry-updates', href: '/industry-updates' },
  newsletters: { icon: 'newsletters', href: '/newsletter' },
  newsletter: { icon: 'newsletters', href: '/newsletter' },
};

const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="1.5"
  stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
</svg>`;

async function fetchIcon(name) {
  try {
    const res = await fetch(`/icons/${name}.svg`);
    if (!res.ok) throw new Error(res.status);
    const txt = await res.text();
    return txt.replace(/<\?xml[^>]*\?>/g, '').trim();
  } catch {
    return FALLBACK_SVG;
  }
}

function isActive(href) {
  const cur = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
  const tgt = href.replace(/\.html$/, '').replace(/\/$/, '');
  if (!tgt) return cur === '' || cur === '/';
  return cur === tgt || cur.endsWith(tgt);
}

async function buildNav(labels) {
  const nav = document.createElement('nav');
  nav.id = 'ac-sidebar';
  nav.className = 'ac-sidebar';
  nav.setAttribute('aria-label', 'Main navigation');

  const ul = document.createElement('ul');
  ul.className = 'ac-sidebar-nav';

  const configs = labels.map((raw) => {
    const key = raw.trim().toLowerCase();
    return NAV_MAP[key] || { icon: key.replace(/\s+/g, '-'), href: `/${key.replace(/\s+/g, '-')}` };
  });

  const svgs = await Promise.all(configs.map((c) => fetchIcon(c.icon)));

  labels.forEach((label, i) => {
    const { href } = configs[i];
    const active = isActive(href);

    const li = document.createElement('li');
    li.className = 'ac-sidebar-item';

    const a = document.createElement('a');
    a.className = `ac-sidebar-link${active ? ' is-active' : ''}`;
    a.href = href;
    a.setAttribute('aria-label', label);
    a.setAttribute('aria-current', active ? 'page' : 'false');

    const iconEl = document.createElement('span');
    iconEl.className = 'ac-sidebar-icon';
    iconEl.setAttribute('aria-hidden', 'true');
    iconEl.innerHTML = svgs[i];

    const labelEl = document.createElement('span');
    labelEl.className = 'ac-sidebar-label';
    labelEl.textContent = label;

    a.append(iconEl, labelEl);

    const tip = document.createElement('span');
    tip.className = 'ac-sidebar-tooltip';
    tip.setAttribute('aria-hidden', 'true');
    tip.textContent = label;

    li.append(a, tip);
    ul.append(li);
  });

  nav.append(ul);
  return nav;
}

function buildOverlay() {
  const el = document.createElement('div');
  el.id = 'ac-sidebar-overlay';
  el.className = 'ac-sidebar-overlay';
  return el;
}

function buildToggle() {
  const btn = document.createElement('button');
  btn.id = 'ac-sidebar-toggle';
  btn.className = 'ac-sidebar-toggle';
  btn.setAttribute('aria-label', 'Open navigation');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'ac-sidebar');
  btn.innerHTML = menuSVG();
  return btn;
}

const menuSVG = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="1.5"
  stroke-linecap="round" stroke-linejoin="round">
  <line x1="3" y1="6" x2="21" y2="6"/>
  <line x1="3" y1="12" x2="21" y2="12"/>
  <line x1="3" y1="18" x2="21" y2="18"/>
</svg>`;

const closeSVG = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="1.5"
  stroke-linecap="round" stroke-linejoin="round">
  <line x1="18" y1="6" x2="6" y2="18"/>
  <line x1="6" y1="6" x2="18" y2="18"/>
</svg>`;

function wireToggle(sidebar, overlay, toggle) {
  const open = () => {
    sidebar.classList.add('is-open');
    overlay.classList.add('is-visible');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.innerHTML = closeSVG();
  };
  const close = () => {
    sidebar.classList.remove('is-open');
    overlay.classList.remove('is-visible');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = menuSVG();
  };

  toggle.addEventListener('click', () => (sidebar.classList.contains('is-open') ? close() : open()));
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  sidebar.querySelectorAll('.ac-sidebar-link').forEach((a) => {
    a.addEventListener('click', () => { if (window.innerWidth <= 768) close(); });
  });
}

function mountToggle(toggle) {
  const attempt = (tries = 0) => {
    const navLeft = document.querySelector('.nav-left');
    if (navLeft) {
      navLeft.prepend(toggle);
      return;
    }
    const header = document.querySelector('header');
    if (header) {
      header.prepend(toggle);
      return;
    }
    if (tries < 20) setTimeout(() => attempt(tries + 1), 100);
  };
  attempt();
}

function syncPush() {
  const apply = () => {
    const mobile = window.innerWidth <= 768;
    document.querySelectorAll('main').forEach((el) => {
      el.style.marginLeft = mobile ? '0' : 'var(--ac-sidebar-w, 56px)';
    });
  };
  apply();
  window.addEventListener('resize', apply);
}

export async function loadSidebar() {
  if (document.getElementById('ac-sidebar')) return;

  const cssPromise = new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/blocks/sidebar/sidebar.css';
    link.onload = resolve;
    link.onerror = resolve;
    document.head.append(link);
  });

  let labels = [];
  try {
    const res = await fetch('/sidebar.plain.html');
    if (!res.ok) throw new Error(`${res.status}`);
    const html = await res.text();
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const wrapper = tmp.querySelector('.default-content-wrapper') || tmp;
    labels = Array.from(wrapper.querySelectorAll('p'))
      .map((p) => p.textContent.trim())
      .filter(Boolean);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[sidebar] fetch failed:', err);
    return;
  }

  if (!labels.length) return;

  await cssPromise;

  const sidebar = await buildNav(labels);
  const overlay = buildOverlay();
  const toggle = buildToggle();

  document.body.prepend(overlay);
  document.body.prepend(sidebar);
  mountToggle(toggle);
  wireToggle(sidebar, overlay, toggle);
  syncPush();
}

// eslint-disable-next-line no-unused-vars
export default async function decorate(_block) {}