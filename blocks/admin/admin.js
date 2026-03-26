import { html, render } from '../../vendor/htm-preact.js';
import { useState, useEffect } from '../../vendor/preact-hooks.js';
import Modal from '../../helper/modal.js';
import MediaUpload from '../../helper/media-upload.js';

/* ─────────────────────────────────────────────
   STATS
───────────────────────────────────────────── */
const STATS = [
  { icon: 'events',   count: '4', label: 'Events',    section: 'events-training' },
  { icon: 'training', count: '6', label: 'Trainings', section: 'events-training' },
];

/* ── Icon fetcher (with cache) ────────────────────────────────── */
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

/* ── Icon component ───────────────────────────────────────────── */
function Icon({ name, width = 16, height = 16 }) {
  const [svg, setSvg] = useState('');
  useEffect(() => { fetchIcon(name).then(setSvg); }, [name]);
  return html`<span
    class="ac-icon"
    style=${'width:' + width + 'px;height:' + height + 'px'}
    dangerouslySetInnerHTML=${{ __html: svg }}
  ></span>`;
}

/* ── Stats DOM render ─────────────────────────────────────────── */
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
        const target = document.getElementById(stat.section);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
          history.replaceState(null, '', `/admin#${stat.section}`);
        }
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
   HELPERS
───────────────────────────────────────────── */
function emptyForm(type) {
  const base = { type, title: '', description: '', date: '', time: '', venue: '', media: null };
  return type === 'training'
    ? { ...base, trainerName: '', totalSeats: '' }
    : base;
}

function formatDate(d) {
  if (!d) return 'Date TBD';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatTime(t) {
  if (!t) return null;
  const [h, m] = t.split(':');
  const dt = new Date();
  dt.setHours(+h, +m);
  return dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/* ─────────────────────────────────────────────
   PREVIEW CARD  (inside edit modal)
───────────────────────────────────────────── */
function PreviewCard({ form }) {
  const hasImage = form.media?.type?.startsWith('image/');
  return html`
    <div class="ac-preview-card">
      <div class="ac-preview-media">
        ${hasImage
          ? html`<img src=${URL.createObjectURL(form.media)} alt="media" />`
          : html`<div class="ac-preview-media-placeholder"><${Icon} name="clock" width=24 height=24 /></div>`
        }
      </div>
      <div class="ac-preview-body">
        <h3 class="ac-preview-title">${form.title || 'Untitled'}</h3>
        <p class="ac-preview-date">
          ${form.date || 'Date TBD'}${form.duration ? ' · ' + form.duration : ''}
        </p>
        <p class="ac-preview-desc">${form.description || 'No description added yet.'}</p>
      </div>
    </div>
    <div class="ac-preview-notice">
      💡 This is exactly how employees will see it on the public site.
    </div>
  `;
}

/* ─────────────────────────────────────────────
   ADD / EDIT MODAL
───────────────────────────────────────────── */
function ItemModal({ isOpen, onClose, itemType, editItem, onSaveDraft, onPublish }) {
  const isTraining = itemType === 'training';
  const [tab, setTab] = useState('edit');
  const [form, setForm] = useState(editItem ? { ...editItem } : emptyForm(itemType));

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const field = (label, inputEl) => html`
    <div class="ac-form-group">
      <label class="ac-form-label">${label}</label>
      ${inputEl}
    </div>
  `;

  const input = (type, key, placeholder, extra = {}) => html`
    <input
      class="ac-form-input${type === 'date' ? ' ac-form-input--date' : ''}"
      type=${type}
      placeholder=${placeholder}
      value=${form[key] || ''}
      onInput=${(e) => set(key, e.target.value)}
      ...${extra}
    />
  `;

  const editForm = html`
    ${field(isTraining ? 'SESSION TITLE' : 'TITLE', input('text', 'title', 'Enter title...'))}
    ${field('DATE', input('date', 'date', ''))}
    ${field('TIME', input('time', 'time', ''))}
    ${field('VENUE', input('text', 'venue', 'Enter venue...'))}
    ${isTraining ? html`
      ${field("TRAINER'S NAME", input('text', 'trainerName', "Enter trainer's name..."))}
      ${field('TOTAL SEATS AVAILABLE', input('number', 'totalSeats', 'e.g. 30', { min: 1 }))}
    ` : ''}
    <div class="ac-form-group">
      <label class="ac-form-label">DESCRIPTION</label>
      <textarea
        class="ac-form-textarea"
        rows="4"
        placeholder="Write a description..."
        onInput=${(e) => set('description', e.target.value)}
      >${form.description}</textarea>
    </div>
    <div class="ac-form-group">
      <label class="ac-form-label">MEDIA <span class="ac-form-optional">(optional)</span></label>
      <${MediaUpload} value=${form.media} onChange=${(f) => set('media', f)} />
    </div>
  `;

  const header = `${editItem ? 'Edit' : 'Add'} ${isTraining ? 'Training' : 'Event'}`;

  return html`
    <${Modal}
      isOpen=${isOpen}
      onClose=${onClose}
      modalHeader=${header}
      actions=${[{ label: 'Save Draft', variant: 'modal-btn--draft', onClick: () => { onSaveDraft({ ...form, status: 'draft' }); onClose(); } }]}
      onSubmit=${() => { onPublish({ ...form, status: 'live' }); onClose(); }}
      submitLabel="Publish"
    >
      <div class="ac-modal-tabs">
        <button class=${'ac-modal-tab' + (tab === 'edit' ? ' active' : '')} onClick=${() => setTab('edit')}>Edit</button>
        <button class=${'ac-modal-tab' + (tab === 'preview' ? ' active' : '')} onClick=${() => setTab('preview')}>Preview</button>
      </div>
      ${tab === 'edit' ? editForm : html`<${PreviewCard} form=${form} />`}
    </${Modal}>
  `;
}

/* ─────────────────────────────────────────────
   PREVIEW MODAL  (end-user view)
───────────────────────────────────────────── */
function PreviewModal({ isOpen, onClose, item }) {
  if (!item) return null;
  const isEvent = item.type === 'event';
  const hasImage = item.media?.type?.startsWith('image/');

  const metaRow = (iconName, content) => html`
    <div class="ac-preview-eu-meta-row">
      <${Icon} name=${iconName} width=16 height=16 />
      <span>${content}</span>
    </div>
  `;

  return html`
    <${Modal}
      isOpen=${isOpen}
      onClose=${onClose}
      modalHeader="Preview — how employees will see this"
      actions=${[]}
      onSubmit=${onClose}
      submitLabel="Close"
    >
      <div class="ac-preview-enduser">
        <div class="ac-preview-eu-banner">
          ${hasImage
            ? html`<img src=${URL.createObjectURL(item.media)} alt="cover" class="ac-preview-eu-img" />`
            : html`<div class="ac-preview-eu-img-placeholder"><${Icon} name="image-placeholder" width=64 height=64 /></div>`
          }
        </div>

        <div class="ac-preview-eu-body">
          <span class="ac-card-badge ac-card-badge--${item.type}">${item.type.toUpperCase()}</span>
          <h2 class="ac-preview-eu-title">${item.title || 'Untitled'}</h2>

          <div class="ac-preview-eu-meta">
            ${item.date
              ? metaRow('calendar', `${formatDate(item.date)}${item.time ? ' · ' + formatTime(item.time) : ''}`)
              : html`<div class="ac-preview-eu-meta-row ac-preview-eu-tbd">Date & time TBD</div>`
            }
            ${item.venue ? metaRow('location', item.venue) : ''}
            ${isEvent && item.responses?.interested ? metaRow('users', `${item.responses.interested} people interested`) : ''}
            ${!isEvent && item.trainerName ? metaRow('user', html`Trainer: <strong>${item.trainerName}</strong>`) : ''}
            ${!isEvent && item.totalSeats ? metaRow('seats', `${item.totalSeats} seats available`) : ''}
          </div>

          ${item.description ? html`
            <div class="ac-preview-eu-desc">
              <h4>About this ${isEvent ? 'event' : 'session'}</h4>
              <p>${item.description}</p>
            </div>
          ` : ''}

          <button class="ac-preview-eu-cta">
            ${isEvent ? 'Mark as Interested' : 'Register for this Training'}
          </button>
        </div>

        <div class="ac-preview-notice">
          This is exactly how employees will see this ${isEvent ? 'event' : 'training'} on the public site.
        </div>
      </div>
    </${Modal}>
  `;
}

/* ─────────────────────────────────────────────
   INTERESTED USERS MODAL
───────────────────────────────────────────── */
function InterestedModal({ isOpen, onClose, item }) {
  if (!item) return null;
  const users = item.responses?.interestedUsers || [];
  const getInitials = (name) => name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return html`
    <${Modal}
      isOpen=${isOpen}
      onClose=${onClose}
      modalHeader=${'Interested — ' + item.title}
      actions=${[]}
      onSubmit=${onClose}
      submitLabel="Close"
    >
      <div class="ac-interested-meta">
        <span class="ac-interested-count">${users.length} ${users.length === 1 ? 'person' : 'people'} interested</span>
      </div>
      <div class="ac-interested-list">
        ${users.map((u) => html`
          <div class="ac-interested-row">
            <div class="ac-interested-avatar">${getInitials(u.name)}</div>
            <div class="ac-interested-info">
              <span class="ac-interested-name">${u.name}</span>
              <a class="ac-interested-email" href=${'mailto:' + u.email}>${u.email}</a>
            </div>
          </div>
        `)}
      </div>
    </${Modal}>
  `;
}

/* ─────────────────────────────────────────────
   CARD
───────────────────────────────────────────── */
function Card({ item, onEdit, onPreview, onInterested, onToggleStatus }) {
  const isEvent = item.type === 'event';
  const isLive = item.status === 'live';
  const hasResponses = item.responses &&
    (item.responses.interested != null || item.responses.accepted != null);

  return html`
    <div class="ac-card">
      <div class="ac-card-badge ac-card-badge--${item.type}">${item.type.toUpperCase()}</div>

      <h3 class="ac-card-title">${item.title}</h3>
      <p class="ac-card-desc">${item.description}</p>

      <div class="ac-card-meta">
        <span class="ac-card-date">
          <${Icon} name="calendar" width=16 height=16 />
          ${item.date}${item.duration ? html` · <strong>${item.duration}</strong>` : ''}
        </span>
      </div>

      <div class="ac-card-responses">
        ${hasResponses
          ? isEvent ? html`
              <span class="ac-chip ac-chip--interested ac-chip-clickable" onClick=${() => onInterested(item)}>
                <${Icon} name="users" width=16 height=16 />
                ${item.responses.interested} interested
              </span>
            ` : html`
              <span class="ac-chip ac-chip--accepted"><span class="ac-dot ac-dot--green"></span>${item.responses.accepted} accepted</span>
              <span class="ac-chip ac-chip--declined"><span class="ac-dot ac-dot--red"></span>${item.responses.declined} declined</span>
              <a class="ac-view-link" href="#">View →</a>
            `
          : html`
              <span class="ac-upcoming">
                <${Icon} name="info" width=16 height=16 />
                Upcoming — no responses yet
              </span>
            `
        }
      </div>

      <div class="ac-card-actions">
        <button class="ac-action-btn" onClick=${() => onEdit(item)}>Edit</button>
        <button class="ac-action-btn" onClick=${() => onPreview(item)}>Preview</button>
        <button
          class=${'ac-action-btn ' + (isLive ? 'ac-action-btn--live' : 'ac-action-btn--publish')}
          onClick=${() => onToggleStatus(item)}
        >${isLive ? 'Live' : 'Publish'}</button>
      </div>
    </div>
  `;
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

  useEffect(() => {
    fetchData()
      .then((data) => { setItems(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  const filtered = filter === 'all' ? items : items.filter((i) => i.type === filter);

  const saveItem = (form, status) => {
    const updated = { ...form, status };
    setItems((prev) =>
      editItem
        ? prev.map((i) => (i.id === editItem.id ? { ...i, ...updated } : i))
        : [...prev, { ...updated, id: Date.now(), responses: null }],
    );
  };

  const openAdd = (type) => { setModalType(type); setEditItem(null); setModalOpen(true); };
  const openEdit = (item) => { setModalType(item.type); setEditItem(item); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditItem(null); };

  const handleToggleStatus = (item) => {
    setItems((prev) =>
      prev.map((i) => i.id === item.id ? { ...i, status: i.status === 'live' ? 'draft' : 'live' } : i),
    );
  };

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
        ${filtered.map((item) => html`
          <${Card}
            key=${item.id}
            item=${item}
            onEdit=${openEdit}
            onPreview=${(i) => setPreviewItem(i)}
            onInterested=${(i) => setInterestedItem(i)}
            onToggleStatus=${handleToggleStatus}
          />
        `)}
      </div>

      <${ItemModal}
        key=${editItem ? editItem.id : 'new-' + modalType}
        isOpen=${modalOpen}
        onClose=${closeModal}
        itemType=${modalType}
        editItem=${editItem}
        onSaveDraft=${(form) => saveItem(form, 'draft')}
        onPublish=${(form) => saveItem(form, 'live')}
      />

      <${PreviewModal}
        isOpen=${!!previewItem}
        onClose=${() => setPreviewItem(null)}
        item=${previewItem}
      />

      <${InterestedModal}
        isOpen=${!!interestedItem}
        onClose=${() => setInterestedItem(null)}
        item=${interestedItem}
      />
    </div>
  `;
}

export function openCreateModal() {
  document.dispatchEvent(new CustomEvent('ac:open-create'));
}

export default async function decorate(block) {
  block.textContent = '';

  const statsContainer = document.createElement('div');
  block.appendChild(statsContainer);
  renderStats(statsContainer);

  const eventsRoot = document.createElement('div');
  block.appendChild(eventsRoot);
  render(html`<${EventsTrainingsApp} />`, eventsRoot);
}
