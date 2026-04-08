import { html, render } from '../../vendor/htm-preact.js';
import { useState } from '../../vendor/preact-hooks.js';
import { readBlockConfig } from '../../scripts/aem.js';

const DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const LEGEND = [
  { type: 'event',    color: '#e63535', label: 'Event' },
  { type: 'training', color: '#3b82f6', label: 'Training' },
  { type: 'both',     color: '#8b5cf6', label: 'Both' },
];

const DOT_COLOR = Object.fromEntries(LEGEND.map(({ type, color }) => [type, color]));

function buildGrid(year, month) {
  const totalDays = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const prevDays = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = firstDay - 1; i >= 0; i -= 1) cells.push({ day: prevDays - i, current: false });
  for (let d = 1; d <= totalDays; d += 1) cells.push({ day: d, current: true });
  const rem = 7 - (cells.length % 7);
  if (rem < 7) for (let d = 1; d <= rem; d += 1) cells.push({ day: d, current: false });
  return cells;
}

function renderCell(day, current, todayD, eventMap) {
  const types = current ? (eventMap[day] || []) : [];
  const isToday = current && day === todayD;
  return html`
    <div class="calendar-block__cell
      ${!current ? 'calendar-block__cell--faded' : ''}
      ${isToday ? 'calendar-block__cell--today' : ''}">
      <span class="calendar-block__num">${day}</span>
      ${types.length > 0 && html`
        <div class="calendar-block__dots">
          ${types.map((t) => html`
            <span class="calendar-block__dot"
              style="background:${DOT_COLOR[t] || '#999'}">
            </span>`)}
        </div>`}
    </div>`;
}

function buildAllMonths(json) {
  const allMonths = {};
  const items = json.eventsAndTrainings || [];

  items.forEach(({ date, type }) => {
    if (!date) return;
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return;

    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!allMonths[key]) allMonths[key] = [];

    const dayNum = d.getDate();
    const existing = allMonths[key].find((e) => e.date === dayNum);

    if (existing) {
      existing.type = 'both';
    } else {
      allMonths[key].push({ date: dayNum, type });
    }
  });

  return allMonths;
}

function CalendarGrid({ currentMonth, currentYear, allMonths }) {
  const today = new Date();
  const isTodayMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;
  const todayD = isTodayMonth ? today.getDate() : -1;
  const cells = buildGrid(currentYear, currentMonth);

  const key = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const monthEvents = (allMonths && allMonths[key]) || [];

  const eventMap = {};
  monthEvents.forEach(({ date, type }) => {
    if (!eventMap[date]) eventMap[date] = [];
    eventMap[date].push(type);
  });

  return html`
    <div>
      <div class="calendar-block__grid">
        ${DAYS.map((d) => html`<span class="calendar-block__dayname">${d}</span>`)}
        ${cells.map(({ day, current }) => renderCell(day, current, todayD, eventMap))}
      </div>
      <div class="calendar-block__legend">
        ${LEGEND.map(({ color, label }) => html`
          <span class="calendar-block__legend-item">
            <i class="calendar-block__dot" style="background:${color}"></i>
            ${label}
          </span>`)}
      </div>
    </div>`;
}

function Calendar({ data }) {
  const [currentMonth, setCurrentMonth] = useState(data.month_index);
  const [currentYear, setCurrentYear] = useState(data.year);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  };

  return html`
    <div class="calendar-block">
      <div class="calendar-block__header">
        <h3 class="calendar-block__title">${data.title}</h3>
        <div class="calendar-block__nav">
          <button class="calendar-block__nav-btn" onClick=${prevMonth} aria-label="Previous month">←</button>
          <span class="calendar-block__month">${MONTH_NAMES[currentMonth]} ${currentYear}</span>
          <button class="calendar-block__nav-btn" onClick=${nextMonth} aria-label="Next month">→</button>
        </div>
      </div>
      <${CalendarGrid}
        currentMonth=${currentMonth}
        currentYear=${currentYear}
        allMonths=${data.allMonths}
      />
    </div>`;
}

function MobileCalendarPopover({ data }) {
  const [open, setOpen] = useState(false);

  return html`
    <div class="cal-popover">
      <button class="cal-popover__trigger" onClick=${() => setOpen((o) => !o)} aria-label="Open calendar">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
          viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
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
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <${Calendar} data=${data} />
        </div>`}
    </div>`;
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const calendarUrl = config.calendarurl;

  if (!calendarUrl) {
    block.innerHTML = '<p>No calendarUrl configured.</p>';
    return;
  }

  const resp = await fetch(calendarUrl);
  const json = await resp.json();

  const allMonths = buildAllMonths(json);
  const today = new Date();

  const data = {
    title: 'Team Calendar',
    year: today.getFullYear(),
    month_index: today.getMonth(),
    allMonths,
  };

  block.innerHTML = '';
  render(html`<${Calendar} data=${data} />`, block);

  const injectCalendarIcon = () => {
    const header = document.querySelector('header');
    if (!header) return;
    if (header.querySelector('.cal-popover-mount')) return;

    const mount = document.createElement('div');
    mount.className = 'cal-popover-mount';

    const darkToggle = header.querySelector(
      'button[aria-label*="dark"], button[aria-label*="theme"], button[aria-label*="color"], .nav-hamburger, .theme-toggle, [class*="dark"], [class*="theme"]',
    );

    if (darkToggle) darkToggle.parentElement.insertBefore(mount, darkToggle);
    else header.appendChild(mount);

    render(html`<${MobileCalendarPopover} data=${data} />`, mount);
  };

  if (document.querySelector('header button')) {
    injectCalendarIcon();
  } else {
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