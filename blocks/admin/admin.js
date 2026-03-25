import { html, render } from '../../vendor/htm-preact.js';
import { useState } from '../../vendor/preact-hooks.js';
import Modal from '../../helper/modal.js';

/* ─────────────────────────────────────────────
    STATS SECTION (unchanged)
───────────────────────────────────────────── */
const STATS = [
  { icon: 'events',   count: '4', label: 'Events',    section: 'events-training' },
  { icon: 'training', count: '6', label: 'Trainings', section: 'events-training' },
];

/* ── Data Integration ───────────────────────────────────────────────
   Replace the mock return below with a real API/DB call.
   Must resolve to { events, trainings, newsletters } counts.
   ─────────────────────────────────────────────────────────── */
async function fetchStats() {
  // TODO: replace with real API call, e.g.:
  // const res = await fetch('/api/admin/stats');
  // return res.json();
  return {
    events: 4,
    trainings: 6,
    newsletters: 3,
  };
}

/* ── Icon fetcher ─────────────────────────────────────────── */
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
   MOCK DATA
───────────────────────────────────────────── */
const MOCK_DATA = [
  {
    id: 1,
    type: 'event',
    title: 'UX Research in the Age of AI',
    description: 'Explore how AI tools are reshaping user research workflows — best practices for AI-assisted synthesis and maintaining research integrity at scale.',
    date: '2026-03-15',
    time: '10:00',
    venue: 'Adobe HQ – Room A1',
    status: 'live',
    responses: { interested: 14 },
  },
  {
    id: 2,
    type: 'event',
    title: 'AI in Product Design: Practical Applications for 2026',
    description: 'Discover how leading product teams are integrating AI — from AI-assisted wireframing to automated accessibility audits and smart component suggestions.',
    date: '2026-03-22',
    time: '14:00',
    venue: 'Virtual – Zoom',
    status: 'live',
    responses: { interested: 21 },
  },
  {
    id: 3,
    type: 'event',
    title: 'Adobe Connect Community Mixer – Q1 2026',
    description: 'Connect with fellow community members over virtual coffee. A great way to meet people across teams and build lasting professional relationships.',
    date: '2026-04-05',
    time: '17:00',
    venue: 'Virtual – Teams',
    status: 'draft',
    responses: null,
  },
  {
    id: 4,
    type: 'event',
    title: 'Connect BuildFest 2026 – 48-Hour Design Hackathon',
    description: 'Form a team of 2–4 and build something using Adobe Connect APIs. Prizes for Best UX, Most Innovative Use Case, and Community Favourite.',
    date: '',
    time: '',
    venue: 'TBD',
    status: 'draft',
    responses: null,
  },
  {
    id: 5,
    type: 'training',
    title: 'Figma Deep Dive – Variables & Auto Layout',
    description: 'Structured session for intermediate-to-advanced Figma users. Covers Variables, auto-layout, high-fidelity prototyping, and Dev Mode handoff best practices.',
    date: '2026-03-18',
    time: '09:00',
    venue: 'Adobe HQ – Training Lab B',
    trainerName: 'Ananya Krishnan',
    totalSeats: 20,
    status: 'live',
    responses: { accepted: 7, declined: 3 },
  },
  {
    id: 6,
    type: 'training',
    title: 'Plain Language & Global Content Writing',
    description: 'Practical training on plain language principles, cultural sensitivity in copy, writing for accessibility, and creating content that resonates globally.',
    date: '2026-03-10',
    time: '11:00',
    venue: 'Virtual – Zoom',
    trainerName: 'Riya Mehta',
    totalSeats: 25,
    status: 'live',
    responses: { accepted: 6, declined: 4 },
  },
  {
    id: 7,
    type: 'training',
    title: 'API Security Fundamentals',
    description: 'Deep dive into API authentication, authorization patterns, OAuth 2.0, JWT handling, and practical security auditing techniques for backend developers.',
    date: '2026-02-28',
    time: '10:30',
    venue: 'Adobe HQ – Room C3',
    trainerName: 'Karthik Suresh',
    totalSeats: 30,
    status: 'live',
    responses: { accepted: 5, declined: 5 },
  },
  {
    id: 8,
    type: 'training',
    title: 'Accessibility & Inclusive Design',
    description: 'Covers WCAG 2.2, ARIA best practices, color contrast, keyboard navigation, screen-reader testing, and building accessible component libraries.',
    date: '2026-02-20',
    time: '13:00',
    venue: 'Virtual – Teams',
    trainerName: 'Priya Nair',
    totalSeats: 35,
    status: 'live',
    responses: { accepted: 8, declined: 2 },
  },
  {
    id: 9,
    type: 'training',
    title: 'React Performance Optimisation',
    description: 'Profiling, memoization, lazy loading, concurrent rendering, and avoiding common React anti-patterns that slow down large applications.',
    date: '2026-04-02',
    time: '15:00',
    venue: 'Adobe HQ – Training Lab A',
    trainerName: 'Vikram Desai',
    totalSeats: 20,
    status: 'draft',
    responses: { accepted: 5, declined: 3 },
  },
  {
    id: 10,
    type: 'training',
    title: 'Data Visualisation with D3.js',
    description: 'Building interactive charts and data-driven documents using the D3.js library. Covers scales, axes, transitions, and real-world dashboard patterns.',
    date: '',
    time: '',
    venue: 'TBD',
    trainerName: 'Sneha Iyer',
    totalSeats: 25,
    status: 'draft',
    responses: null,
  },
];

/* ─────────────────────────────────────────────
   EMPTY FORM FACTORIES
───────────────────────────────────────────── */
function emptyEvent() {
  return { type: 'event', title: '', description: '', date: '', time: '', venue: '', media: null };
}

function emptyTraining() {
  return { type: 'training', title: '', date: '', time: '', venue: '', trainerName: '', totalSeats: '', description: '', media: null };
}

/* ─────────────────────────────────────────────
   MEDIA UPLOAD FIELD
───────────────────────────────────────────── */
function MediaUpload({ value, onChange }) {
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) onChange(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) onChange(file);
  };

  const handleRemove = () => onChange(null);

  if (value) {
    return html`
      <div class="ac-media-upload">
        <div class="ac-media-preview">
          ${value.type && value.type.startsWith('image/') ? html`
            <img src=${URL.createObjectURL(value)} alt="preview" />
          ` : html`
            <span class="ac-media-filename">📎 ${value.name}</span>
          `}
          <button class="ac-media-remove" onClick=${handleRemove}>✕</button>
        </div>
      </div>
    `;
  }

  return html`
    <div class="ac-media-upload" onDragOver=${handleDragOver} onDrop=${handleDrop}>
      <label class="ac-media-dropzone">
        <input
          type="file"
          accept="image/*,video/*,.pdf"
          onChange=${handleFile}
          style="display:none"
        />
        <span>Click to upload or drag & drop</span>
        <div class="ac-media-types">
          <span>Image</span>
          <span>Video</span>
          <span>PDF</span>
        </div>
      </label>
    </div>
  `;
}

/* ─────────────────────────────────────────────
   PREVIEW CARD (read-only)
───────────────────────────────────────────── */
function PreviewCard({ form }) {
  const hasImage = form.media && form.media.type && form.media.type.startsWith('image/');

  return html`
    <div class="ac-preview-card">
      <div class="ac-preview-media">
        ${hasImage ? html`
          <img src=${URL.createObjectURL(form.media)} alt="media" />
        ` : html`
          <div class="ac-preview-media-placeholder">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4l3 3"/>
            </svg>
          </div>
        `}
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
   ADD/EDIT MODAL using helper's Modal wrapper
───────────────────────────────────────────── */
function ItemModal({ isOpen, onClose, itemType, editItem, onSaveDraft, onPublish }) {
  const isEdit = !!editItem;
  const isTraining = itemType === 'training';

  const [tab, setTab] = useState('edit');
  const [form, setForm] = useState(
    editItem ? { ...editItem } : isTraining ? emptyTraining() : emptyEvent(),
  );

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const header = isEdit
    ? ('Edit ' + (isTraining ? 'Training' : 'Event'))
    : ('Add ' + (isTraining ? 'Training' : 'Event'));

  const handleSaveDraft = () => {
    onSaveDraft({ ...form, status: 'draft' });
    onClose();
  };

  const handlePublish = () => {
    onPublish({ ...form, status: 'live' });
    onClose();
  };

  const footerActions = [
    {
      label: 'Save Draft',
      variant: 'modal-btn--draft',
      onClick: handleSaveDraft,
    },
  ];

  const editForm = html`
    <div class="ac-form-group">
      <label class="ac-form-label">${isTraining ? 'SESSION TITLE' : 'TITLE'}</label>
      <input
        class="ac-form-input"
        type="text"
        placeholder="Enter title..."
        value=${form.title}
        onInput=${(e) => set('title', e.target.value)}
      />
    </div>

    ${!isTraining ? html`
      <div class="ac-form-group">
        <label class="ac-form-label">DESCRIPTION</label>
        <textarea
          class="ac-form-textarea"
          rows="4"
          placeholder="Write a description..."
          onInput=${(e) => set('description', e.target.value)}
        >${form.description}</textarea>
      </div>
    ` : ''}

    <div class="ac-form-group">
      <label class="ac-form-label">DATE</label>
      <input
        class="ac-form-input ac-form-input--date"
        type="date"
        value=${form.date}
        onInput=${(e) => set('date', e.target.value)}
      />
    </div>

    ${!isTraining ? html`
      <div class="ac-form-group">
        <label class="ac-form-label">TIME</label>
        <input
          class="ac-form-input"
          type="time"
          value=${form.time || ''}
          onInput=${(e) => set('time', e.target.value)}
        />
      </div>
      <div class="ac-form-group">
        <label class="ac-form-label">VENUE</label>
        <input
          class="ac-form-input"
          type="text"
          placeholder="Enter venue..."
          value=${form.venue || ''}
          onInput=${(e) => set('venue', e.target.value)}
        />
      </div>
    ` : ''}

    ${isTraining ? html`
      <div class="ac-form-group">
        <label class="ac-form-label">TIME</label>
        <input
          class="ac-form-input"
          type="time"
          value=${form.time || ''}
          onInput=${(e) => set('time', e.target.value)}
        />
      </div>
      <div class="ac-form-group">
        <label class="ac-form-label">VENUE</label>
        <input
          class="ac-form-input"
          type="text"
          placeholder="Enter venue..."
          value=${form.venue || ''}
          onInput=${(e) => set('venue', e.target.value)}
        />
      </div>
      <div class="ac-form-group">
        <label class="ac-form-label">TRAINER'S NAME</label>
        <input
          class="ac-form-input"
          type="text"
          placeholder="Enter trainer's name..."
          value=${form.trainerName || ''}
          onInput=${(e) => set('trainerName', e.target.value)}
        />
      </div>
      <div class="ac-form-group">
        <label class="ac-form-label">TOTAL SEATS AVAILABLE</label>
        <input
          class="ac-form-input"
          type="number"
          placeholder="e.g. 30"
          min="1"
          value=${form.totalSeats || ''}
          onInput=${(e) => set('totalSeats', e.target.value)}
        />
      </div>
    ` : ''}

    ${isTraining ? html`
      <div class="ac-form-group">
        <label class="ac-form-label">DESCRIPTION</label>
        <textarea
          class="ac-form-textarea"
          rows="4"
          placeholder="Write a description..."
          onInput=${(e) => set('description', e.target.value)}
        >${form.description}</textarea>
      </div>
    ` : ''}

    <div class="ac-form-group">
      <label class="ac-form-label">
        MEDIA <span class="ac-form-optional">(optional)</span>
      </label>
      <${MediaUpload} value=${form.media} onChange=${(f) => set('media', f)} />
    </div>
  `;

  const bodyContent = html`
    <div class="ac-modal-tabs">
      <button
        class=${'ac-modal-tab' + (tab === 'edit' ? ' active' : '')}
        onClick=${() => setTab('edit')}
      >Edit</button>
      <button
        class=${'ac-modal-tab' + (tab === 'preview' ? ' active' : '')}
        onClick=${() => setTab('preview')}
      >Preview</button>
    </div>
    ${tab === 'edit' ? editForm : html`<${PreviewCard} form=${form} />`}
  `;

  return html`
    <${Modal}
      isOpen=${isOpen}
      onClose=${onClose}
      modalHeader=${header}
      actions=${footerActions}
      onSubmit=${handlePublish}
      submitLabel="Publish"
    >
      ${bodyContent}
    </${Modal}>
  `;
}

/* ─────────────────────────────────────────────
   CARD
───────────────────────────────────────────── */
function Card({ item, onEdit, onToggleStatus }) {
  const isEvent = item.type === 'event';
  const isLive = item.status === 'live';
  const hasResponses =
    item.responses &&
    (item.responses.interested != null || item.responses.accepted != null);

  return html`
    <div class="ac-card">
      <div class="ac-card-badge ac-card-badge--${item.type}">
        ${item.type.toUpperCase()}
      </div>

      <h3 class="ac-card-title">${item.title}</h3>
      <p class="ac-card-desc">${item.description}</p>

      <div class="ac-card-meta">
        <span class="ac-card-date">
          <svg viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          ${item.date}${item.duration ? html` · <strong>${item.duration}</strong>` : ''}
        </span>
      </div>

      ${hasResponses ? html`
        <div class="ac-card-responses">
          ${isEvent ? html`
            <span class="ac-chip ac-chip--interested">
              <svg viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                <path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
              ${item.responses.interested} interested
            </span>
          ` : html`
            <span class="ac-chip ac-chip--accepted">
              <span class="ac-dot ac-dot--green"></span>
              ${item.responses.accepted} accepted
            </span>
            <span class="ac-chip ac-chip--declined">
              <span class="ac-dot ac-dot--red"></span>
              ${item.responses.declined} declined
            </span>
            <a class="ac-view-link" href="#">View →</a>
          `}
        </div>
      ` : html`
        <div class="ac-card-responses">
          <span class="ac-upcoming">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Upcoming — no responses yet
          </span>
        </div>
      `}

      <div class="ac-card-actions">
        <button class="ac-action-btn" onClick=${() => onEdit(item)}>Edit</button>
        <button class="ac-action-btn">Preview</button>
        ${isLive ? html`
          <button class="ac-action-btn ac-action-btn--live" onClick=${() => onToggleStatus(item)}>Live</button>
        ` : html`
          <button class="ac-action-btn ac-action-btn--publish" onClick=${() => onToggleStatus(item)}>Publish</button>
        `}
      </div>
    </div>
  `;
}

/* ─────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────── */
function EventsTrainingsApp() {
  const [items, setItems] = useState(MOCK_DATA);
  const [filter, setFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('event');
  const [editItem, setEditItem] = useState(null);

  const filtered = filter === 'all' ? items : items.filter((i) => i.type === filter);

  const openAdd = (type) => {
    setModalType(type);
    setEditItem(null);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setModalType(item.type);
    setEditItem(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditItem(null);
  };

  const handleSaveDraft = (form) => {
    if (editItem) {
      setItems((prev) => prev.map((i) => (i.id === editItem.id ? { ...i, ...form } : i)));
    } else {
      setItems((prev) => [...prev, { ...form, id: Date.now(), responses: null }]);
    }
  };

  const handlePublish = (form) => {
    if (editItem) {
      setItems((prev) => prev.map((i) => (i.id === editItem.id ? { ...i, ...form, status: 'live' } : i)));
    } else {
      setItems((prev) => [...prev, { ...form, id: Date.now(), responses: null, status: 'live' }]);
    }
  };

  const handleToggleStatus = (item) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, status: i.status === 'live' ? 'draft' : 'live' } : i,
      ),
    );
  };

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
        ${['all', 'event', 'training'].map((t) => html`
          <button
            class=${'ac-tab' + (filter === t ? ' active' : '')}
            onClick=${() => setFilter(t)}
          >
            ${t === 'all' ? 'All' : t === 'event' ? 'Events' : 'Trainings'}
          </button>
        `)}
      </div>

      <div class="ac-grid">
        ${filtered.map((item) => html`
          <${Card}
            key=${item.id}
            item=${item}
            onEdit=${openEdit}
            onToggleStatus=${handleToggleStatus}
          />
        `)}
      </div>

      <${ItemModal}
        isOpen=${modalOpen}
        onClose=${closeModal}
        itemType=${modalType}
        editItem=${editItem}
        onSaveDraft=${handleSaveDraft}
        onPublish=${handlePublish}
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