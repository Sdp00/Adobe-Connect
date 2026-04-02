import { html, render } from '../../vendor/htm-preact.js';
import { useState, useEffect } from '../../vendor/preact-hooks.js';
import {
  EventCard, EventItemModal, EventPreviewModal,
  InterestedModal, PastEventCard, AddMediaModal, isPastEvent,
} from './events.js';
import {
  TrainingCard, TrainingItemModal, TrainingPreviewModal, TrainingResponsesModal,
} from './trainings.js';

/* ─────────────────────────────────────────────
   ICON FETCHER  (used by stats only)
───────────────────────────────────────────── */
const iconCache = {};
async function fetchIcon(name) {
  if (iconCache[name]) return iconCache[name];
  try {
    const res = await fetch(`/icons/${name}.svg`);
    if (!res.ok) throw res.status;
    const svg = (await res.text()).replace(/<\?xml[^>]*\?>/g, '').trim();
    iconCache[name] = svg;
    return svg;
  } catch {
    return '';
  }
}

/* ─────────────────────────────────────────────
   STATS
───────────────────────────────────────────── */
const STATS = [
  { icon: 'events',   count: '4', label: 'Events',    filter: 'event' },
  { icon: 'training', count: '6', label: 'Trainings', filter: 'training' },
];

function renderStats(container) {
  Promise.all(STATS.map((s) => fetchIcon(s.icon))).then((svgs) => {
    const grid = document.createElement('div');
    grid.className = 'admin-stats-grid';

    STATS.forEach((stat, i) => {
      const card = document.createElement('div');
      card.className = 'admin-stats-card';

      const left = document.createElement('div');
      left.className = 'admin-stats-left';

      const iconWrap = document.createElement('div');
      iconWrap.className = `admin-stats-icon admin-stats-icon-${stat.icon}`;
      iconWrap.innerHTML = svgs[i];

      const label = document.createElement('p');
      label.className = 'admin-stats-label';
      label.textContent = stat.label;

      left.append(iconWrap, label);

      const count = document.createElement('p');
      count.className = 'admin-stats-count';
      count.textContent = stat.count;

      card.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('ac:filter-change', { detail: stat.filter }));
        const target = document.getElementById('events-training');
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });

      card.append(left, count);
      grid.append(card);
    });

    container.appendChild(grid);
  });
}

/* ─────────────────────────────────────────────
   DATA FETCH
───────────────────────────────────────────── */
async function fetchData() {
  const res = await fetch('/db.json');
  if (!res.ok) throw new Error(`Failed to load db.json (${res.status})`);
  const json = await res.json();
  return json.eventsAndTrainings;
}

/* ─────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────── */
function EventsTrainingsApp() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('event');
  const [editItem, setEditItem] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [interestedItem, setInterestedItem] = useState(null);
  const [mediaItem, setMediaItem] = useState(null);
  const [respItem, setRespItem] = useState(null);

  useEffect(() => {
    fetchData()
      .then((data) => { setItems(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  useEffect(() => {
    const handler = (e) => setFilter(e.detail);
    document.addEventListener('ac:filter-change', handler);
    return () => document.removeEventListener('ac:filter-change', handler);
  }, []);

  const upcomingItems = items.filter((i) => !isPastEvent(i));
  const pastEvents = items.filter(isPastEvent);
  const filtered = filter === 'all' ? upcomingItems : upcomingItems.filter((i) => i.type === filter);

  const saveItem = (form, status) => {
    const updated = { ...form, status };
    setItems((prev) =>
      editItem
        ? prev.map((i) => (i.id === editItem.id ? { ...i, ...updated } : i))
        : [...prev, { ...updated, id: Date.now(), responses: null }],
    );
  };

  const handleSaveMedia = (media) => {
    setItems((prev) => prev.map((i) => (i.id === mediaItem.id ? { ...i, media } : i)));
  };

  const handleToggleStatus = (item) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: i.status === 'live' ? 'draft' : 'live' } : i)),
    );
  };

  const openAdd = (type) => { setModalType(type); setEditItem(null); setModalOpen(true); };
  const openEdit = (item) => { setModalType(item.type); setEditItem(item); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditItem(null); };

  const TABS = [
    { key: 'all',      label: 'All' },
    { key: 'event',    label: 'Events' },
    { key: 'training', label: 'Trainings' },
  ];

  if (loading) return html`<div class="ac-state-loading"><span class="ac-spinner"></span>Loading...</div>`;
  if (error)   return html`<div class="ac-state-error">Failed to load data: ${error}</div>`;

  return html`
    <div class="ac-events-section" id="events-training">

      <div class="ac-section-header">
        <div class="ac-section-title">
          <h2>Events & Training</h2>
          <p>Manage all events and training sessions in one place</p>
        </div>
        <div class="ac-section-actions">
          <button class="ac-btn ac-btn--outline" onClick=${() => openAdd('event')}>+ Event</button>
          <button class="ac-btn ac-btn--outline" onClick=${() => openAdd('training')}>+ Training</button>
        </div>
      </div>

      <div class="ac-tabs">
        ${TABS.map(({ key, label }) => html`
          <button
            class=${'ac-tab' + (filter === key ? ' active' : '')}
            onClick=${() => setFilter(key)}
          >${label}</button>
        `)}
      </div>

      <div class="ac-grid">
        ${filtered.map((item) => item.type === 'event'
          ? html`<${EventCard}
              key=${item.id} item=${item}
              onEdit=${openEdit}
              onPreview=${(i) => setPreviewItem(i)}
              onInterested=${(i) => setInterestedItem(i)}
              onToggleStatus=${handleToggleStatus}
            />`
          : html`<${TrainingCard}
              key=${item.id} item=${item}
              onEdit=${openEdit}
              onPreview=${(i) => setPreviewItem(i)}
              onToggleStatus=${handleToggleStatus}
              onViewResponses=${(i) => setRespItem(i)}
            />`
        )}
      </div>

      ${modalOpen && modalType === 'event' && html`
        <${EventItemModal}
          key=${editItem ? editItem.id : 'new-event'}
          isOpen=${modalOpen}
          onClose=${closeModal}
          editItem=${editItem}
          onSaveDraft=${(form) => saveItem(form, 'draft')}
          onPublish=${(form) => saveItem(form, 'live')}
        />`}

      ${modalOpen && modalType === 'training' && html`
        <${TrainingItemModal}
          key=${editItem ? editItem.id : 'new-training'}
          isOpen=${modalOpen}
          onClose=${closeModal}
          editItem=${editItem}
          onSaveDraft=${(form) => saveItem(form, 'draft')}
          onPublish=${(form) => saveItem(form, 'live')}
        />`}

      <${EventPreviewModal}
        isOpen=${!!previewItem && previewItem?.type === 'event'}
        onClose=${() => setPreviewItem(null)}
        item=${previewItem}
      />

      <${TrainingPreviewModal}
        isOpen=${!!previewItem && previewItem?.type === 'training'}
        onClose=${() => setPreviewItem(null)}
        item=${previewItem}
      />

      <${InterestedModal}
        isOpen=${!!interestedItem}
        onClose=${() => setInterestedItem(null)}
        item=${interestedItem}
      />

      <${TrainingResponsesModal}
        isOpen=${!!respItem}
        onClose=${() => setRespItem(null)}
        item=${respItem}
      />

      ${pastEvents.length > 0 && filter !== 'training' && html`
        <div class="ac-past-section" id="past-events">
          <div class="ac-section-header">
            <div class="ac-section-title">
              <h2>Past Events</h2>
              <p>Events that have already taken place — add media for employees to view</p>
            </div>
          </div>
          <div class="ac-grid">
            ${pastEvents.map((item) => html`
              <${PastEventCard}
                key=${item.id}
                item=${item}
                onAddMedia=${(i) => setMediaItem(i)}
                onInterested=${(i) => setInterestedItem(i)}
              />
            `)}
          </div>
        </div>
      `}

      <${AddMediaModal}
        key=${mediaItem?.id}
        isOpen=${!!mediaItem}
        onClose=${() => setMediaItem(null)}
        item=${mediaItem}
        onSave=${handleSaveMedia}
      />

    </div>
  `;
}

/* ─────────────────────────────────────────────
   BLOCK ENTRY
───────────────────────────────────────────── */
export function openCreateModal() {
  document.dispatchEvent(new CustomEvent('ac:open-create'));
}

export default async function decorate(block) {
  block.textContent = '';

  const statsContainer = document.createElement('div');
  block.appendChild(statsContainer);
  renderStats(statsContainer);

  const appRoot = document.createElement('div');
  block.appendChild(appRoot);
  render(html`<${EventsTrainingsApp} />`, appRoot);
}