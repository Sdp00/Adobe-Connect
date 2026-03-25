import { html, render } from '../../vendor/htm-preact.js';

function TrendItem({ item }) {
  return html`
    <li class="trends-block__item">
      <div class="trends-block__thumb">
        <img src="/icons/tech-talk.svg" class="trends-block__thumb-icon" alt="" />
      </div>
      <div class="trends-block__content">
        <h4 class="trends-block__item-title">${item.title}</h4>
        <p class="trends-block__description">${item.description}</p>
      </div>
    </li>`;
}

function IndustryUpdates({ title, items }) {
  return html`
    <div class="trends-block">
      <div class="trends-block__header">
        <img src="/icons/industry-updates.svg" class="trends-block__header-icon" alt="" />
        <h3 class="trends-block__title">${title}</h3>
      </div>
      <ul class="trends-block__list">
        ${items.map(item => html`<${TrendItem} item=${item} />`)}
      </ul>
    </div>`;
}

/* ── Parse from DA.live block ──
   Each row = one item
   Cell contains two <p> tags:
     <p>CSS Anchoring Is Here</p>        ← title
     <p>New spec shipping in browsers</p> ← description
*/
function parseFromBlock(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return null;

  const items = [];
  rows.forEach((row, i) => {
    const cell = row.querySelector(':scope > div');
    if (!cell) return;

    const paras = [...cell.querySelectorAll('p')];
    if (paras.length >= 2) {
      items.push({
        id: i + 1,
        title: paras[0].textContent.trim(),
        description: paras[1].textContent.trim(),
      });
    } else {
      // Fallback: split by newline
      const lines = cell.innerText?.split('\n').map(l => l.trim()).filter(Boolean)
        || cell.textContent.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length >= 2) {
        items.push({ id: i + 1, title: lines[0], description: lines[1] });
      }
    }
  });

  return items.length ? items : null;
}

export default async function decorate(block) {
  const items = parseFromBlock(block);

  if (!items) {
    console.warn('No industry updates data found in block');
    return;
  }

  block.innerHTML = '';
  render(
    html`<${IndustryUpdates} title="Industry Updates" items=${items} />`,
    block
  );
}