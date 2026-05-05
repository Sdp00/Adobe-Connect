/**
 * events-training.js — Adobe Connect EDS block
 *
 * Fetches from Adobe I/O endpoint (eventsAndTrainings)
 * Endpoint is read from config.js — no hardcoding.
 *
 * DA.live authoring:
 *   | events-training          |
 *   |--------------------------|
 *   | I'm Interested           |   ← optional custom label
 */

import Modal from '../../helper/modal.js';
import { html, render } from '../../vendor/htm-preact.js';
import { useState } from '../../vendor/preact-hooks.js';
import getConfig from '../../scripts/config.js';

/* ── SVG icons ──────────────────────────────────────────── */
const icons = {
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>`,
  location: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>`,
  trainer: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>`,
  clock: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>`,
  tick: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>`,
  close: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>`,
};

/* ── Canvas placeholder ─────────────────────────────────── */
function buildPlaceholder(title) {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 450;
  const ctx = canvas.getContext('2d');
  const palettes = [
    ['#1e3a5f', '#2d6a9f'], ['#1a1a2e', '#16213e'],
    ['#0f3460', '#533483'], ['#134e5e', '#71b280'],
    ['#2c003e', '#5c258d'], ['#200122', '#6f0000'],
    ['#1b262c', '#0f3460'],
  ];
  const [c1, c2] = palettes[(title.charCodeAt(0) + title.length) % palettes.length];
  const grad = ctx.createLinearGradient(0, 0, 800, 450);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 450);
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(650, 80, 170, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(100, 390, 110, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  const img = document.createElement('img');
  img.src = canvas.toDataURL();
  img.alt = title;
  img.loading = 'lazy';
  return img;
}

/* ── Date helpers ───────────────────────────────────────── */
function parseDate(dateStr) {
  if (!dateStr) return null;
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch.map(Number);
    return new Date(y, m - 1, d, 23, 59, 59);
  }
  const monthMap = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const displayMatch = dateStr.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})$/);
  if (displayMatch) {
    const [, mon, day, year] = displayMatch;
    const monthIndex = monthMap[mon];
    if (monthIndex !== undefined) {
      return new Date(Number(year), monthIndex, Number(day), 23, 59, 59);
    }
  }
  return null;
}

function isPastItem(item) {
  const d = parseDate(item.date);
  if (!d) return false;
  return d < new Date();
}

function formatDate(dateStr) {
  if (!dateStr) return 'TBD';
  const d = parseDate(dateStr);
  if (!d) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ── Real-time countdown ────────────────────────────────── */
function getCountdown(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return null;
  const diff = d - new Date();
  if (diff <= 0) return null;
  const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0)  return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${mins}m remaining`;
  return `${mins}m remaining`;
}

/* ── Seat progress bar ──────────────────────────────────── */
function buildSeatsBar(occupied, total) {
  const wrap = document.createElement('div');
  wrap.className = 'et-seats';
  const row = document.createElement('div');
  row.className = 'et-seats-row';
  const label = document.createElement('span');
  label.className = 'et-seats-label';
  label.textContent = 'Seats occupied';
  const count = document.createElement('span');
  count.className = 'et-seats-count';
  count.textContent = `${occupied} / ${total}`;
  row.append(label, count);
  const track = document.createElement('div');
  track.className = 'et-seats-track';
  const fill = document.createElement('div');
  fill.className = 'et-seats-fill';
  fill.style.width = `${Math.min((occupied / total) * 100, 100)}%`;
  track.append(fill);
  wrap.append(row, track);
  return { wrap, count, fill };
}

/* ── Decline modal ──────────────────────────────────────── */
function mountDeclineModal(trainingTitle, onConfirm) {
  const mountEl = document.createElement('div');
  document.body.append(mountEl);

  function DeclineModal() {
    const [isOpen, setIsOpen] = useState(true);
    const [reason, setReason] = useState('');
    const handleClose = () => {
      setIsOpen(false);
      setTimeout(() => mountEl.remove(), 300);
    };
    const handleSubmit = () => {
      if (!reason.trim()) return;
      onConfirm(reason.trim());
      handleClose();
    };
    return html`
      <${Modal}
        isOpen=${isOpen}
        onClose=${handleClose}
        modalHeader="Reason for declining"
        onSubmit=${handleSubmit}
        submitLabel="Confirm decline"
        cancelLabel="Cancel"
      >
        <p style="font-size:13px;color:#8e8e8e;margin:0 0 12px">${trainingTitle}</p>
        <label style="display:block;font-size:13px;font-weight:600;margin-bottom:8px">
          Please tell us why you are declining
        </label>
        <textarea
          class="et-modal-textarea"
          rows="4"
          placeholder="Type your reason here…"
          value=${reason}
          onInput=${(e) => setReason(e.target.value)}
        />
      </${Modal}>
    `;
  }
  render(html`<${DeclineModal}/>`, mountEl);
}

/* ── Build image wrapper ────────────────────────────────── */
function buildImageWrap(item) {
  const imgWrap = document.createElement('div');
  imgWrap.className = 'et-card-image';
  if (item.image) {
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.title;
    img.loading = 'lazy';
    img.onerror = () => { imgWrap.innerHTML = ''; imgWrap.append(buildPlaceholder(item.title)); };
    imgWrap.append(img);
  } else {
    imgWrap.append(buildPlaceholder(item.title));
  }
  return imgWrap;
}

/* ── Build timer element ────────────────────────────────── */
function buildTimer(dateStr) {
  const timerWrap = document.createElement('div');
  timerWrap.className = 'et-timer';
  timerWrap.innerHTML = `${icons.clock}<span class="et-timer-text">${getCountdown(dateStr) || 'Starting soon'}</span>`;
  const ticker = setInterval(() => {
    const timerText = timerWrap.querySelector('.et-timer-text');
    if (!timerText) { clearInterval(ticker); return; }
    const val = getCountdown(dateStr);
    timerText.textContent = val || 'Starting soon';
    if (!val) clearInterval(ticker);
  }, 60000);
  return timerWrap;
}

/* ── Build EVENT card ───────────────────────────────────── */
function buildEventCard(event, isPast, interestedLabel) {
  const card = document.createElement('div');
  card.className = `et-card${isPast ? ' et-card-past' : ''}`;
  card.append(buildImageWrap(event));

  const body = document.createElement('div');
  body.className = 'et-card-body';

  const title = document.createElement('h3');
  title.className = 'et-card-title';
  title.textContent = event.title;

  const desc = document.createElement('p');
  desc.className = 'et-card-desc';
  desc.textContent = event.description;

  const meta = document.createElement('div');
  meta.className = 'et-card-meta';

  const dateDisplay = event.date ? `${formatDate(event.date)} · ${event.time || ''}` : 'TBD';
  const dateEl = document.createElement('span');
  dateEl.className = 'et-meta-row';
  dateEl.innerHTML = `${icons.calendar}<span>${dateDisplay}</span>`;

  const locEl = document.createElement('span');
  locEl.className = 'et-meta-row';
  locEl.innerHTML = `${icons.location}<span>${event.venue || 'TBD'}</span>`;

  meta.append(dateEl, locEl);
  body.append(title, desc, meta);

  if (!isPast) {
    body.append(buildTimer(event.date));
    const btn = document.createElement('button');
    btn.className = 'btn et-card-btn';
    btn.type = 'button';
    btn.innerHTML = `<span class="et-btn-label">${interestedLabel}</span>`;
    btn.addEventListener('click', () => {
      const interested = btn.classList.toggle('is-interested');
      btn.innerHTML = interested
        ? `${icons.tick}<span class="et-btn-label">${interestedLabel}</span>`
        : `<span class="et-btn-label">${interestedLabel}</span>`;
    });
    body.append(btn);
  } else {
    const btn = document.createElement('button');
    btn.className = 'btn et-card-btn';
    btn.type = 'button';
    btn.textContent = 'View';
    body.append(btn);
  }

  card.append(body);
  return card;
}

/* ── Build TRAINING card ────────────────────────────────── */
function buildTrainingCard(training, isPast) {
  let seats = training.seatsOccupied ?? 0;
  const total = training.totalSeats ?? training.seatsTotal ?? 0;

  const card = document.createElement('div');
  card.className = `et-card${isPast ? ' et-card-past' : ''}`;
  card.append(buildImageWrap(training));

  const body = document.createElement('div');
  body.className = 'et-card-body';

  const title = document.createElement('h3');
  title.className = 'et-card-title';
  title.textContent = training.title;

  const desc = document.createElement('p');
  desc.className = 'et-card-desc';
  desc.textContent = training.description;

  const meta = document.createElement('div');
  meta.className = 'et-card-meta';

  const dateDisplay = training.date
    ? `${formatDate(training.date)} · ${training.time || ''}`
    : 'TBD';

  [
    { icon: icons.calendar, text: dateDisplay },
    { icon: icons.location, text: training.venue || 'TBD' },
    { icon: icons.trainer,  text: `Trainer: <strong>${training.trainerName || 'TBD'}</strong>` },
  ].forEach(({ icon, text }) => {
    const row = document.createElement('span');
    row.className = 'et-meta-row';
    row.innerHTML = `${icon}<span>${text}</span>`;
    meta.append(row);
  });

  body.append(title, desc, meta);

  if (!isPast) {
    if (total > 0) {
      const { wrap: seatsWrap, count: seatsCount, fill: seatsFill } = buildSeatsBar(seats, total);
      body.append(seatsWrap);

      const btnRow = document.createElement('div');
      btnRow.className = 'et-btn-row';

      const acceptBtn = document.createElement('button');
      acceptBtn.className = 'btn et-accept-btn';
      acceptBtn.type = 'button';
      acceptBtn.innerHTML = `<span>Accept</span>`;

      const declineBtn = document.createElement('button');
      declineBtn.className = 'btn et-decline-btn';
      declineBtn.type = 'button';
      declineBtn.innerHTML = `<span>Decline</span>`;

      acceptBtn.addEventListener('click', () => {
        if (acceptBtn.classList.contains('is-accepted')) return;
        acceptBtn.classList.add('is-accepted');
        acceptBtn.innerHTML = `${icons.tick}<span>Accepted</span>`;
        declineBtn.disabled = true;
        declineBtn.classList.add('is-disabled');
        if (seats < total) {
          seats += 1;
          seatsCount.textContent = `${seats} / ${total}`;
          seatsFill.style.width = `${Math.min((seats / total) * 100, 100)}%`;
        }
      });

      declineBtn.addEventListener('click', () => {
        mountDeclineModal(training.title, () => {
          declineBtn.classList.add('is-declined');
          declineBtn.innerHTML = `${icons.close}<span>Declined</span>`;
          acceptBtn.disabled = true;
          acceptBtn.classList.add('is-disabled');
        });
      });

      btnRow.append(acceptBtn, declineBtn);
      body.append(buildTimer(training.date), btnRow);
    } else {
      body.append(buildTimer(training.date));
    }
  } else {
    const recBtn = document.createElement('button');
    recBtn.className = 'btn et-recording-btn';
    recBtn.type = 'button';
    recBtn.textContent = 'Watch Recording';
    body.append(recBtn);
  }

  card.append(body);
  return card;
}

/* ── Split items into upcoming / past ───────────────────── */
function splitByDate(items) {
  const upcoming = [];
  const past = [];
  items.forEach((item) => {
    if (!item.date) {
      upcoming.push(item);
    } else if (isPastItem(item)) {
      past.push(item);
    } else {
      upcoming.push(item);
    }
  });
  return { upcoming, past };
}

/* ── Build a labelled section with 3-col grid ───────────── */
function buildSection(items, label, buildFn) {
  const section = document.createElement('div');
  section.className = 'et-section';
  if (label) {
    const h2 = document.createElement('h2');
    h2.className = 'et-section-label';
    h2.textContent = label;
    section.append(h2);
  }
  const grid = document.createElement('div');
  grid.className = 'et-grid';
  items.forEach((item) => grid.append(buildFn(item)));
  section.append(grid);
  return section;
}

/* ── Build EVENTS tab panel ─────────────────────────────── */
function buildEventsPanel(events, interestedLabel) {
  const panel = document.createElement('div');
  panel.className = 'et-panel';
  panel.dataset.tab = 'events';
  const { upcoming, past } = splitByDate(events);
  if (upcoming.length) {
    panel.append(buildSection(upcoming, '', (evt) => buildEventCard(evt, false, interestedLabel)));
  }
  if (past.length) {
    panel.append(buildSection(past, 'Past Events', (evt) => buildEventCard(evt, true, interestedLabel)));
  }
  return panel;
}

/* ── Build TRAINING tab panel ───────────────────────────── */
function buildTrainingPanel(trainings) {
  const panel = document.createElement('div');
  panel.className = 'et-panel';
  panel.dataset.tab = 'training';
  const { upcoming, past } = splitByDate(trainings);
  if (upcoming.length) {
    panel.append(buildSection(upcoming, '', (trn) => buildTrainingCard(trn, false)));
  }
  if (past.length) {
    panel.append(buildSection(past, 'Past Trainings', (trn) => buildTrainingCard(trn, true)));
  }
  return panel;
}

/* ── Fetch from Adobe I/O ───────────────────────────────── */
async function fetchEventsAndTrainings() {
  const { adobeIoEndpoint } = getConfig();
  const url = `${adobeIoEndpoint}/eventsAndTrainings`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  /*
   * Adobe I/O may return either:
   *   { eventsAndTrainings: [...] }   ← same as db.json shape
   *   [...]                           ← bare array
   */
  const all = Array.isArray(data)
    ? data
    : (data.eventsAndTrainings || data.body?.eventsAndTrainings || []);

  const published = all.filter((item) => item.status === 'live');

  // Sort newest-first: MongoDB ObjectIds embed creation timestamp in the first 8 hex chars
  published.sort((a, b) => {
    const idA = a._id || a.id || '';
    const idB = b._id || b.id || '';
    if (idB > idA) return 1;
    if (idB < idA) return -1;
    return 0;
  });

  return {
    events:    published.filter((item) => item.type === 'event'),
    trainings: published.filter((item) => item.type === 'training'),
  };
}

/* ── EDS decorate ───────────────────────────────────────── */
export default async function decorate(block) {
  const authoredLabel = block.querySelector('p')?.textContent?.trim()
    || block.querySelector('div')?.textContent?.trim();
  const interestedLabel = authoredLabel || "I'm Interested";

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/styles/buttons.css';
  document.head.append(link);

  // Build tab shell immediately so layout doesn't jump
  block.innerHTML = '';

  const tabBar = document.createElement('div');
  tabBar.className = 'et-tab-bar';

  const tabEvents = document.createElement('button');
  tabEvents.className = 'et-tab is-active';
  tabEvents.type = 'button';
  tabEvents.textContent = 'Events';
  tabEvents.dataset.target = 'events';

  const tabTraining = document.createElement('button');
  tabTraining.className = 'et-tab';
  tabTraining.type = 'button';
  tabTraining.textContent = 'Training';
  tabTraining.dataset.target = 'training';

  tabBar.append(tabEvents, tabTraining);
  block.append(tabBar);

  // Loading state
  const loader = document.createElement('p');
  loader.className = 'et-loading';
  loader.textContent = 'Loading…';
  block.append(loader);

  // Fetch from Adobe I/O
  let events = [];
  let trainings = [];

  try {
    ({ events, trainings } = await fetchEventsAndTrainings());
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[events-training] Adobe I/O fetch failed:', err);
    loader.textContent = 'Failed to load events. Please try again later.';
    return;
  }

  loader.remove();

  const eventsPanel   = buildEventsPanel(events, interestedLabel);
  const trainingPanel = buildTrainingPanel(trainings);
  trainingPanel.classList.add('is-hidden');

  function switchTab(targetKey) {
    [tabEvents, tabTraining].forEach((t) => {
      t.classList.toggle('is-active', t.dataset.target === targetKey);
    });
    [eventsPanel, trainingPanel].forEach((p) => {
      p.classList.toggle('is-hidden', p.dataset.tab !== targetKey);
    });
  }

  tabEvents.addEventListener('click',   () => switchTab('events'));
  tabTraining.addEventListener('click', () => switchTab('training'));

  block.append(eventsPanel, trainingPanel);
}