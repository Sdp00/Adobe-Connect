import { parseItems, renderFeedBlock } from '../../helper/rightpanel-modal.js';
 
export default function decorate(block) {
  if (block.querySelector('.rpf-list')) return;
 
  const items = parseItems(block);
  if (!items.length) return;
 
  block.textContent = '';
 
  let type = 'newsletter';
  if (block.classList.contains('industry-updates')) type = 'industry-updates';
  else if (block.classList.contains('newsletter')) type = 'newsletter';
 
  const isPage = window.location.pathname.includes('/newsletter')
    || window.location.pathname.includes('/industry-updates');
 
  if (isPage) {
    block.classList.add('ins-page');
    renderPageCards(block, items, type);
  } else {
    renderFeedBlock(block, items, type);
  }
}
 
function renderPageCards(block, items, type) {
  const accentColor = '#e8412a';
  const heading = type === 'industry-updates' ? 'Industry Updates' : 'Newsletter';
 
  block.innerHTML = `
    <h2 class="ins-heading">${heading}</h2>
    <ul class="ins-grid">
      ${items.map((item) => `
        <li class="ins-card">
          <p class="ins-card-title">${item.title || ''}</p>
          <p class="ins-desc">${item.meta || ''}</p>
          <a href="${item.href || '#'}" class="ins-read-btn" style="background:${accentColor}">Read</a>
        </li>
      `).join('')}
    </ul>
  `;
}