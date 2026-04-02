import { html } from '../vendor/htm-preact.js';

/**
 * Reusable MediaUpload component
 *
 * Props:
 *   value    - single File (or null) in single mode; File[] in multiple mode
 *   onChange - called with new value (File|null) or (File[])
 *   multiple - boolean, default false
 *   accept   - string, default "image/*,video/*,.pdf"
 */

function renderSinglePreview(value) {
  if (value.type && value.type.startsWith('image/')) {
    return html`<img src=${URL.createObjectURL(value)} alt="preview" />`;
  }
  if (value.type && value.type.startsWith('video/')) {
    return html`<video src=${URL.createObjectURL(value)} controls />`;
  }
  return html`<span class="media-upload-filename">📎 ${value.name}</span>`;
}

function renderFilePreview(file) {
  const url = URL.createObjectURL(file);
  if (file.type.startsWith('image/')) {
    return html`<img src=${url} class="media-upload-preview-img" alt=${file.name} />`;
  }
  if (file.type.startsWith('video/')) {
    return html`<video src=${url} class="media-upload-preview-video" controls />`;
  }
  return html`<div class="media-upload-preview-file">📄 ${file.name}</div>`;
}

export default function MediaUpload({
  value,
  onChange,
  multiple = false,
  accept = 'image/*,video/*,.pdf',
}) {
  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from((e.dataTransfer && e.dataTransfer.files) || []);
    if (!dropped.length) return;
    if (multiple) {
      onChange([...(value || []), ...dropped]);
    } else {
      onChange(dropped[0]);
    }
  };

  const handleFile = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    if (multiple) {
      onChange([...(value || []), ...selected]);
    } else {
      onChange(selected[0]);
    }
    e.target.value = '';
  };

  const handleRemove = (index) => {
    if (multiple) {
      onChange((value || []).filter((_, i) => i !== index));
    } else {
      onChange(null);
    }
  };

  // ── Single-file preview ──────────────────────────────────────────────────
  if (!multiple && value) {
    return html`
      <div class="media-upload">
        <div class="media-upload-preview">
          ${renderSinglePreview(value)}
          <button class="media-upload-remove" type="button" onClick=${() => handleRemove()}>✕</button>
        </div>
      </div>
    `;
  }

  // ── Dropzone ─────────────────────────────────────────────────────────────
  return html`
    <div class="media-upload" onDragOver=${handleDragOver} onDrop=${handleDrop}>
      <label class="media-upload-dropzone">
        <input
          type="file"
          accept=${accept}
          multiple=${multiple}
          onChange=${handleFile}
          style="display:none"
        />
        <span>Click to upload or drag & drop</span>
        <div class="media-upload-types">
          <span>Image</span>
          <span>Video</span>
          <span>PDF</span>
        </div>
      </label>

      ${multiple && value && value.length > 0 && html`
        <div class="media-upload-previews">
          ${value.map((file, i) => html`
            <div class="media-upload-preview-item" key=${i}>
              ${renderFilePreview(file)}
              <button class="media-upload-remove" type="button" onClick=${() => handleRemove(i)}>✕</button>
            </div>
          `)}
        </div>
      `}
    </div>
  `;
}
