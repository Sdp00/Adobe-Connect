/**
 * tech-talk.js — Adobe Connect EDS block
 *
 * DA.live authoring — create a "tech-talk" block table:
 *
 *   | tech-talk                                                                    |
 *   |-----------------------------------------------------------------------------|
 *   | Adobe Tech Talks                                                            |
 *   |-----------------------------------------------------------------------------|
 *   | Deep-dive sessions from Adobe engineers, designers, and product experts...  |
 *   |-----------------------------------------------------------------------------|
 *   | Upcoming Tech Talks (hyperlinked to upcoming URL)                           |
 *   |-----------------------------------------------------------------------------|
 *   | Past Tech Talks (hyperlinked to past URL)                                   |
 *   |-----------------------------------------------------------------------------|
 *
 * Row 0 → Title
 * Row 1 → Subtitle
 * Row 2 → Upcoming button: add hyperlink directly on the label text in DA.live
 * Row 3 → Past button:     add hyperlink directly on the label text in DA.live
 */

export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];

  /** Text content of column col in a row (strips the anchor text too) */
  function cellText(row, col = 0) {
    const cells = [...row.querySelectorAll(':scope > div')];
    return cells[col]?.textContent?.trim() || '';
  }

  /**
   * For button rows: the author hyperlinks the label text directly in DA.live.
   * So the <a> tag is inside column 0 — grab its href and its text separately.
   */
  function cellBtn(row) {
    const cells = [...row.querySelectorAll(':scope > div')];
    const cell = cells[0];
    if (!cell) return { label: '', href: '' };

    const anchor = cell.querySelector('a');
    if (anchor) {
      return {
        label: anchor.textContent?.trim() || '',
        href: anchor.href || '',
      };
    }

    // Fallback: if no anchor, check col 1 for a separate URL cell
    const href = cells[1]?.querySelector('a')?.href
      || cells[1]?.textContent?.trim()
      || '';
    return { label: cell.textContent?.trim() || '', href };
  }

  const titleText    = cellText(rows[0], 0);
  const subtitleText = cellText(rows[1], 0);

  const { label: upcomingLabel, href: upcomingHref } = cellBtn(rows[2]);
  const { label: pastLabel,     href: pastHref     } = cellBtn(rows[3]);

  /* ── Build DOM ─────────────────────────────────────────── */
  block.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'tt-wrapper';

  /* Title */
  const title = document.createElement('h1');
  title.className = 'tt-title';
  title.textContent = titleText || 'Adobe Tech Talks';

  /* Subtitle */
  const subtitle = document.createElement('p');
  subtitle.className = 'tt-subtitle';
  subtitle.textContent = subtitleText
    || 'Deep-dive sessions from Adobe engineers, designers, and product experts — live and on demand.';

  /* Button group */
  const btnGroup = document.createElement('div');
  btnGroup.className = 'tt-btn-group';

  /* Helper — plain text button, no SVG icons */
  function makeBtn(label, href) {
    const a = document.createElement('a');
    a.className = 'tt-btn';
    a.textContent = label;
    if (href) {
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    return a;
  }

  btnGroup.append(
    makeBtn(upcomingLabel || 'Upcoming Tech Talks', upcomingHref),
    makeBtn(pastLabel     || 'Past Tech Talks',     pastHref),
  );

  wrapper.append(title, subtitle, btnGroup);
  block.append(wrapper);
}