import { html, render } from '../../vendor/htm-preact.js';
import { useState, useCallback } from '../../vendor/preact-hooks.js';
import Modal from '../../helper/modal.js';

function buildUpcomingData(json) {
  const items = (json.eventsAndTrainings || [])
    .filter(({ date, status }) => date && status === 'live')
    .map((item) => ({
      id: item.id,
      tag: item.type === 'training' ? 'UPCOMING TRAINING' : 'UPCOMING EVENT',
      title: item.title,
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: item.time || '',
      location: item.venue || '',
      respond_within: '',
      interested: false,
    }));

  return { title: 'Upcoming Events/Trainings', items };
}

function ItemCard({ item, interested, trainingStatus, onToggleInterested, onAccept, onDecline }) {
  const isTraining = item.tag.includes('TRAINING');
  const status = trainingStatus[item.id];

  return html`
    <div class="upcoming-block__card">
      <div class="upcoming-block__visual ${isTraining ? 'upcoming-block__visual--training' : ''}">
        <span class="upcoming-block__tag upcoming-block__tag--${item.tag.toLowerCase().replace(/\s+/g, '-')}">${item.tag}</span>
      </div>
      <div class="upcoming-block__body">
        <h4 class="upcoming-block__event-title">${item.title}</h4>
        <ul class="upcoming-block__meta">
          <li>
            <img class="upcoming-block__icon" src="/icons/events-training.svg" alt="" />
            ${item.date}${item.time ? ` • ${item.time}` : ''}
          </li>
          <li>
            <img class="upcoming-block__icon" src="/icons/events.svg" alt="" />
            ${item.location}
          </li>
          ${item.respond_within && html`
            <li>
              <img class="upcoming-block__icon" src="/icons/participation.svg" alt="" />
              Respond within ${item.respond_within}
            </li>`}
        </ul>

        ${!isTraining && html`
          <button
            class="btn upcoming-block__btn ${interested[item.id] ? 'upcoming-block__btn--active' : ''}"
            onClick=${() => onToggleInterested(item.id)}>
            ${interested[item.id] ? 'Interested!' : "I'm Interested"}
          </button>`}

        ${isTraining && !status && html`
          <div class="upcoming-block__btn-group">
            <button class="btn upcoming-block__btn-decline" onClick=${() => onDecline(item.id)}>
              Decline
            </button>
            <button class="btn upcoming-block__btn-accept" onClick=${() => onAccept(item.id)}>
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

function Upcoming({ data }) {
  const { title, items } = data;
  const [current, setCurrent]               = useState(0);
  const [interested, setInterested]         = useState(() =>
    items.reduce((acc, i) => ({ ...acc, [i.id]: i.interested }), {}),
  );
  const [trainingStatus, setTrainingStatus] = useState({});
  const [declineId, setDeclineId]           = useState(null);
  const [reason, setReason]                 = useState('');

  const prev = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent((c) => Math.min(items.length - 1, c + 1)), [items.length]);

  const toggleInterested    = (id) => setInterested((s) => ({ ...s, [id]: !s[id] }));
  const handleAccept        = (id) => setTrainingStatus((s) => ({ ...s, [id]: 'accepted' }));
  const handleDeclineOpen   = (id) => { setDeclineId(id); setReason(''); };
  const handleDeclineClose  = () => { setDeclineId(null); setReason(''); };
  const handleDeclineSubmit = () => {
    if (!reason.trim()) return;
    setTrainingStatus((s) => ({ ...s, [declineId]: 'declined' }));
    handleDeclineClose();
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
        onDecline=${handleDeclineOpen} />

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

      <${Modal}
        isOpen=${declineId !== null}
        onClose=${handleDeclineClose}
        modalHeader="Reason for Declining"
        onSubmit=${handleDeclineSubmit}
        submitLabel="Confirm"
        cancelLabel="Cancel">
        <textarea
          class="upcoming-block__decline-textarea"
          placeholder="Write your reason here..."
          rows="4"
          value=${reason}
          onInput=${(e) => setReason(e.target.value)}>
        </textarea>
      </${Modal}>
    </div>`;
}

export default async function decorate(block) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/styles/buttons.css';
  document.head.append(link);

  const resp = await fetch('/db.json');
  const json = await resp.json();
  const data = buildUpcomingData(json);

  block.innerHTML = '';
  render(html`<${Upcoming} data=${data} />`, block);
}