import { parseItems, renderFeedBlock } from '../../helper/rightpanel-modal.js';

export default function decorate(block) {
  const variant = [...block.classList].find((c) => ['newsletter', 'industry-updates'].includes(c));
  if (!variant) return;

  const items = parseItems(block);
  if (!items.length) return;

  block.textContent = '';
  renderFeedBlock(block, items, variant);
}
