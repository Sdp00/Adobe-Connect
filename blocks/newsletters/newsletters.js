import { html, render } from '../../vendor/htm-preact.js';

function NewsletterItem({ item }) {
  return html`
    <li class="newsletters-block__item">
      <div class="newsletters-block__thumb">
        <img src="/icons/newsletters.svg" class="newsletters-block__thumb-icon" alt="" />
      </div>
      <div class="newsletters-block__content">
        <span class="newsletters-block__month">${item.month}</span>
        <h4 class="newsletters-block__item-title">${item.title}</h4>
        <p class="newsletters-block__description">${item.description}</p>
      </div>
    </li>`;
}

function Newsletters({ title, items }) {
  return html`
    <div class="newsletters-block">
      <div class="newsletters-block__header">
        <img src="/icons/newsletters.svg" class="newsletters-block__header-icon" alt="" />
        <h3 class="newsletters-block__title">${title}</h3>
      </div>
      <ul class="newsletters-block__list">
        ${items.map(item => html`<${NewsletterItem} item=${item} />`)}
      </ul>
    </div>`;
}

/* ── Parse from DA.live block ──
   Each row = one item
   Cell contains three <p> tags:
     <p>Adobe Connect Weekly</p>               ← title
     <p>WeeklyCollaboration tools roundup</p>  ← description
     <p>March 2026</p>                         ← month
*/
function parseFromBlock(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return null;

  const items = [];
  rows.forEach((row, i) => {
    const cell = row.querySelector(':scope > div');
    if (!cell) return;

    const paras = [...cell.querySelectorAll('p')];
    if (paras.length >= 3) {
      items.push({
        id: i + 1,
        title:       paras[0].textContent.trim(),
        description: paras[1].textContent.trim(),
        month:       paras[2].textContent.trim(),
      });
    } else {
      // Fallback: split by newline
      const lines = cell.innerText?.split('\n').map(l => l.trim()).filter(Boolean)
        || cell.textContent.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length >= 3) {
        items.push({ id: i + 1, title: lines[0], description: lines[1], month: lines[2] });
      }
    }
  });

  return items.length ? items : null;
}
export default async function decorate(block) {
  const items = parseFromBlock(block);

  if (!items) {
    console.warn('No newsletter data found in block');
    return;
  }

  block.innerHTML = '';
  render(html`<${Newsletters} title="Newsletters" items=${items} />`, block);
}