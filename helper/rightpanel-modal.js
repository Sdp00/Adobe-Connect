/**
 * Reusable right-panel feed list.
 * Used by: blocks/insights (newsletter + industry-updates variants)
 *
 * HTML output matches insights.css class names:
 *   h3 · rpf-list · rpf-item · rpf-icon · rpf-content · rpf-tag · rpf-title · rpf-meta
 */

const VARIANT_CONFIG = {
  newsletter: {
    title: 'Newsletters',
    href: '/newsletter',
    iconSvg: '<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><rect width=\'20\' height=\'16\' x=\'2\' y=\'4\' rx=\'2\'/><path d=\'m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7\'/></svg>',
  },
  'industry-updates': {
    title: 'Industry Updates',
    href: '/industry-updates',
    iconSvg: '<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><polyline points=\'22 7 13.5 15.5 8.5 10.5 2 17\'/><polyline points=\'16 7 22 7 22 13\'/></svg>',
  },
};

export function parseItems(block) {
  return [...block.querySelectorAll(':scope > div')].map((row) => {
    const cells = [...row.querySelectorAll(':scope > div')];
    const linkEl = cells.find((c) => c.querySelector('a'))?.querySelector('a');
    const textCells = cells.filter((c) => !c.querySelector('a'));
    // 3+ text cols → tag | title | meta
    // 2 text cols  → title | meta  (no tag)
    // 1 text col   → title only
    const hasTag = textCells.length >= 3;
    return {
      tag: hasTag ? textCells[0]?.textContent.trim() : '',
      title: hasTag ? textCells[1]?.textContent.trim() : textCells[0]?.textContent.trim() || '',
      meta: hasTag ? textCells[2]?.textContent.trim() : textCells[1]?.textContent.trim() || '',
      href: linkEl?.getAttribute('href') || '#',
    };
  }).filter((i) => i.title);
}

export function renderFeedBlock(container, items, variant) {
  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.newsletter;

  const listItems = items.map((item) => `
    <li class="rpf-item">
      <div class="rpf-icon">${config.iconSvg}</div>
      <div class="rpf-content">
        ${item.tag && item.tag !== item.title ? `<div class="rpf-tag">${item.tag}</div>` : ''}
        <a class="rpf-title" href="${config.href}">${item.title}</a>
        ${item.meta ? `<div class="rpf-meta">${item.meta}</div>` : ''}
      </div>
    </li>
  `).join('');

  container.innerHTML = `
    <h3>${config.title}</h3>
    <ul class="rpf-list">${listItems}</ul>
  `;
}
