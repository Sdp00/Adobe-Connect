/**
 * events-training.js — Adobe Connect EDS block
 *
 * DA.live: add an "events-training" block table on your /events-training document.
 *
 *   | events-training |
 *   |-----------------|
 *   |                 |
 *
 * Folder structure:
 *   /blocks/events-training/events-training.js
 *   /blocks/events-training/events-training.css
 *   /blocks/events-training/mock.json
 *   /styles/buttons.css
 */

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

  play: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"/>
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

/* ── Countdown ──────────────────────────────────────────── */
function getCountdown(dateStr) {
  const target = new Date(dateStr);
  target.setHours(23, 59, 59, 0);
  const diff = target - new Date();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d ${hours}h remaining`;
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
function buildDeclineModal(trainingTitle, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'et-modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'et-modal';

  const header = document.createElement('div');
  header.className = 'et-modal-header';

  const htitle = document.createElement('h3');
  htitle.className = 'et-modal-title';
  htitle.textContent = 'Reason for declining';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'et-modal-close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.innerHTML = icons.close;
  closeBtn.addEventListener('click', () => overlay.remove());

  header.append(htitle, closeBtn);

  const sub = document.createElement('p');
  sub.className = 'et-modal-sub';
  sub.textContent = trainingTitle;

  const reasonLabel = document.createElement('label');
  reasonLabel.className = 'et-modal-label';
  reasonLabel.textContent = 'Please tell us why you are declining';

  const reasonInput = document.createElement('textarea');
  reasonInput.className = 'et-modal-textarea';
  reasonInput.placeholder = 'Type your reason here…';
  reasonInput.rows = 4;

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn et-modal-confirm';
  confirmBtn.type = 'button';
  confirmBtn.textContent = 'Confirm decline';
  confirmBtn.disabled = true;

  reasonInput.addEventListener('input', () => {
    confirmBtn.disabled = reasonInput.value.trim().length === 0;
  });

  confirmBtn.addEventListener('click', () => {
    onConfirm(reasonInput.value.trim());
    overlay.remove();
  });

  modal.append(header, sub, reasonLabel, reasonInput, confirmBtn);
  overlay.append(modal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  return overlay;
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

/* ── Build EVENT card ───────────────────────────────────── */
function buildEventCard(event) {
  const isPast = event.type === 'past';

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

  const dateEl = document.createElement('span');
  dateEl.className = 'et-meta-row';
  dateEl.innerHTML = `${icons.calendar}<span>${event.date} · ${event.time}</span>`;

  const locEl = document.createElement('span');
  locEl.className = 'et-meta-row';
  locEl.innerHTML = `${icons.location}<span>${event.location}</span>`;

  meta.append(dateEl, locEl);

  const btn = document.createElement('button');
  btn.className = 'btn et-card-btn';
  btn.type = 'button';

  if (isPast) {
    btn.textContent = 'View';
  } else {
    btn.innerHTML = `<span class="et-btn-label">I'm Interested</span>`;
    btn.addEventListener('click', () => {
      const interested = btn.classList.toggle('is-interested');
      btn.innerHTML = interested
        ? `${icons.tick}<span class="et-btn-label">I'm Interested</span>`
        : `<span class="et-btn-label">I'm Interested</span>`;
    });
  }

  body.append(title, desc, meta, btn);
  card.append(body);
  return card;
}

/* ── Build TRAINING card ────────────────────────────────── */
function buildTrainingCard(training) {
  const isPast = training.type === 'past';
  let seats = training.seatsOccupied;
  const total = training.seatsTotal;

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

  [
    { icon: icons.calendar, text: `${training.displayDate} · ${training.time}` },
    { icon: icons.location, text: training.location },
    { icon: icons.trainer,  text: `Trainer: <strong>${training.trainer}</strong>` },
  ].forEach(({ icon, text }) => {
    const row = document.createElement('span');
    row.className = 'et-meta-row';
    row.innerHTML = `${icon}<span>${text}</span>`;
    meta.append(row);
  });

  body.append(title, desc, meta);

  if (!isPast) {
    const { wrap: seatsWrap, count: seatsCount, fill: seatsFill } = buildSeatsBar(seats, total);
    body.append(seatsWrap);

    const timerWrap = document.createElement('div');
    timerWrap.className = 'et-timer';
    timerWrap.innerHTML = `${icons.clock}<span class="et-timer-text">${getCountdown(training.date) || 'Starting soon'}</span>`;
    body.append(timerWrap);

    const btnRow = document.createElement('div');
    btnRow.className = 'et-btn-row';

    const acceptBtn = document.createElement('button');
    acceptBtn.className = 'btn et-accept-btn';
    acceptBtn.type = 'button';
    acceptBtn.innerHTML = `<span>Accept</span>`;

    const declineBtn = document.createElement('button');
    declineBtn.className = 'btn et-decline-btn';
    declineBtn.type = 'button';
    declineBtn.innerHTML = `${icons.close}<span>Decline</span>`;

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
      const modal = buildDeclineModal(training.title, () => {
        declineBtn.classList.add('is-declined');
        declineBtn.innerHTML = `${icons.close}<span>Declined</span>`;
        acceptBtn.disabled = true;
        acceptBtn.classList.add('is-disabled');
      });
      document.body.append(modal);
    });

    btnRow.append(acceptBtn, declineBtn);
    body.append(btnRow);

    const ticker = setInterval(() => {
      const timerText = card.querySelector('.et-timer-text');
      if (!timerText) { clearInterval(ticker); return; }
      const val = getCountdown(training.date);
      timerText.textContent = val || 'Starting soon';
      if (!val) clearInterval(ticker);
    }, 60000);

  } else {
    const recBtn = document.createElement('button');
    recBtn.className = 'btn et-recording-btn';
    recBtn.type = 'button';
    recBtn.innerHTML = `${icons.play}<span>Watch Recording</span>`;
    body.append(recBtn);
  }

  card.append(body);
  return card;
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

/* ── Build the full EVENTS tab panel ────────────────────── */
function buildEventsPanel(data) {
  const panel = document.createElement('div');
  panel.className = 'et-panel';
  panel.dataset.tab = 'events';

  if (data.upcoming?.length) {
    panel.append(buildSection(data.upcoming, '', buildEventCard));
  }
  if (data.past?.length) {
    panel.append(buildSection(data.past, 'Past Events', buildEventCard));
  }
  return panel;
}

/* ── Build the full TRAINING tab panel ──────────────────── */
function buildTrainingPanel(data) {
  const panel = document.createElement('div');
  panel.className = 'et-panel';
  panel.dataset.tab = 'training';

  if (data.upcoming?.length) {
    panel.append(buildSection(data.upcoming, '', buildTrainingCard));
  }
  if (data.past?.length) {
    panel.append(buildSection(data.past, 'Past Trainings', buildTrainingCard));
  }
  return panel;
}

/* ── EDS decorate ───────────────────────────────────────── */
export default async function decorate(block) {
  /* Load buttons.css */
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/styles/buttons.css';
  document.head.append(link);

  /* Fetch data */
  let data = { events: { upcoming: [], past: [] }, training: { upcoming: [], past: [] } };
  try {
    const res = await fetch('/blocks/events-training/mock.json');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[events-training] data fetch failed:', err);
  }

  block.innerHTML = '';

  /* ── Tab bar ── */
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

  /* ── Panels ── */
  const eventsPanel  = buildEventsPanel(data.events);
  const trainingPanel = buildTrainingPanel(data.training);

  /* Training panel hidden by default */
  trainingPanel.classList.add('is-hidden');

  /* ── Tab switching ── */
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

  block.append(tabBar, eventsPanel, trainingPanel);
}