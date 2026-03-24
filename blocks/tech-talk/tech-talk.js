/**
 * tech-talk.js — Adobe Connect EDS block
 *
 * DA.live: add a "tech-talk" block table on your /tech-talk document.
 *
 *   | tech-talk |
 *   |-----------|
 *   |           |
 *
 * Update the two URL constants below to point to the correct
 * Adobe Tech Talks page URLs.
 */

const UPCOMING_URL = 'https://community.adobe.com/t5/tech-talks/eb-p/tech-talks';
const PAST_URL     = 'https://community.adobe.com/t5/tech-talks/eb-p/tech-talks?filter=past';

/* ── External link icon ─────────────────────────────────── */
const externalIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
  viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
  <polyline points="15 3 21 3 21 9"/>
  <line x1="10" y1="14" x2="21" y2="3"/>
</svg>`;

/* ── Calendar icon ──────────────────────────────────────── */
const upcomingIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
  viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
  <line x1="16" y1="2" x2="16" y2="6"/>
  <line x1="8"  y1="2" x2="8"  y2="6"/>
  <line x1="3"  y1="10" x2="21" y2="10"/>
</svg>`;

/* ── Clock icon ─────────────────────────────────────────── */
const pastIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
  viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <polyline points="12 6 12 12 16 14"/>
</svg>`;

/* ── EDS decorate ───────────────────────────────────────── */
export default function decorate(block) {
  block.innerHTML = '';

  /* Wrapper */
  const wrapper = document.createElement('div');
  wrapper.className = 'tt-wrapper';

  /* Title */
  const title = document.createElement('h1');
  title.className = 'tt-title';
  title.textContent = 'Adobe Tech Talks';

  /* Subtitle */
  const subtitle = document.createElement('p');
  subtitle.className = 'tt-subtitle';
  subtitle.textContent = 'Deep-dive sessions from Adobe engineers, designers, and product experts — live and on demand.';

  /* Button group */
  const btnGroup = document.createElement('div');
  btnGroup.className = 'tt-btn-group';

  /* Upcoming Tech Talks — red filled */
  const upcomingBtn = document.createElement('a');
  upcomingBtn.className = 'tt-btn';
  upcomingBtn.href = UPCOMING_URL;
  upcomingBtn.target = '_blank';
  upcomingBtn.rel = 'noopener noreferrer';
  upcomingBtn.innerHTML = `${upcomingIcon}<span>Upcoming Tech Talks</span>${externalIcon}`;

  /* Past Tech Talks — red filled */
  const pastBtn = document.createElement('a');
  pastBtn.className = 'tt-btn';
  pastBtn.href = PAST_URL;
  pastBtn.target = '_blank';
  pastBtn.rel = 'noopener noreferrer';
  pastBtn.innerHTML = `${pastIcon}<span>Past Tech Talks</span>${externalIcon}`;

  btnGroup.append(upcomingBtn, pastBtn);
  wrapper.append(title, subtitle, btnGroup);
  block.append(wrapper);
}