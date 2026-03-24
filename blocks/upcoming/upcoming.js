import { html, render } from '../../vendor/htm-preact.js';
import { useState, useCallback } from '../../vendor/preact-hooks.js';

/* ── Decline Modal ── */
function DeclineModal({ onConfirm, onCancel }) {
  const [reason, setReason] = useState('');

  return html`
    <div class="upcoming-modal__overlay" onClick=${onCancel}>
      <div class="upcoming-modal" onClick=${(e) => e.stopPropagation()}>
        <h4 class="upcoming-modal__title">Reason for Declining</h4>
        <textarea
          class="upcoming-modal__textarea"
          placeholder="Write your reason here..."
          rows="4"
          value=${reason}
          onInput=${(e) => setReason(e.target.value)}>
        </textarea>
        <div class="upcoming-modal__actions">
          <button class="upcoming-modal__cancel" onClick=${onCancel}>Cancel</button>
          <button
            class="upcoming-modal__confirm"
            disabled=${!reason.trim()}
            onClick=${() => reason.trim() && onConfirm(reason.trim())}>
            Confirm
          </button>
        </div>
      </div>
    </div>`;
}

/* ── Single Item Card ── */
function ItemCard({ item, interested, trainingStatus, onToggleInterested, onAccept, onDecline }) {
  const isTraining = item.tag === 'TRAINING';
  const status     = trainingStatus[item.id];

  return html`
    <div class="upcoming-block__card">
      <div class="upcoming-block__visual ${isTraining ? 'upcoming-block__visual--training' : ''}">
        <span class="upcoming-block__tag upcoming-block__tag--${item.tag.toLowerCase()}">${item.tag}</span>
      </div>
      <div class="upcoming-block__body">
        <h4 class="upcoming-block__event-title">${item.title}</h4>
        <ul class="upcoming-block__meta">
          <li>
            <img class="upcoming-block__icon" src="/icons/events-training.svg" alt="" />
            ${item.date} • ${item.time}
          </li>
          <li>
            <img class="upcoming-block__icon" src="/icons/events.svg" alt="" />
            ${item.location}
          </li>
          <li>
            <img class="upcoming-block__icon" src="/icons/participation.svg" alt="" />
            Respond within ${item.respond_within}
          </li>
        </ul>

        ${!isTraining && html`
          <button
            class="upcoming-block__btn ${interested[item.id] ? 'upcoming-block__btn--active' : ''}"
            onClick=${() => onToggleInterested(item.id)}>
            ${interested[item.id] ? "Interested!" : "I'm Interested"}
          </button>`}

        ${isTraining && !status && html`
          <div class="upcoming-block__btn-group">
            <button class="upcoming-block__btn-decline" onClick=${() => onDecline(item.id)}>
              Decline
            </button>
            <button class="upcoming-block__btn-accept" onClick=${() => onAccept(item.id)}>
              Accept
            </button>
          </div>`}

        ${isTraining && status === 'accepted' && html`
          <div class="upcoming-block__status upcoming-block__status--accepted">✓ Accepted</div>`}

        ${isTraining && status === 'declined' && html`
          <div class="upcoming-block__status upcoming-block__status--declined">✕ Declined</div>`}
      </div>
    </div>`;
}

/* ── Main Upcoming Component ── */
function Upcoming({ data }) {
  const { title, items } = data;
  const [current, setCurrent]           = useState(0);
  const [interested, setInterested]     = useState(() =>
    items.reduce((acc, i) => ({ ...acc, [i.id]: i.interested }), {})
  );
  const [trainingStatus, setTrainingStatus] = useState({});
  const [showDecline, setShowDecline]       = useState(null);

  const prev = useCallback(() => setCurrent(c => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent(c => Math.min(items.length - 1, c + 1)), [items.length]);

  const toggleInterested = (id) => setInterested(s => ({ ...s, [id]: !s[id] }));
  const handleAccept     = (id) => setTrainingStatus(s => ({ ...s, [id]: 'accepted' }));
  const handleDecline    = (id) => setShowDecline(id);
  const handleDeclineConfirm = (reason) => {
    setTrainingStatus(s => ({ ...s, [showDecline]: 'declined' }));
    setShowDecline(null);
  };

  const item = items[current];

  const ArrowLeft  = html`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
  const ArrowRight = html`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;

  return html`
    <div class="upcoming-block">
      <h3 class="upcoming-block__title">${title}</h3>

      <${ItemCard}
        item=${item}
        interested=${interested}
        trainingStatus=${trainingStatus}
        onToggleInterested=${toggleInterested}
        onAccept=${handleAccept}
        onDecline=${handleDecline} />

      <div class="upcoming-block__nav">
        <button class="upcoming-block__arrow" onClick=${prev}
          disabled=${current === 0}>${ArrowLeft}</button>
        <div class="upcoming-block__dots">
          ${items.map((_, i) => html`
            <button
              class="upcoming-block__dot ${i === current ? 'upcoming-block__dot--active' : ''}"
              onClick=${() => setCurrent(i)}>
            </button>`)}
        </div>
        <button class="upcoming-block__arrow" onClick=${next}
          disabled=${current === items.length - 1}>${ArrowRight}</button>
      </div>

      ${showDecline !== null && html`
        <${DeclineModal}
          onConfirm=${handleDeclineConfirm}
          onCancel=${() => setShowDecline(null)} />`}
    </div>`;
}

export default async function decorate(block) {
  const resp = await fetch('public/mock.json');
  const json = await resp.json();
  const data = json.upcoming;
  block.innerHTML = '';
  render(html`<${Upcoming} data=${data} />`, block);
}