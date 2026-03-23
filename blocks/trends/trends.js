import { html, render } from '../../vendor/htm-preact.js';

function TrendItem({ item }) {
  return html`
    <li class="trends-block__item">
      <div class="trends-block__thumb">
        <img src="/icons/tech-talk.svg" class="trends-block__thumb-icon" alt="" />
      </div>
      <div class="trends-block__content">
        <span class="trends-block__category">${item.category}</span>
        <h4 class="trends-block__item-title">${item.title}</h4>
        <p class="trends-block__meta">
          ${item.source}
          <span class="trends-block__sep">·</span>
          ${item.time_ago}
        </p>
      </div>
    </li>`;
}

function IndustryUpdates({ data }) {
  return html`
    <div class="trends-block">
      <div class="trends-block__header">
        <img src="/icons/industry-updates.svg" class="trends-block__header-icon" alt="" />
        <h3 class="trends-block__title">${data.title}</h3>
      </div>
      <ul class="trends-block__list">
        ${data.items.map(item => html`<${TrendItem} item=${item} />`)}
      </ul>
    </div>`;
}

export default async function decorate(block) {
const res = await fetch('public/mock.json');
    const json = await res.json();
  const data = json.trends;

  block.innerHTML = '';
  render(html`<${IndustryUpdates} data=${data} />`, block);
}