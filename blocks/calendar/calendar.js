import { html, render } from '../../vendor/htm-preact.js';
import { useState } from '../../vendor/preact-hooks.js';
import { readBlockConfig } from '../../scripts/aem.js';

const DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

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

function renderCell(day, current, todayD, eventMap, dotColor) {
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
              style="background:${dotColor[t] || '#999'}">
            </span>`)}
        </div>`}
    </div>`;
}

function CalendarGrid({
  currentMonth,
  currentYear,
  events,
  initialMonth,
  initialYear,
  legend,
}) {
  const today = new Date();
  const isTodayMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;
  const todayD = isTodayMonth ? today.getDate() : -1;
  const cells = buildGrid(currentYear, currentMonth);

  const isDataMonth = currentMonth === initialMonth && currentYear === initialYear;
  const eventMap = {};
  if (isDataMonth) {
    events.forEach(({ date, type }) => {
      if (!eventMap[date]) eventMap[date] = [];
      eventMap[date].push(type);
    });
  }

  const dotColor = {};
  legend.forEach(({ type, color }) => { dotColor[type] = color; });

  return html`
    <div>
      <div class="calendar-block__grid">
        ${DAYS.map((d) => html`<span class="calendar-block__dayname">${d}</span>`)}
        ${cells.map(({ day, current }) => renderCell(day, current, todayD, eventMap, dotColor))}
      </div>
      <div class="calendar-block__legend">
        ${legend.map(({ color, label }) => html`
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
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  return html`
    <div class="calendar-block">
      <div class="calendar-block__header">
        <h3 class="calendar-block__title">${data.title}</h3>
        <div class="calendar-block__nav">
          <button class="calendar-block__nav-btn" onClick=${prevMonth} aria-label="Previous month">\u2190</button>
          <span class="calendar-block__month">${MONTH_NAMES[currentMonth]} ${currentYear}</span>
          <button class="calendar-block__nav-btn" onClick=${nextMonth} aria-label="Next month">\u2192</button>
        </div>
      </div>
      <${CalendarGrid}
        currentMonth=${currentMonth}
        currentYear=${currentYear}
        events=${data.events}
        initialMonth=${data.month_index}
        initialYear=${data.year}
        legend=${data.legend}
      />
    </div>`;
}

function MobileCalendarPopover({ data }) {
  const [open, setOpen] = useState(false);

  return html`
    <div class="cal-popover">
      <button
        class="cal-popover__trigger"
        onClick=${() => setOpen((o) => !o)}
        aria-label="Open calendar">
        <img src="/icons/calendar.svg" class="cal-popover__icon" alt="Calendar" />
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
  const calendarUrl = config.calendarurl || 'public/mock.json';

  const resp = await fetch(calendarUrl);
  const json = await resp.json();
  const data = json.calendar;

  block.innerHTML = '';
  render(html`<${Calendar} data=${data} />`, block);

  const injectCalendarIcon = () => {
    const darkToggle = document.querySelector(
      'header button[aria-label*="dark"], header button[aria-label*="theme"], header button[aria-label*="color"], header .nav-hamburger, header .theme-toggle, header [class*="dark"], header [class*="theme"]',
    );

    const mount = document.createElement('div');
    mount.className = 'cal-popover-mount';

    if (darkToggle) {
      darkToggle.parentElement.insertBefore(mount, darkToggle);
    } else {
      const header = document.querySelector('header');
      if (header) header.appendChild(mount);
    }

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
