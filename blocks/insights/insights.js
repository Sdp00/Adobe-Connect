import { parseItems, renderFeedBlock } from '../../helper/rightpanel-modal.js';

export default function decorate(block) {
  // prevent re-render
  if (block.querySelector('.rpf-list')) return;

  const items = parseItems(block);
  if (!items.length) return;

  block.textContent = '';

  // detect variant
  let type = 'newsletter'; // default

  if (block.classList.contains('industry-updates')) {
    type = 'industry-updates';
  } else if (block.classList.contains('newsletter')) {
    type = 'newsletter';
  }

  renderFeedBlock(block, items, type);
}