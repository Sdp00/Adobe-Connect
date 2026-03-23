import { html, render } from '../../vendor/htm-preact.js';

function NewsletterItem({ item }) {
  return html`
    <li class="newsletters-block__item">
      <div class="newsletters-block__thumb">
        <img src="/icons/newsletters.svg" class="newsletters-block__thumb-icon" alt="" />
      </div>
      <div class="newsletters-block__content">
        <span class="newsletters-block__category">${item.category}</span>
        <h4 class="newsletters-block__item-title">${item.title}</h4>
        <p class="newsletters-block__meta">
          ${item.source}
          <span class="newsletters-block__sep">·</span>
          ${item.time_ago}
          <span class="newsletters-block__sep">·</span>
          <span class="newsletters-block__read-time">${item.read_time}</span>
        </p>
      </div>
    </li>`;
}

function Newsletters({ data }) {
  return html`
    <div class="newsletters-block">
      <div class="newsletters-block__header">
        <img src="/icons/newsletters.svg" class="newsletters-block__header-icon" alt="" />
        <h3 class="newsletters-block__title">${data.title}</h3>
      </div>
      <ul class="newsletters-block__list">
        ${data.items.map(item => html`<${NewsletterItem} item=${item} />`)}
      </ul>
    </div>`;
}

export default async function decorate(block) {
  const resp = await fetch('public/mock.json');
  const json = await resp.json();
  const data = json.newsletters;

  block.innerHTML = '';
  render(html`<${Newsletters} data=${data} />`, block);
}