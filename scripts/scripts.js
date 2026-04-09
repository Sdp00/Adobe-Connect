import {
  buildBlock,
  decorateBlock,
  loadBlock,
  loadHeader,
  // loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  loadScript,
} from './aem.js';
import getConfig from './config.js';

async function loadSidebar() {
  const block = buildBlock('sidebar', '');
  document.body.prepend(block);
  decorateBlock(block);
  return loadBlock(block);
}

/* ─────────────────────────────────────────────
   SCROLL SPY  (admin pages only)
   Watches sections on the page and highlights
   the matching sidebar link as you scroll.

   Sections are identified by the hash in the
   sidebar link href:
     /admin           → top of page (Dashboard)
     /admin#events-training → #events-training
     /admin#participation   → #participation
───────────────────────────────────────────── */
function initScrollSpy() {
  // Only run on admin pages
  if (!window.location.pathname.startsWith('/admin')) return;

  // Wait for sidebar to appear in the DOM, then wire up
  const waitForSidebar = setInterval(() => {
    const links = document.querySelectorAll('a.ac-sidebar-link');
    if (!links.length) return;
    clearInterval(waitForSidebar);

    // Build a map of { sectionEl → linkEl }
    // For /admin (no hash) we treat the very top as "Dashboard"
    const sectionMap = [];

    links.forEach((link) => {
      const url = new URL(link.href, window.location.origin);
      if (url.pathname !== window.location.pathname) return;

      if (url.hash) {
        const target = document.querySelector(url.hash);
        if (target) sectionMap.push({ section: target, link });
      } else {
        // Dashboard — sentinel element at top of main
        const sentinel = document.querySelector('main') || document.body;
        sectionMap.push({ section: sentinel, link });
      }
    });

    if (!sectionMap.length) return;

    function setActive(activeLink) {
      links.forEach((l) => {
        l.classList.remove('is-active');
        l.setAttribute('aria-current', 'false');
      });
      activeLink.classList.add('is-active');
      activeLink.setAttribute('aria-current', 'page');
    }

    function onScroll() {
      const { scrollY } = window;
      const offset = 120; // px from top before switching — tweak as needed

      // Walk sections from bottom to top; first one whose top ≤ scrollY+offset wins
      let active = sectionMap[0];
      for (let i = sectionMap.length - 1; i >= 0; i -= 1) {
        const top = sectionMap[i].section.getBoundingClientRect().top + scrollY;
        if (scrollY + offset >= top) {
          active = sectionMap[i];
          break;
        }
      }
      setActive(active.link);
    }

    // Kick off immediately + on scroll
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }, 100);
}

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    if (h1.closest('.hero') || picture.closest('.hero')) {
      return;
    }
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }

    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) {
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads Adobe IMS library and initializes the IMS object.
 * @returns {Promise<void>} - Resolves when IMS is ready or rejects on timeout/error.
 */
export async function loadIms() {
  const { ims } = getConfig();
  window.imsLoaded = window.imsLoaded || new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('IMS timeout')), 5000);
    window.adobeid = {
      scope: 'AdobeID,additional_info.company,additional_info.ownerOrg,avatar,openid,read_organizations,read_pc,session,account_cluster.read',
      locale: 'en',
      ...ims,
      onReady: () => {
        // eslint-disable-next-line no-console
        console.log('Adobe IMS Ready!');
        resolve(); // resolve the promise, consumers can now use window.adobeIMS
        clearTimeout(timeout);
      },
      onError: reject,
    };
    loadScript('https://auth.services.adobe.com/imslib/imslib.min.js');
  });
  return window.imsLoaded;
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));
  loadIms();
  // ── SIDEBAR ────────────────────────────────────────────────
  loadSidebar();
  // ──────────────────────────────────────────────────────────

  // ── SCROLL SPY ────────────────────────────────────────────
  initScrollSpy();
  // ──────────────────────────────────────────────────────────

  // ── MOBILE CALENDAR ICON (all pages except admin) ─────────
  if (!window.location.pathname.startsWith('/admin')) {
    import('../blocks/calendar/calendar.js').then(({ injectMobileCalendarIcon }) => {
      injectMobileCalendarIcon();
    });
  }
  // ──────────────────────────────────────────────────────────

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  // loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  if (!window.location.pathname.startsWith('/admin')) {
    loadCSS(`${window.hlx.codeBasePath}/styles/rightpanel.css`);
  }
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
