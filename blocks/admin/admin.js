import { html, render } from '../../vendor/htm-preact.js';
import { useState, useEffect } from '../../vendor/preact-hooks.js';
// import { isSignedInUser } from '../../scripts/auth.js';
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
  { icon: 'events',   count: '0', label: 'Events',    filter: 'event' },
  { icon: 'training', count: '0', label: 'Trainings', filter: 'training' },
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
   DATA FETCH & SAVE
───────────────────────────────────────────── */
const API_BASE = 'https://293924-adobeconnectmw-dev.adobeio-static.net/api/v1/web/adobe-connect';

async function fetchData() {
  const res = await fetch(`${API_BASE}/eventsAndTrainings`);
  if (!res.ok) throw new Error(`Failed to load eventsAndTrainings (${res.status})`);
  const json = await res.json();
  const items = Array.isArray(json) ? json : json.eventsAndTrainings;
  return items.map((item) => ({ ...item, id: item.id ?? item._id })).reverse();
}

function buildPayload(data) {
  // eslint-disable-next-line no-unused-vars
  const { media, ...rest } = data;
  return rest;
}

function getAuthHeaders() {
  const tokenObj = window.adobeIMS?.getAccessToken();
  const accessToken = tokenObj?.token;
  if (!accessToken) return {};
  return {
    Authorization: `Bearer ${accessToken}`,
    'x-gw-ims-org-id': '8B2628265E74EE890A495EDA@AdobeOrg',
  };
}

async function postItem(data) {
  const res = await fetch(`${API_BASE}/eventsAndTrainings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(buildPayload(data)),
  });
  if (!res.ok) throw new Error(`Failed to create item (${res.status})`);
  try { return await res.json(); } catch { return {}; }
}

async function putItem(id, data) {
  const res = await fetch(`${API_BASE}/eventsAndTrainings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(buildPayload(data)),
  });
  if (!res.ok) throw new Error(`Failed to update item (${res.status})`);
  try { return await res.json(); } catch { return {}; }
}

const TABS = [
  { key: 'all',      label: 'All' },
  { key: 'event',    label: 'Events' },
  { key: 'training', label: 'Trainings' },
];

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

  useEffect(() => {
    const handler = ({ detail: id }) => {
      setTimeout(() => {
        const card = document.querySelector(`[data-id="${id}"]`);
        if (!card) return;
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('ac-card-highlight');
        setTimeout(() => card.classList.remove('ac-card-highlight'), 1800);
      }, 350);
    };
    document.addEventListener('ac:highlight-item', handler);
    return () => document.removeEventListener('ac:highlight-item', handler);
  }, []);

  const upcomingItems = items.filter((i) => !isPastEvent(i));
  const pastEvents = items.filter(isPastEvent);

  useEffect(() => {
    if (loading) return;
    const eventCount = upcomingItems.filter((i) => i.type === 'event').length;
    const trainingCount = upcomingItems.filter((i) => i.type === 'training').length;
    const countEls = document.querySelectorAll('.admin-stats-count');
    if (countEls[0]) countEls[0].textContent = String(eventCount);
    if (countEls[1]) countEls[1].textContent = String(trainingCount);
  }, [items, loading]);

  const filtered = filter === 'all' ? upcomingItems : upcomingItems.filter((i) => i.type === filter);

  const saveItem = async (form, status) => {
    const updated = { ...form, status };
    if (editItem) {
      const editId = editItem.id;
      setItems((prev) => {
        const existing = prev.find((i) => i.id === editId) || {};
        return [{ ...existing, ...updated }, ...prev.filter((i) => i.id !== editId)];
      });
      try {
        await putItem(editId, updated);
      } catch (err) {
        console.error('Failed to update item:', err);
      }
    } else {
      const tempId = Date.now();
      setItems((prev) => [{ ...updated, id: tempId, responses: null }, ...prev]);
      try {
        const saved = await postItem(updated);
        const realId = saved?.id ?? saved?._id;
        if (realId) {
          setItems((prev) => prev.map((i) => (i.id === tempId ? { ...i, id: realId } : i)));
        }
      } catch (err) {
        console.error('Failed to create item:', err);
        setItems((prev) => prev.filter((i) => i.id !== tempId));
      }
    }
  };

  const handleSaveMedia = (media) => {
    setItems((prev) => prev.map((i) => (i.id === mediaItem.id ? { ...i, media } : i)));
  };

  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 'live' ? 'draft' : 'live';
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i)));
    try {
      await putItem(item.id, { ...item, status: newStatus });
    } catch (err) {
      console.error('Failed to toggle status:', err);
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: item.status } : i)));
    }
  };

  const openAdd = (type) => { setModalType(type); setEditItem(null); setModalOpen(true); };
  const openEdit = (item) => { setModalType(item.type); setEditItem(item); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditItem(null); };

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
  // const signedIn = await isSignedInUser();
  // if (!signedIn) {
  //   window?.adobeIMS?.signIn();
  //   return;
  // }

  block.textContent = '';

  const statsContainer = document.createElement('div');
  block.appendChild(statsContainer);
  renderStats(statsContainer);

  const appRoot = document.createElement('div');
  block.appendChild(appRoot);
  render(html`<${EventsTrainingsApp} />`, appRoot);
}