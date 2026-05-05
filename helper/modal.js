import { html } from '../vendor/htm-preact.js';
import { useEffect } from '../vendor/preact-hooks.js';

export default function Modal({
  isOpen,
  onClose,
  modalHeader,
  onSubmit,
  submitLabel = 'Submit', //  default
  cancelLabel = 'Cancel', //  default
  showCancel = true,
  actions = [], //  NEW
  isSubmitting = false,
  children,
}) {
  // ESC to close
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKey);

    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return html`
    <div class="modal-backdrop" onClick=${onClose}>
      
      <div class="modal" onClick=${(e) => e.stopPropagation()}>

        <!-- Header -->
        <div class="modal-header">
          <span>${modalHeader}</span>
          <button class="modal-close" onClick=${onClose}>✕</button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          ${children}
        </div>

        ${(onSubmit || actions.length > 0) && html`
            <div class="modal-footer">

                <!-- Cancel -->
                ${showCancel && onClose && html`
                <button class="modal-cancel" onClick=${onClose}>
                    ${cancelLabel}
                </button>
                `}

                <!-- Custom Actions (Preview, etc) -->
                ${actions.map((action) => html`
                <button
                    class=${`modal-btn ${action.variant || ''}`}
                    onClick=${action.onClick}
                >
                    ${action.label}
                </button>
                `)}

                <!-- Submit -->
                ${onSubmit && html`
                <button class="modal-submit" onClick=${onSubmit}>
                    ${isSubmitting ? 'Posting...' : submitLabel}
                </button>
                `}

            </div>
            `}

      </div>

    </div>
  `;
}
