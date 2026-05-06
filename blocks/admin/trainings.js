import { html } from '../../vendor/htm-preact.js';
import { useState, useEffect } from '../../vendor/preact-hooks.js';
import Modal from '../../helper/modal.js';
import MediaUpload from '../../helper/media-upload.js';

/* ── Icon ─────────────────────────────────────────────────── */
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

function Icon({ name, width = 16, height = 16 }) {
  const [svg, setSvg] = useState('');
  useEffect(() => { fetchIcon(name).then(setSvg); }, [name]);
  return html`<span
    class="ac-icon"
    style=${'width:' + width + 'px;height:' + height + 'px'}
    dangerouslySetInnerHTML=${{ __html: svg }}
  ></span>`;
}

/* ── Helpers ──────────────────────────────────────────────── */
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

function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).map((n) => n[0].toUpperCase()).slice(0, 2).join('');
}

/* ── Avatar color from name hash ─────────────────────────── */
const AVATAR_COLORS = [
  { bg: '#fff4ec', color: '#c2410c', border: '#fddcca' },
  { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  { bg: '#fdf4ff', color: '#7e22ce', border: '#e9d5ff' },
  { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
];

function getUserColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const API_BASE = 'https://293924-adobeconnectmw-dev.adobeio-static.net/api/v1/web/adobe-connect';

/* ── Export to CSV ────────────────────────────────────────── */
function exportToExcel(item, accepted, declined) {
  const rows = [
    ['Training Session', item.title || 'Untitled'],
    ['Date', item.date || 'TBD'],
    [''],
    ['STATUS', 'NAME', 'EMAIL', 'DECLINE REASON'],
    ...accepted.map((u) => ['Accepted', u.name, u.email, '']),
    ...declined.map((u) => ['Declined', u.name, u.email, u.reason || '']),
  ];

  const csvContent = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(item.title || 'training').replace(/\s+/g, '_')}_responses.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─────────────────────────────────────────────
   RESPONSES MODAL  (accepted / declined)
───────────────────────────────────────────── */
export function TrainingResponsesModal({ isOpen, onClose, item }) {
  const [activeTab, setActiveTab] = useState('accepted');
  const [accepted, setAccepted] = useState([]);
  const [declined, setDeclined] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !item) return;
    setLoading(true);
    setAccepted([]);
    setDeclined([]);
    fetch(`${API_BASE}/eventsAndTrainings/${item.id}/responses`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status);
        return res.json();
      })
      .then((data) => {
        const acc = Array.isArray(data.accepted) ? data.accepted : (data.acceptedUsers || []);
        const dec = Array.isArray(data.declined) ? data.declined : (data.declinedUsers || []);
        setAccepted(acc.map((u) => ({ ...u, color: getUserColor(u.name) })));
        setDeclined(dec.map((u) => ({ ...u, color: getUserColor(u.name) })));
      })
      .catch(() => {
        const fallbackAcc = item.responses?.acceptedUsers || [];
        const fallbackDec = item.responses?.declinedUsers || [];
        setAccepted(fallbackAcc.map((u) => ({ ...u, color: getUserColor(u.name) })));
        setDeclined(fallbackDec.map((u) => ({ ...u, color: getUserColor(u.name) })));
      })
      .finally(() => setLoading(false));
  }, [isOpen, item?.id]);

  if (!item) return null;

  const UserRow = ({ user, showReason }) => {
    const col = user.color;
    return html`
      <div class="ac-resp-row">
        <div class="ac-resp-avatar" style=${'background:' + col.bg + ';color:' + col.color + ';border-color:' + col.border}>
          ${getInitials(user.name)}
        </div>
        <div class="ac-resp-info">
          <span class="ac-resp-name">${user.name}</span>
          <a class="ac-resp-email" href=${'mailto:' + user.email}>${user.email}</a>
          ${showReason && user.reason ? html`
            <span class="ac-resp-reason">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><circle cx="8" cy="8" r="6.5"/><path d="M8 5v3.5M8 11h.01"/></svg>
              ${user.reason}
            </span>
          ` : ''}
        </div>
      </div>
    `;
  };

  const hasAny = accepted.length > 0 || declined.length > 0;
  const modalActions = hasAny
    ? [{ label: 'Export as CSV', variant: 'modal-btn--draft', onClick: () => exportToExcel(item, accepted, declined) }]
    : [];

  return html`
    <${Modal}
      isOpen=${isOpen}
      onClose=${onClose}
      modalHeader=${'Responses — ' + item.title}
      actions=${modalActions}
      onSubmit=${onClose}
      submitLabel="Close"
      showCancel=${false}
    >
      <div class="ac-resp-tabs">
        <button
          class=${'ac-resp-tab' + (activeTab === 'accepted' ? ' active' : '')}
          onClick=${() => setActiveTab('accepted')}
        >
          <span class="ac-resp-tab-dot ac-resp-tab-dot--green"></span>
          Accepted
          <span class="ac-resp-tab-count ac-resp-tab-count--accepted">${accepted.length}</span>
        </button>
        <button
          class=${'ac-resp-tab' + (activeTab === 'declined' ? ' active' : '')}
          onClick=${() => setActiveTab('declined')}
        >
          <span class="ac-resp-tab-dot ac-resp-tab-dot--red"></span>
          Declined
          <span class="ac-resp-tab-count ac-resp-tab-count--declined">${declined.length}</span>
        </button>
      </div>

      <div class="ac-resp-list">
        ${loading ? html`
          <div class="ac-resp-empty">
            <span class="ac-spinner"></span>
            <p>Loading...</p>
          </div>
        ` : activeTab === 'accepted' && accepted.length === 0 ? html`
          <div class="ac-resp-empty">
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="40" height="40" style="opacity:0.3">
              <circle cx="24" cy="18" r="9"/>
              <path d="M6 42c0-9.941 8.059-18 18-18s18 8.059 18 18"/>
            </svg>
            <p>No accepted responses yet</p>
          </div>
        ` : activeTab === 'declined' && declined.length === 0 ? html`
          <div class="ac-resp-empty">
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="40" height="40" style="opacity:0.3">
              <circle cx="24" cy="18" r="9"/>
              <path d="M6 42c0-9.941 8.059-18 18-18s18 8.059 18 18"/>
            </svg>
            <p>No declined responses yet</p>
          </div>
        ` : activeTab === 'accepted'
          ? accepted.map((u) => html`<${UserRow} user=${u} showReason=${false} />`)
          : declined.map((u) => html`<${UserRow} user=${u} showReason=${true} />`)
        }
      </div>
    </${Modal}>
  `;
}

/* ── PreviewCard (local — used inside TrainingItemModal) ───── */
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
   TRAINING CARD
───────────────────────────────────────────── */
export function TrainingCard({ item, onEdit, onPreview, onToggleStatus, onViewResponses }) {
  const isLive = item.status === 'live';
  const acceptedCount = item.responses?.accepted ?? 0;
  const declinedCount = item.responses?.declined ?? 0;

  return html`
    <div class="ac-card" data-id=${item.id}>
      <div class="ac-card-badge ac-card-badge--training">TRAINING</div>
      <h3 class="ac-card-title">${item.title}</h3>
      <p class="ac-card-desc">${item.description}</p>
      <div class="ac-card-meta">
        <span class="ac-card-date">
          <${Icon} name="calendar" width=16 height=16 />
          ${item.date}${item.duration ? html` · <strong>${item.duration}</strong>` : ''}
        </span>
      </div>
      <div class="ac-card-responses">
        <span class="ac-chip ac-chip--accepted ac-chip-clickable" onClick=${() => onViewResponses && onViewResponses(item)}>
          <span class="ac-dot ac-dot--green"></span>${acceptedCount} accepted
        </span>
        <span class="ac-chip ac-chip--declined ac-chip-clickable" onClick=${() => onViewResponses && onViewResponses(item)}>
          <span class="ac-dot ac-dot--red"></span>${declinedCount} declined
        </span>
      </div>
      <div class="ac-card-actions">
        <button class="ac-action-btn" onClick=${() => onEdit(item)}>Edit</button>
        <button class="ac-action-btn" onClick=${() => onPreview(item)}>Preview</button>
        <button
          class=${'ac-action-btn ' + (isLive ? 'ac-action-btn--live' : 'ac-action-btn--publish')}
          onClick=${!isLive ? () => onToggleStatus(item) : undefined}
          disabled=${isLive}
        >${isLive ? 'Live' : 'Publish'}</button>
      </div>
    </div>
  `;
}

/* ─────────────────────────────────────────────
   TRAINING PREVIEW MODAL  (end-user view)
───────────────────────────────────────────── */
export function TrainingPreviewModal({ isOpen, onClose, item }) {
  if (!item) return null;
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
          <span class="ac-card-badge ac-card-badge--training">TRAINING</span>
          <h2 class="ac-preview-eu-title">${item.title || 'Untitled'}</h2>
          <div class="ac-preview-eu-meta">
            ${item.date
              ? metaRow('calendar', `${formatDate(item.date)}${item.time ? ' · ' + formatTime(item.time) : ''}`)
              : html`<div class="ac-preview-eu-meta-row ac-preview-eu-tbd">Date & time TBD</div>`
            }
            ${item.venue ? metaRow('location', item.venue) : ''}
            ${item.trainerName ? metaRow('user', html`Trainer: <strong>${item.trainerName}</strong>`) : ''}
            ${item.totalSeats ? metaRow('seats', `${item.totalSeats} seats available`) : ''}
          </div>
          ${item.description ? html`
            <div class="ac-preview-eu-desc">
              <h4>About this session</h4>
              <p>${item.description}</p>
            </div>
          ` : ''}
          <button class="ac-preview-eu-cta">Register for this Training</button>
        </div>
        <div class="ac-preview-notice">
          This is exactly how employees will see this training on the public site.
        </div>
      </div>
    </${Modal}>
  `;
}

/* ─────────────────────────────────────────────
   TRAINING ITEM MODAL  (add / edit)
───────────────────────────────────────────── */
export function TrainingItemModal({ isOpen, onClose, editItem, onSaveDraft, onPublish }) {
  const [tab, setTab] = useState('edit');
  const [form, setForm] = useState(editItem
    ? { ...editItem }
    : { type: 'training', title: '', description: '', date: '', time: '', venue: '', trainerName: '', totalSeats: '', media: null });
  const [errors, setErrors] = useState({});

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.title?.trim()) e.title = 'Title is required';
    if (!form.date) e.date = 'Date is required';
    if (!form.description?.trim()) e.description = 'Description is required';
    if (!form.trainerName?.trim()) e.trainerName = "Trainer's name is required";
    if (!form.totalSeats) e.totalSeats = 'Total seats is required';
    return e;
  };

  const field = (label, inputEl, errorKey) => html`
    <div class="ac-form-group">
      <label class="ac-form-label">${label}</label>
      ${inputEl}
      ${errors[errorKey] ? html`<span style="color:#b91c1c;font-size:0.75rem;margin-top:4px;display:block">${errors[errorKey]}</span>` : ''}
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
    ${field('SESSION TITLE', input('text', 'title', 'Enter title...'), 'title')}
    ${field('DATE', input('date', 'date', ''), 'date')}
    ${field('TIME', input('time', 'time', ''), '')}
    ${field('VENUE', input('text', 'venue', 'Enter venue...'), '')}
    ${field("TRAINER'S NAME", input('text', 'trainerName', "Enter trainer's name..."), 'trainerName')}
    ${field('TOTAL SEATS AVAILABLE', input('number', 'totalSeats', 'e.g. 30', { min: 1 }), 'totalSeats')}
    <div class="ac-form-group">
      <label class="ac-form-label">DESCRIPTION</label>
      <textarea
        class="ac-form-textarea"
        rows="4"
        placeholder="Write a description..."
        onInput=${(e) => set('description', e.target.value)}
      >${form.description}</textarea>
      ${errors.description ? html`<span style="color:#b91c1c;font-size:0.75rem;margin-top:4px;display:block">${errors.description}</span>` : ''}
    </div>
    <div class="ac-form-group">
      <label class="ac-form-label">MEDIA <span class="ac-form-optional">(optional)</span></label>
      <${MediaUpload} value=${form.media} onChange=${(f) => set('media', f)} />
    </div>
  `;

  return html`
    <${Modal}
      isOpen=${isOpen}
      onClose=${onClose}
      modalHeader=${editItem ? 'Edit Training' : 'Add Training'}
      actions=${[{ label: 'Save Draft', variant: 'modal-btn--draft', onClick: () => { onSaveDraft({ ...form, status: 'draft' }); onClose(); } }]}
      onSubmit=${() => { const e = validate(); if (Object.keys(e).length) { setErrors(e); setTab('edit'); return; } onPublish({ ...form, status: 'live' }); onClose(); }}
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