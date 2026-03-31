import { parseItems, renderFeedBlock } from '../../helper/rightpanel-modal.js';

export default function decorate(block) {
  if (block.querySelector('.rpf-list')) return;

  const items = parseItems(block);
  if (!items.length) return;

  block.textContent = '';
  renderFeedBlock(block, items, 'industry-updates');
}
