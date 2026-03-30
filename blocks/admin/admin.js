import { html, render } from '../../vendor/htm-preact.js';
import { useState, useEffect } from '../../vendor/preact-hooks.js';
import {
  EventCard, EventItemModal, EventPreviewModal,
  InterestedModal, PastEventCard, AddMediaModal, isPastEvent,
} from './events.js';
import { TrainingCard, TrainingItemModal, TrainingPreviewModal } from './trainings.js';

/* ─── Read config from authored block HTML ─── */
function parseConfig(block) {
  const getRow = (key) => [...block.children]
    .find((r) => r.children[0]?.textContent.trim().toLowerCase() === key)
    ?.children[1];

  return {
    title:    getRow('title')?.querySelector('strong, h2')?.textContent.trim() || '',
    subtitle: getRow('sub-title')?.querySelector('p')?.textContent.trim() || '',
    icons:    [...(getRow('stat-card-svg')?.querySelectorAll('span.icon') || [])].map((s) => s.cloneNode(true)),
    buttons:  [...(getRow('buttons')?.querySelectorAll('p') || [])].map((p) => p.textContent.trim().replace(/^\+\s*/, '')),
    tabs:     [...(getRow('categories')?.querySelectorAll('p') || [])].map((p) => p.textContent.trim()),
  };
}

/* ─── Stat cards ─── */
function buildStats(container, { icons, buttons }) {
  const TYPE = { events: 'event', trainings: 'training' };
  const grid = document.createElement('div');
  grid.className = 'admin-stats-grid';

  buttons.forEach((label, i) => {
    const filter = TYPE[label.toLowerCase()] || label.toLowerCase().replace(/s$/, '');

    const card = document.createElement('div');
    card.className = 'admin-stats-card';

    const left = document.createElement('div');
    left.className = 'admin-stats-left';

    const iconWrap = document.createElement('div');
    iconWrap.className = 'admin-stats-icon';
    if (icons[i]) iconWrap.appendChild(icons[i]);

    const labelEl = document.createElement('p');
    labelEl.className = 'admin-stats-label';
    labelEl.textContent = label;

    const countEl = document.createElement('p');
    countEl.className = 'admin-stats-count';
    countEl.dataset.filter = filter;

    left.append(iconWrap, labelEl);
    card.append(left, countEl);

    card.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('ac:filter-change', { detail: filter }));
      document.getElementById('events-training')?.scrollIntoView({ behavior: 'smooth' });
    });

    grid.appendChild(card);
  });

  container.appendChild(grid);
}

/* ─── Fetch data ─── */
async function fetchData() {
  const res = await fetch('/db.json');
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return (await res.json()).eventsAndTrainings;
}

/* ─── Main app ─── */
function App({ title, subtitle, tabs, buttons }) {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [filter, setFilter]     = useState('all');
  const [modal, setModal]       = useState({ open: false, type: 'event', item: null });
  const [preview, setPreview]   = useState(null);
  const [interested, setInterested] = useState(null);
  const [mediaItem, setMediaItem]   = useState(null);

  /* load data + update stat counts */
  useEffect(() => {
    fetchData()
      .then((data) => {
        setItems(data);
        setLoading(false);
        const counts = {};
        data.filter((i) => !isPastEvent(i)).forEach((i) => { counts[i.type] = (counts[i.type] || 0) + 1; });
        document.querySelectorAll('.admin-stats-count').forEach((el) => {
          el.textContent = counts[el.dataset.filter] ?? 0;
        });
      })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  /* listen for stat-card filter clicks */
  useEffect(() => {
    const h = (e) => setFilter(e.detail);
    document.addEventListener('ac:filter-change', h);
    return () => document.removeEventListener('ac:filter-change', h);
  }, []);

  const upcoming = items.filter((i) => !isPastEvent(i));
  const past     = items.filter(isPastEvent);
  const shown    = filter === 'all' ? upcoming : upcoming.filter((i) => i.type === filter);

  /* helpers */
  const save = (form, status) => setItems((prev) =>
    modal.item
      ? prev.map((i) => (i.id === modal.item.id ? { ...i, ...form, status } : i))
      : [...prev, { ...form, status, id: Date.now(), responses: null }],
  );

  const toggleStatus = (item) => setItems((prev) =>
    prev.map((i) => (i.id === item.id ? { ...i, status: i.status === 'live' ? 'draft' : 'live' } : i)),
  );

  const openAdd  = (type) => setModal({ open: true, type, item: null });
  const openEdit = (item) => setModal({ open: true, type: item.type, item });
  const closeModal = () => setModal((m) => ({ ...m, open: false, item: null }));

  /* derive types from authored button labels */
  const TYPE    = { events: 'event', trainings: 'training' };
  const TAB_KEY = { all: 'all', events: 'event', trainings: 'training' };

  const addBtns = buttons.map((label) => {
    const type = TYPE[label.toLowerCase()] || label.toLowerCase().replace(/s$/, '');
    return html`<button class="ac-btn ac-btn--outline" onClick=${() => openAdd(type)}>+ ${label}</button>`;
  });

  const tabItems = tabs.map((label) => ({ key: TAB_KEY[label.toLowerCase()] || label.toLowerCase(), label }));

  if (loading) return html`<div class="ac-state-loading"><span class="ac-spinner"></span>Loading...</div>`;
  if (error)   return html`<div class="ac-state-error">Error: ${error}</div>`;

  return html`
    <div class="ac-events-section" id="events-training">

      <div class="ac-section-header">
        <div class="ac-section-title">
          <h2>${title}</h2>
          <p>${subtitle}</p>
        </div>
        <div class="ac-section-actions">${addBtns}</div>
      </div>

      <div class="ac-tabs">
        ${tabItems.map(({ key, label }) => html`
          <button class=${'ac-tab' + (filter === key ? ' active' : '')} onClick=${() => setFilter(key)}>
            ${label}
          </button>
        `)}
      </div>

      <div class="ac-grid">
        ${shown.map((item) => item.type === 'event'
          ? html`<${EventCard} key=${item.id} item=${item}
              onEdit=${openEdit} onPreview=${setPreview}
              onInterested=${setInterested} onToggleStatus=${toggleStatus} />`
          : html`<${TrainingCard} key=${item.id} item=${item}
              onEdit=${openEdit} onPreview=${setPreview}
              onToggleStatus=${toggleStatus} />`,
        )}
      </div>

      ${modal.open && modal.type === 'event' && html`
        <${EventItemModal} key=${modal.item?.id || 'new'} isOpen=${true} editItem=${modal.item}
          onClose=${closeModal}
          onSaveDraft=${(f) => save(f, 'draft')}
          onPublish=${(f) => save(f, 'live')} />`}

      ${modal.open && modal.type === 'training' && html`
        <${TrainingItemModal} key=${modal.item?.id || 'new'} isOpen=${true} editItem=${modal.item}
          onClose=${closeModal}
          onSaveDraft=${(f) => save(f, 'draft')}
          onPublish=${(f) => save(f, 'live')} />`}

      <${EventPreviewModal}
        isOpen=${!!preview && preview.type === 'event'}
        onClose=${() => setPreview(null)} item=${preview} />

      <${TrainingPreviewModal}
        isOpen=${!!preview && preview.type === 'training'}
        onClose=${() => setPreview(null)} item=${preview} />

      <${InterestedModal}
        isOpen=${!!interested} onClose=${() => setInterested(null)} item=${interested} />

      ${past.length > 0 && filter !== 'training' && html`
        <div class="ac-past-section" id="past-events">
          <div class="ac-section-header">
            <div class="ac-section-title">
              <h2>Past Events</h2>
              <p>Events that have already taken place — add media for employees to view</p>
            </div>
          </div>
          <div class="ac-grid">
            ${past.map((item) => html`
              <${PastEventCard} key=${item.id} item=${item}
                onAddMedia=${setMediaItem} onInterested=${setInterested} />`)}
          </div>
        </div>`}

      <${AddMediaModal}
        key=${mediaItem?.id} isOpen=${!!mediaItem} item=${mediaItem}
        onClose=${() => setMediaItem(null)}
        onSave=${(media) => {
          setItems((prev) => prev.map((i) => (i.id === mediaItem.id ? { ...i, media } : i)));
          setMediaItem(null);
        }} />

    </div>
  `;
}

/* ─── Block entry ─── */
export function openCreateModal() {
  document.dispatchEvent(new CustomEvent('ac:open-create'));
}

export default async function decorate(block) {
  const config = parseConfig(block);
  block.textContent = '';

  const statsEl = document.createElement('div');
  block.appendChild(statsEl);
  buildStats(statsEl, config);

  const appEl = document.createElement('div');
  block.appendChild(appEl);
  render(html`<${App} title=${config.title} subtitle=${config.subtitle} tabs=${config.tabs} buttons=${config.buttons} />`, appEl);
}
