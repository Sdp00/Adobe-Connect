import { html, render } from '../../vendor/htm-preact.js';
import { useState, useEffect } from '../../vendor/preact-hooks.js';

const svgCache = {};
async function fetchSvg(name) {
  if (svgCache[name]) return svgCache[name];
  try {
    const res = await fetch(`/icons/${name}.svg`);
    if (!res.ok) return '';
    const svg = (await res.text())
      .replace(/<\?xml[^>]*\?>/g, '')
      .trim()
      .replace(/^<svg\b/, '<svg class="nav-icon"');
    svgCache[name] = svg;
    return svg;
  } catch {
    return '';
  }
}

const DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const DOT_COLOR = { event: '#e63535', training: '#3b82f6', both: '#8b5cf6' };

function buildGrid(year, month) {
  const totalDays = new Date(year, month + 1, 0).getDate();
  const firstDay  = new Date(year, month, 1).getDay();
  const prevDays  = new Date(year, month, 0).getDate();
  const cells     = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevDays - i, current: false });
  for (let d = 1; d <= totalDays; d++)     cells.push({ day: d, current: true });
  const rem = 7 - (cells.length % 7);
  if (rem < 7) for (let d = 1; d <= rem; d++) cells.push({ day: d, current: false });
  return cells;
}

function CalendarGrid({ data }) {
  const { month, year, month_index, events } = data;
  const today  = new Date();
  const isCurr = today.getFullYear() === year && today.getMonth() === month_index;
  const todayD = isCurr ? today.getDate() : -1;
  const cells  = buildGrid(year, month_index);

  const eventMap = {};
  events.forEach(({ date, type }) => {
    if (!eventMap[date]) eventMap[date] = [];
    eventMap[date].push(type);
  });

  return html`
    <div>
      <p class="calendar-block__month">${month}</p>
      <div class="calendar-block__grid">
        ${DAYS.map(d => html`<span class="calendar-block__dayname">${d}</span>`)}
        ${cells.map(({ day, current }) => {
          const types   = current ? (eventMap[day] || []) : [];
          const isToday = current && day === todayD;
          return html`
            <div class="calendar-block__cell
              ${!current ? 'calendar-block__cell--faded' : ''}
              ${isToday  ? 'calendar-block__cell--today' : ''}">
              <span class="calendar-block__num">${day}</span>
              ${types.length > 0 && html`
                <div class="calendar-block__dots">
                  ${types.map(t => html`
                    <span class="calendar-block__dot"
                      style="background:${DOT_COLOR[t] || '#999'}">
                    </span>`)}
                </div>`}
            </div>`;
        })}
      </div>
      <div class="calendar-block__legend">
        ${Object.entries(DOT_COLOR).map(([type, color]) => html`
          <span class="calendar-block__legend-item">
            <i class="calendar-block__dot" style="background:${color}"></i>
            ${type.charAt(0).toUpperCase() + type.slice(1)}
          </span>`)}
      </div>
    </div>`;
}

function Calendar({ data }) {
  return html`
    <div class="calendar-block">
      <h3 class="calendar-block__title">${data.title}</h3>
      <${CalendarGrid} data=${data} />
    </div>`;
}

function MobileCalendarPopover({ data }) {
  const [open, setOpen] = useState(false);
  const [calSvg, setCalSvg] = useState('');

  useEffect(() => { fetchSvg('calendar').then(setCalSvg); }, []);

  return html`
    <div class="cal-popover">
      <button
        class="cal-popover__trigger icon-btn"
        onClick=${() => setOpen(o => !o)}
        aria-label="Open calendar">
        <span dangerouslySetInnerHTML=${{ __html: calSvg }} />
      </button>

      ${open && html`
        <div class="cal-popover__backdrop" onClick=${() => setOpen(false)}></div>
        <div class="cal-popover__panel">
          <div class="cal-popover__header">
            <span class="cal-popover__label">${data.title}</span>
            <button class="cal-popover__close" onClick=${() => setOpen(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6"  y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <${CalendarGrid} data=${data} />
        </div>`}
    </div>`;
}

export default async function decorate(block) {
  const resp = await fetch('public/mock.json');
  const json = await resp.json();
  const data = json.calendar;

  // Desktop block
  block.innerHTML = '';
  render(html`<${Calendar} data=${data} />`, block);

  // Mobile icon — inject BEFORE the dark/light mode toggle button in header
  // Adobe Connect header has a theme-toggle button with class nav-hamburger or similar
  // We insert between search button and dark mode toggle
  const injectCalendarIcon = () => {
    // Try to find the dark/light mode button — it usually has a moon/sun icon
    const darkToggle = document.querySelector(
      'header button[aria-label*="dark"], header button[aria-label*="theme"], header button[aria-label*="color"], header .nav-hamburger, header .theme-toggle, header [class*="dark"], header [class*="theme"]'
    );

    const mount = document.createElement('div');
    mount.className = 'cal-popover-mount';

    if (darkToggle) {
      // Insert right before the dark/light toggle
      darkToggle.parentElement.insertBefore(mount, darkToggle);
    } else {
      // Fallback — append to header
      const header = document.querySelector('header');
      if (header) header.appendChild(mount);
    }

    render(html`<${MobileCalendarPopover} data=${data} />`, mount);
  };

  // Wait for header to be decorated by EDS
  if (document.querySelector('header button')) {
    injectCalendarIcon();
  } else {
    // Header not ready yet — observe DOM
    const observer = new MutationObserver(() => {
      if (document.querySelector('header button')) {
        observer.disconnect();
        injectCalendarIcon();
      }
    });
    observer.observe(document.querySelector('header') || document.body, {
      childList: true, subtree: true,
    });
  }
}