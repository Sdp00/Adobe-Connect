import { html, render } from '../../vendor/htm-preact.js';

function QuickLinks({ links }) {
  return html`
    <div class="quicklinks">
      ${links.map(link => html`
        <a href=${link.href} class="quicklinks-item">
          ${link.label}
        </a>
      `)}
    </div>
  `;
}

export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];

  const links = rows.map(row => {
    const anchor = row.querySelector('a');

    return {
      label: anchor?.textContent.trim(),
      href: anchor?.getAttribute('href')
    };
  }).filter(link => link.href); // avoid empty rows

  block.innerHTML = '';

  render(html`<${QuickLinks} links=${links} />`, block);
}