/**
 * Local Spectrum Web Component implementations.
 * API-compatible with @spectrum-web-components 0.42.x.
 * No CDN dependencies — works offline.
 *
 * Components defined here:
 *   sp-theme, sp-divider, sp-badge,
 *   sp-action-button, sp-button, sp-search
 */

/* ============================================================
   sp-theme  — no-op wrapper; tokens come from spectrum-tokens.css
   ============================================================ */
if (!customElements.get('sp-theme')) {
  customElements.define('sp-theme', class extends HTMLElement {
    connectedCallback() { this.style.display = 'contents'; }
  });
}

/* ============================================================
   sp-divider
   ============================================================ */
if (!customElements.get('sp-divider')) {
  customElements.define('sp-divider', class extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      const s = this.attachShadow({ mode: 'open' });
      s.innerHTML = `
        <style>
          :host {
            display: block;
            height: 1px;
            background: var(--spectrum-gray-200, #e0e0e0);
            border: none;
            margin: 0;
          }
        </style>`;
    }
  });
}

/* ============================================================
   sp-badge  — variant: positive | informative | negative | notice | neutral
   ============================================================ */
if (!customElements.get('sp-badge')) {
  const BADGE_STYLES = {
    positive: 'background:#dcfce7;color:#15803d',
    informative: 'background:#dbeafe;color:#1d4ed8',
    negative: 'background:#fee2e2;color:#b91c1c',
    notice: 'background:#fef9c3;color:#a16207',
    neutral: 'background:#f3f4f6;color:#374151',
  };

  customElements.define('sp-badge', class extends HTMLElement {
    static get observedAttributes() { return ['variant']; }

    connectedCallback() {
      if (!this.shadowRoot) {
        this.attachShadow({ mode: 'open' });
      }
      this._render();
    }

    attributeChangedCallback() { this._render(); }

    _render() {
      if (!this.shadowRoot) return;
      const variant = this.getAttribute('variant') || 'neutral';
      const style = BADGE_STYLES[variant] || BADGE_STYLES.neutral;
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: inline-flex;
            align-items: center;
            padding: 2px 10px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
            font-family: var(--spectrum-font-family-base, system-ui, sans-serif);
            white-space: nowrap;
            ${style};
          }
        </style>
        <slot></slot>`;
    }
  });
}

/* ============================================================
   sp-action-button  — quiet | emphasized | selected
   ============================================================ */
if (!customElements.get('sp-action-button')) {
  customElements.define('sp-action-button', class extends HTMLElement {
    static get observedAttributes() { return ['selected', 'quiet', 'emphasized', 'disabled']; }

    connectedCallback() {
      if (!this.shadowRoot) {
        this.attachShadow({ mode: 'open' });
      }
      this._render();
    }

    attributeChangedCallback() { this._render(); }

    _render() {
      if (!this.shadowRoot) return;
      const selected = this.hasAttribute('selected');
      const quiet = this.hasAttribute('quiet');
      const emphasized = this.hasAttribute('emphasized');
      const disabled = this.hasAttribute('disabled');
      const accent = 'var(--spectrum-accent-background-color-default, #0265dc)';

      let bg = 'transparent';
      let color = 'var(--spectrum-gray-800, #2c2c2c)';
      let border = '1.5px solid var(--spectrum-gray-200, #e0e0e0)';

      if (quiet) {
        border = 'none';
        if (selected) {
          bg = 'rgba(2,101,220,0.12)';
          color = accent;
        }
      } else if (emphasized) {
        bg = 'var(--spectrum-white, #fff)';
        if (selected) {
          bg = accent;
          color = 'var(--spectrum-white, #fff)';
          border = `1.5px solid ${accent}`;
        }
      }

      this.shadowRoot.innerHTML = `
        <style>
          :host { display: inline-flex; }
          button {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 7px 14px;
            border: ${border};
            border-radius: 9999px;
            background: ${bg};
            color: ${color};
            font-family: var(--spectrum-font-family-base, system-ui, sans-serif);
            font-size: 13px;
            font-weight: 500;
            cursor: ${disabled ? 'not-allowed' : 'pointer'};
            opacity: ${disabled ? 0.4 : 1};
            white-space: nowrap;
            width: 100%;
            text-align: left;
            transition: background 0.15s, color 0.15s;
            box-sizing: border-box;
          }
          :host([quiet]) button {
            border-radius: 8px;
            padding: 9px 12px;
          }
          button:hover:not(:disabled) {
            background: ${selected ? bg : 'var(--spectrum-gray-100, #f0f0f0)'};
          }
          ::slotted([slot="icon"]) {
            flex-shrink: 0;
            width: 18px;
            height: 18px;
          }
        </style>
        <button ${disabled ? 'disabled' : ''} part="button">
          <slot name="icon"></slot>
          <slot></slot>
        </button>`;
      this._btn = this.shadowRoot.querySelector('button');
    }
  });
}

/* ============================================================
   sp-button  — variant: accent | primary | secondary | negative
   ============================================================ */
if (!customElements.get('sp-button')) {
  customElements.define('sp-button', class extends HTMLElement {
    static get observedAttributes() { return ['variant', 'disabled']; }

    connectedCallback() {
      if (!this.shadowRoot) {
        this.attachShadow({ mode: 'open' });
      }
      this._render();
    }

    attributeChangedCallback() { this._render(); }

    _render() {
      if (!this.shadowRoot) return;
      const variant = this.getAttribute('variant') || 'primary';
      const disabled = this.hasAttribute('disabled');
      const accent = 'var(--spectrum-accent-background-color-default, #0265dc)';

      const styles = {
        accent: `background:${accent};color:#fff;border:none;`,
        primary: 'background:var(--spectrum-gray-800,#2c2c2c);color:#fff;border:none;',
        secondary: 'background:transparent;color:var(--spectrum-gray-800,#2c2c2c);border:1.5px solid var(--spectrum-gray-300,#cdcdcd);',
        negative: 'background:#d7373f;color:#fff;border:none;',
      };

      this.shadowRoot.innerHTML = `
        <style>
          :host { display: inline-flex; }
          button {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 9px 20px;
            border-radius: 9999px;
            ${styles[variant] || styles.primary}
            font-family: var(--spectrum-font-family-base, system-ui, sans-serif);
            font-size: 14px;
            font-weight: 600;
            cursor: ${disabled ? 'not-allowed' : 'pointer'};
            opacity: ${disabled ? 0.5 : 1};
            transition: opacity 0.15s, filter 0.15s;
            white-space: nowrap;
            box-sizing: border-box;
          }
          button:hover:not(:disabled) { filter: brightness(0.92); }
          ::slotted([slot="icon"]) { flex-shrink:0; width:18px; height:18px; }
        </style>
        <button ${disabled ? 'disabled' : ''} part="button">
          <slot name="icon"></slot>
          <slot></slot>
        </button>`;
    }
  });
}

/* ============================================================
   sp-search  — fires input + change events; has built-in clear
   ============================================================ */
if (!customElements.get('sp-search')) {
  customElements.define('sp-search', class extends HTMLElement {
    static get observedAttributes() { return ['value', 'placeholder', 'label']; }

    connectedCallback() {
      if (!this.shadowRoot) {
        this.attachShadow({ mode: 'open' });
        this._build();
      }
    }

    attributeChangedCallback(name, _, val) {
      if (!this.shadowRoot) return;
      const input = this.shadowRoot.querySelector('input');
      if (!input) return;
      if (name === 'value') input.value = val || '';
      if (name === 'placeholder') input.placeholder = val || '';
    }

    _build() {
      const placeholder = this.getAttribute('placeholder') || 'Search…';
      const label = this.getAttribute('label') || 'Search';
      const value = this.getAttribute('value') || '';

      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; }
          .wrap {
            display: flex;
            align-items: center;
            gap: 8px;
            background: var(--spectrum-gray-50, #fafafa);
            border: 1.5px solid var(--spectrum-gray-200, #e0e0e0);
            border-radius: 8px;
            padding: 0 12px;
            transition: border-color 0.15s;
          }
          .wrap:focus-within { border-color: var(--spectrum-accent-background-color-default, #0265dc); }
          .icon { color: var(--spectrum-gray-500, #8e8e8e); flex-shrink:0; }
          input {
            flex: 1;
            border: none;
            background: transparent;
            padding: 10px 0;
            font-family: var(--spectrum-font-family-base, system-ui, sans-serif);
            font-size: 14px;
            color: var(--spectrum-gray-900, #1a1a1a);
            outline: none;
            min-width: 0;
          }
          input::placeholder { color: var(--spectrum-gray-500, #8e8e8e); }
          .clear {
            display: none;
            background: none;
            border: none;
            cursor: pointer;
            color: var(--spectrum-gray-500, #8e8e8e);
            padding: 0;
            flex-shrink: 0;
          }
          .clear.visible { display: flex; }
          .clear:hover { color: var(--spectrum-gray-900, #1a1a1a); }
        </style>
        <div class="wrap">
          <svg class="icon" width="18" height="18" viewBox="0 0 36 36" fill="currentColor" aria-hidden="true">
            <path d="M35.52 33.38l-8.34-8.35A14.5 14.5 0 1 0 25.04 27l8.34 8.35a1.5 1.5 0 0 0 2.14-2.1ZM4 16.5a12.5 12.5 0 1 1 12.5 12.5A12.51 12.51 0 0 1 4 16.5Z"/>
          </svg>
          <input type="search" aria-label="${label}" placeholder="${placeholder}" value="${value}">
          <button class="clear" aria-label="Clear search" title="Clear">
            <svg width="14" height="14" viewBox="0 0 36 36" fill="currentColor">
              <path d="M20.12 18l8.08-8.08a1.5 1.5 0 0 0-2.12-2.12L18 15.88 9.92 7.8a1.5 1.5 0 1 0-2.12 2.12L15.88 18l-8.08 8.08a1.5 1.5 0 0 0 2.12 2.12L18 20.12l8.08 8.08a1.5 1.5 0 0 0 2.12-2.12Z"/>
            </svg>
          </button>
        </div>`;

      const input = this.shadowRoot.querySelector('input');
      const clear = this.shadowRoot.querySelector('.clear');

      const sync = () => {
        clear.classList.toggle('visible', input.value.length > 0);
      };

      input.addEventListener('input', (e) => {
        sync();
        this.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: e.data }));
      });
      input.addEventListener('change', () => {
        this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      });
      clear.addEventListener('click', () => {
        input.value = '';
        sync();
        this.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
        input.focus();
      });

      /* Expose value property so Preact can read e.target.value */
      Object.defineProperty(this, 'value', {
        get: () => input.value,
        set: (v) => { input.value = v || ''; sync(); },
      });

      sync();
    }
  });
}
