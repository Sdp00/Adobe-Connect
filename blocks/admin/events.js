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
export function isPastEvent(item) {
  if (item.type !== 'event' || !item.date) return false;
  return new Date(item.date + 'T00:00:00') < new Date(new Date().toDateString());
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

/* ── PreviewCard (local — used inside EventItemModal) ─────── */
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
   EVENT CARD
───────────────────────────────────────────── */
export function EventCard({ item, onEdit, onPreview, onInterested, onToggleStatus }) {
  const isLive = item.status === 'live';
  const hasResponses = item.responses && item.responses.interested != null;

  return html`
    <div class="ac-card" data-id=${item.id}>
      <div class="ac-card-badge ac-card-badge--event">EVENT</div>
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
          ? html`
              <span class="ac-chip ac-chip--interested ac-chip-clickable" onClick=${() => onInterested(item)}>
                <${Icon} name="users" width=16 height=16 />
                ${item.responses.interested} interested
              </span>
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
   PAST EVENT CARD
───────────────────────────────────────────── */
export function PastEventCard({ item, onAddMedia }) {
  const hasImage = item.media?.type?.startsWith('image/');

  return html`
    <div class="ac-card ac-card--past">
      ${hasImage && html`
        <div class="ac-past-media-thumb">
          <img src=${URL.createObjectURL(item.media)} alt="event media" />
        </div>
      `}
      <div class="ac-card-badge ac-card-badge--event">EVENT</div>
      <h3 class="ac-card-title">${item.title}</h3>
      <p class="ac-card-desc">${item.description}</p>
      <div class="ac-card-meta">
        <span class="ac-card-date">
          <${Icon} name="calendar" width=16 height=16 />
          ${item.date}
        </span>
        ${item.venue ? html`<span class="ac-card-date"><${Icon} name="location" width=16 height=16 />${item.venue}</span>` : ''}
      </div>
      <div class="ac-card-actions">
        <button class="ac-action-btn ac-action-btn--media" onClick=${() => onAddMedia(item)}>
          ${hasImage ? 'Update Media' : 'Add Media'}
        </button>
      </div>
    </div>
  `;
}

/* ─────────────────────────────────────────────
   ADD MEDIA MODAL
───────────────────────────────────────────── */
export function AddMediaModal({ isOpen, onClose, item, onSave }) {
  const [media, setMedia] = useState(item?.media || null);
  useEffect(() => { setMedia(item?.media || null); }, [item]);

  return html`
    <${Modal}
      isOpen=${isOpen}
      onClose=${onClose}
      modalHeader=${'Add Media — ' + (item?.title || '')}
      actions=${[]}
      onSubmit=${() => { onSave(media); onClose(); }}
      submitLabel="Save"
    >
      <p style="font-size:0.85rem;color:#6b7280;margin:0 0 16px">
        Upload photos or a video from this event. Employees will be able to view them on the public site.
      </p>
      <${MediaUpload} value=${media} onChange=${setMedia} />
    </${Modal}>
  `;
}

/* ─────────────────────────────────────────────
   INTERESTED USERS MODAL  (redesigned)
───────────────────────────────────────────── */

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

function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).map((n) => n[0].toUpperCase()).slice(0, 2).join('');
}

function toAdobeEmail(name) {
  if (!name) return '';
  return name.trim().toLowerCase().replace(/\s+/g, '.') + '@adobe.com';
}

const MOCK_INTERESTED_NAMES = [
  'Rahul Verma', 'Meera Nambiar', 'Siddharth Rao', 'Kavya Reddy',
  'Aditya Bhatt', 'Nisha Pillai', 'Kiran Menon', 'Ravi Shankar',
  'Anita Desai', 'Suresh Kumar', 'Lakshmi Iyer', 'Vijay Nair',
];

function generateInterestedUsers(item) {
  const count = item.responses?.interested ?? 0;
  const existing = item.responses?.interestedUsers || [];
  if (existing.length > 0) {
    return existing.map((u) => ({ ...u, color: getUserColor(u.name) }));
  }
  return MOCK_INTERESTED_NAMES.slice(0, count).map((name) => ({
    name,
    email: toAdobeEmail(name),
    color: getUserColor(name),
  }));
}

function exportInterestedToExcel(item, users) {
  const rows = [
    ['Event', item.title || 'Untitled'],
    ['Date', item.date || 'TBD'],
    [''],
    ['NAME', 'EMAIL'],
    ...users.map((u) => [u.name, u.email]),
  ];
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(item.title || 'event').replace(/\s+/g, '_')}_interested.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function InterestedModal({ isOpen, onClose, item }) {
  if (!item) return null;
  const users = generateInterestedUsers(item);

  return html`
    ${isOpen ? html`
      <div class="ac-resp-backdrop" onClick=${(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div class="ac-resp-modal">

          <!-- Header -->
          <div class="ac-resp-header">
            <div class="ac-resp-header-left">
              <div class="ac-resp-header-icon">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
                  <path d="M13 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                  <path d="M2 17c0-3.314 3.582-6 8-6s8 2.686 8 6"/>
                </svg>
              </div>
              <div>
                <h2 class="ac-resp-title">Interested</h2>
                <p class="ac-resp-subtitle">${item.title}</p>
              </div>
            </div>
            <button class="ac-resp-close" onClick=${onClose} aria-label="Close">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16">
                <path d="M3 3l10 10M13 3L3 13"/>
              </svg>
            </button>
          </div>

          <!-- Summary -->
          <div class="ac-resp-summary">
            <div class="ac-resp-pill ac-resp-pill--interested-ev">
              <span class="ac-resp-pill-dot" style="background:#f59e0b"></span>
              <strong>${users.length}</strong> Interested
            </div>
            <div class="ac-resp-total">${users.length} total</div>
          </div>

          <!-- User List -->
          <div class="ac-resp-list">
            ${users.length === 0 ? html`
              <div class="ac-resp-empty">
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="40" height="40" style="opacity:0.3">
                  <circle cx="24" cy="18" r="9"/>
                  <path d="M6 42c0-9.941 8.059-18 18-18s18 8.059 18 18"/>
                </svg>
                <p>No interested users yet</p>
              </div>
            ` : users.map((u) => html`
              <div class="ac-resp-row">
                <div class="ac-resp-avatar" style=${'background:' + u.color.bg + ';color:' + u.color.color + ';border-color:' + u.color.border}>
                  ${getInitials(u.name)}
                </div>
                <div class="ac-resp-info">
                  <span class="ac-resp-name">${u.name}</span>
                  <a class="ac-resp-email" href=${'mailto:' + u.email}>${u.email}</a>
                </div>
              </div>
            `)}
          </div>

          <!-- Footer -->
          <div class="ac-resp-footer">
            <button class="ac-resp-export-btn" onClick=${() => exportInterestedToExcel(item, users)}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
                <path d="M8 2v8M5 7l3 3 3-3"/>
                <path d="M2 12v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1"/>
              </svg>
              Export as Excel
            </button>
            <button class="ac-resp-close-btn" onClick=${onClose}>Close</button>
          </div>

        </div>
      </div>
    ` : ''}
  `;
}

/* ─────────────────────────────────────────────
   EVENT PREVIEW MODAL  (end-user view)
───────────────────────────────────────────── */
export function EventPreviewModal({ isOpen, onClose, item }) {
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
          <span class="ac-card-badge ac-card-badge--event">EVENT</span>
          <h2 class="ac-preview-eu-title">${item.title || 'Untitled'}</h2>
          <div class="ac-preview-eu-meta">
            ${item.date
              ? metaRow('calendar', `${formatDate(item.date)}${item.time ? ' · ' + formatTime(item.time) : ''}`)
              : html`<div class="ac-preview-eu-meta-row ac-preview-eu-tbd">Date & time TBD</div>`
            }
            ${item.venue ? metaRow('location', item.venue) : ''}
            ${item.responses?.interested ? metaRow('users', `${item.responses.interested} people interested`) : ''}
          </div>
          ${item.description ? html`
            <div class="ac-preview-eu-desc">
              <h4>About this event</h4>
              <p>${item.description}</p>
            </div>
          ` : ''}
          <button class="ac-preview-eu-cta">Mark as Interested</button>
        </div>
        <div class="ac-preview-notice">
          This is exactly how employees will see this event on the public site.
        </div>
      </div>
    </${Modal}>
  `;
}

/* ─────────────────────────────────────────────
   EVENT ITEM MODAL  (add / edit)
───────────────────────────────────────────── */
export function EventItemModal({ isOpen, onClose, editItem, onSaveDraft, onPublish }) {
  const [tab, setTab] = useState('edit');
  const [form, setForm] = useState(editItem
    ? { ...editItem }
    : { type: 'event', title: '', description: '', date: '', time: '', venue: '', media: null });
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
    ${field('TITLE', input('text', 'title', 'Enter title...'), 'title')}
    ${field('DATE', input('date', 'date', ''), 'date')}
    ${field('TIME', input('time', 'time', ''), '')}
    ${field('VENUE', input('text', 'venue', 'Enter venue...'), '')}
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
      modalHeader=${editItem ? 'Edit Event' : 'Add Event'}
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