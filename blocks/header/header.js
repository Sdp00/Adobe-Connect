import { getMetadata } from '../../scripts/aem.js';
import { syncAndGetEmployee, updateEmployee } from '../../scripts/auth.js';
import getConfig from '../../scripts/config.js';
import { loadFragment } from '../fragment/fragment.js';

const iconCache = {};
async function fetchIcon(name) {
  if (iconCache[name]) return iconCache[name];
  try {
    const res = await fetch(`/icons/${name}.svg`);
    if (!res.ok) return '';
    const svg = (await res.text())
      .replace(/<\?xml[^>]*\?>/g, '')
      .trim()
      .replace(/^<svg\b/, '<svg class="nav-icon"');
    iconCache[name] = svg;
    return svg;
  } catch {
    return '';
  }
}
 
/* ─────────────────────────────────────────────
   HAMBURGER SVGs
───────────────────────────────────────────── */
const HAMBURGER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
const CLOSE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const LOGO_LIGHT = '/blocks/header/logo-light.png';
const LOGO_DARK = '/blocks/header/logo-dark.png';
 
/* ─────────────────────────────────────────────
   SEARCH
───────────────────────────────────────────── */
let searchDebounceTimer = null;

async function searchEmployees() {
  return [];
}

/* ── Admin search (events & trainings) ── */
const AC_API = 'https://293924-adobeconnectmw-dev.adobeio-static.net/api/v1/web/adobe-connect';
let acItemsCache = null;

async function fetchAdminItems() {
  if (acItemsCache) return acItemsCache;
  const res = await fetch(`${AC_API}/eventsAndTrainings`);
  if (!res.ok) return [];
  const json = await res.json();
  const items = Array.isArray(json) ? json : (json.eventsAndTrainings || []);
  acItemsCache = items.map((item) => ({ ...item, id: item.id ?? item._id }));
  return acItemsCache;
}

function renderAdminDropdown(dropdown, results, query) {
  dropdown.innerHTML = '';
  if (results.length === 0) {
    dropdown.innerHTML = `<div class="nav-search-no-results">No results for "<strong>${query}</strong>"</div>`;
    dropdown.classList.add('is-open');
    return;
  }
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  results.forEach((item) => {
    const el = document.createElement('div');
    el.className = 'nav-search-item';
    const isEvent = item.type === 'event';
    el.innerHTML = `
      <span class="nav-search-badge nav-search-badge--${item.type}">${isEvent ? 'EVENT' : 'TRAINING'}</span>
      <div class="nav-search-info">
        <span class="nav-search-name">${(item.title || '').replace(regex, '<mark>$1</mark>')}</span>
        <span class="nav-search-role">${item.date || 'Date TBD'}${item.venue ? ' · ' + item.venue : ''}</span>
      </div>
    `;
    el.addEventListener('mousedown', (e) => {
      e.preventDefault();
      closeDropdown(dropdown);
      document.dispatchEvent(new CustomEvent('ac:filter-change', { detail: item.type }));
      document.dispatchEvent(new CustomEvent('ac:highlight-item', { detail: item.id }));
      const section = document.getElementById('events-training');
      if (section) section.scrollIntoView({ behavior: 'smooth' });
    });
    dropdown.appendChild(el);
  });
  dropdown.classList.add('is-open');
}

function attachAdminSearch(inputEl) {
  const dropdown = document.createElement('div');
  dropdown.className = 'nav-search-dropdown';
  inputEl.parentElement.style.position = 'relative';
  inputEl.parentElement.appendChild(dropdown);
  let debounce = null;

  inputEl.addEventListener('input', () => {
    const query = inputEl.value.trim();
    clearTimeout(debounce);
    if (query.length < 2) { closeDropdown(dropdown); return; }
    debounce = setTimeout(async () => {
      const items = await fetchAdminItems();
      const q = query.toLowerCase();
      const results = items.filter((i) =>
        (i.title || '').toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q),
      );
      renderAdminDropdown(dropdown, results, query);
    }, 200);
  });

  inputEl.addEventListener('blur', () => { setTimeout(() => closeDropdown(dropdown), 200); });
  inputEl.addEventListener('focus', () => {
    if (inputEl.value.trim().length >= 2 && dropdown.innerHTML) dropdown.classList.add('is-open');
  });
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeDropdown(dropdown); inputEl.blur(); }
  });
}
 
function closeDropdown(dropdown) {
  if (!dropdown) return;
  dropdown.classList.remove('is-open');
  dropdown.innerHTML = '';
}
 
function renderDropdown(dropdown, results, query) {
  dropdown.innerHTML = '';
 
  if (results.length === 0) {
    dropdown.innerHTML = `<div class="nav-search-no-results">No results for "<strong>${query}</strong>"</div>`;
    dropdown.classList.add('is-open');
    return;
  }
 
  results.forEach((person) => {
    const item = document.createElement('div');
    item.className = 'nav-search-item';
 
    const avatar = document.createElement('div');
    avatar.className = 'nav-search-avatar';
    avatar.textContent = (person.name || '?').slice(0, 2).toUpperCase();
 
    const info = document.createElement('div');
    info.className = 'nav-search-info';
 
    const nameEl = document.createElement('span');
    nameEl.className = 'nav-search-name';
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    nameEl.innerHTML = (person.name || '').replace(regex, '<mark>$1</mark>');
 
    const roleEl = document.createElement('span');
    roleEl.className = 'nav-search-role';
    roleEl.textContent = person.role || 'Employee';
 
    info.append(nameEl, roleEl);
    item.append(avatar, info);
 
    item.addEventListener('mousedown', (e) => {
      e.preventDefault();
      window.location.href = `/hierarchy?e_id=${person.e_id}`;
    });
 
    dropdown.appendChild(item);
  });
 
  dropdown.classList.add('is-open');
}
 
function attachSearch(inputEl) {
  // Create dropdown scoped to this input's parent
  const dropdown = document.createElement('div');
  dropdown.className = 'nav-search-dropdown';
  inputEl.parentElement.style.position = 'relative';
  inputEl.parentElement.appendChild(dropdown);
 
  inputEl.addEventListener('input', () => {
    const query = inputEl.value.trim();
    clearTimeout(searchDebounceTimer);
 
    if (query.length < 2) {
      closeDropdown(dropdown);
      return;
    }
 
    searchDebounceTimer = setTimeout(async () => {
      const results = await searchEmployees(query);
      renderDropdown(dropdown, results, query);
    }, 300);
  });
 
  inputEl.addEventListener('blur', () => {
    setTimeout(() => closeDropdown(dropdown), 200);
  });
 
  inputEl.addEventListener('focus', () => {
    if (inputEl.value.trim().length >= 2 && dropdown.innerHTML) {
      dropdown.classList.add('is-open');
    }
  });
 
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDropdown(dropdown);
      inputEl.blur();
    }
  });
}

async function updateHeaderUser(nav) {
  try {
    const isSignedIn = window?.adobeIMS?.isSignedInUser?.();

    if (!isSignedIn) {
      // reset UI
      const avatarEl = nav.querySelector('.avatar');
      const nameEl = nav.querySelector('.profile-name');
      const roleEl = nav.querySelector('.profile-role');

      if (avatarEl) avatarEl.textContent = 'NA';
      if (nameEl) nameEl.textContent = 'Guest';
      if (roleEl) roleEl.textContent = '';

      return;
    }

    const { adobeIoEndpoint } = getConfig();
    const baseUrl = adobeIoEndpoint || '';

    const user = await syncAndGetEmployee(baseUrl);
    window.currentUser = user;
    window.dispatchEvent(new Event('user:updated'));

    if (!user) return;

    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();

    const avatarEl = nav.querySelector('.avatar');
    const nameEl = nav.querySelector('.profile-name');
    const roleEl = nav.querySelector('.profile-role');

    if (nameEl) nameEl.textContent = fullName || 'User';
    if (roleEl) roleEl.textContent = user.email || '';

    if (avatarEl) {
      avatarEl.textContent = fullName
        ? fullName
            .split(' ')
            .map(n => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
        : 'NA';
    }

  } catch (e) {
    console.error('Header user update failed:', e);
  }
}
 
/* ─────────────────────────────────────────────
   MAIN DECORATE
───────────────────────────────────────────── */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);
 
  const content = fragment.querySelector(':scope > div > div');
  if (!content) return;
 
  const items = [...content.querySelectorAll('p')];
  const title = items[0]?.textContent?.trim() || '';
  const searchText = items[1]?.textContent?.trim() || '';
 
  block.textContent = '';
 
  const profileSaved = localStorage.getItem('profileComplete') === 'true';
  const addInfoLabel = profileSaved ? 'Edit Info' : 'Add Info';
  const isAdminPage = window.location.pathname.startsWith('/admin');
 
  const nav = document.createElement('nav');
  nav.className = 'nav-inner';
 
  nav.innerHTML = `
    <div class="nav-left">
      <button class="hamburger-btn icon-btn" aria-label="Toggle navigation" aria-expanded="false" aria-controls="ac-sidebar"></button>
      <a href="${isAdminPage ? '/admin' : '/'}"><img class="nav-logo-img" alt='Adobe-logo'/></a>
    </div>
 
 
    <div class="nav-center">
      <div class="nav-search">
        <svg class="nav-icon" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7"></circle>
          <line x1="16.65" y1="16.65" x2="21" y2="21"></line>
        </svg>
        <input type="search" placeholder="${isAdminPage ? 'Search...' : searchText}" />
      </div>
    </div>
 
 
    <div class="nav-right">
 
      <!-- Mobile Search Button -->
      <button class="icon-btn mobile-search-btn" aria-label="Search">
        <svg class="nav-icon" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7"></circle>
          <line x1="16.65" y1="16.65" x2="21" y2="21"></line>
        </svg>
      </button>
 
 
      <!-- Theme toggle -->
      <button class="icon-btn theme-toggle-btn" aria-label="Toggle theme"></button>
 
      <!-- Notifications -->
      <div class="notify">
        <button class="icon-btn notify-trigger" aria-label="Notifications">
          <span class="notify-dot"></span>
        </button>
      </div>
 
      <div class="profile">
        <div class="profile-trigger" aria-label="Profile menu">
          <div class="avatar">J</div>
          <svg class="chevron" viewBox="0 0 24 24">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
 
 
        <div class="profile-menu">
          <div class="profile-info">
            <div class="profile-name">Jaishree D G</div>
            <div class="profile-role">Apprentice Tech</div>
          </div>
 
 
          <ul>
            <li class="menu-add-info">
              <svg class="menu-icon" viewBox="0 0 24 24">
                <circle cx="12" cy="7" r="4"></circle>
                <path d="M5.5 21a6.5 6.5 0 0113 0"></path>
              </svg>
              <span class="add-info-label">${addInfoLabel}</span>
            </li>
 
 
            <li class="menu-posts">
              <svg class="menu-icon" viewBox="0 0 24 24">
                <rect x="4" y="4" width="16" height="16" rx="2"></rect>
                <line x1="8" y1="8" x2="16" y2="8"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              My Posts
            </li>
 
 
            <li class="danger menu-logout">
              <svg class="menu-icon" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </li>
          </ul>
        </div>
      </div>
 
 
    </div>
  `;
 
  nav.querySelector('.profile-menu').style.zIndex = '99999';
 
  const profile = nav.querySelector('.profile');
  const profileMenu = nav.querySelector('.profile-menu');
 
  const mobileSearchBar = document.createElement('div');
  mobileSearchBar.className = 'mobile-search-bar';
  mobileSearchBar.innerHTML = `<div class="mobile-search-input-wrap"><input type="search" placeholder="${isAdminPage ? 'Search...' : searchText}" /></div>`;
  nav.appendChild(mobileSearchBar);
 
  function closeAll() {
    profile.classList.remove('open');
    mobileSearchBar.classList.remove('open');
  }
 
  nav.querySelector('.profile-trigger').addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = profile.classList.contains('open');
    closeAll();
    if (!isOpen) profile.classList.add('open');
  });
 
  profileMenu.addEventListener('click', (e) => e.stopPropagation());
 
  nav.querySelector('.mobile-search-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = mobileSearchBar.classList.contains('open');
    closeAll();
    if (!isOpen) {
      mobileSearchBar.classList.add('open');
      mobileSearchBar.querySelector('input').focus();
    }
  });
 
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closeAll();
  });
 
  nav.querySelector('.menu-posts')?.addEventListener('click', () => {
    window.location.href = '/myposts';
  });
 
  nav.querySelector('.menu-add-info')?.addEventListener('click', () => {
    openProfileModal(nav);
  });

  nav.querySelector('.menu-logout')?.addEventListener('click', () => {
  if (window?.adobeIMS) {
    window.adobeIMS.signOut();
    updateHeaderUser(nav);
    window.currentUser = null;
    window.dispatchEvent(new Event('user:updated'));
  } else {
    console.error('Adobe IMS not available');
  }
});
 
  block.append(nav);

  await updateHeaderUser(nav);
  window.addEventListener('focus', () => {
  updateHeaderUser(nav);
});

// optional: custom event trigger anywhere in app
window.addEventListener('user:updated', () => {
  updateHeaderUser(nav);
});

//   const logoImg = nav.querySelector('.nav-logo-img');
// const savedTheme = localStorage.getItem('theme') || 'light';

// logoImg.src = savedTheme === 'dark' ? LOGO_DARK : LOGO_LIGHT;


 
  /* ── Hamburger → sidebar wiring ── */
  const hamburgerBtn = nav.querySelector('.hamburger-btn');
  hamburgerBtn.innerHTML = HAMBURGER_SVG;
  hamburgerBtn.addEventListener('click', () => {
    const sidebar = document.getElementById('ac-sidebar');
    const overlay = document.getElementById('ac-sidebar-overlay');
    const isOpen = sidebar?.classList.contains('is-open');
    if (isOpen) {
      sidebar.classList.remove('is-open');
      overlay?.classList.remove('is-visible');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      hamburgerBtn.innerHTML = HAMBURGER_SVG;
    } else {
      sidebar?.classList.add('is-open');
      overlay?.classList.add('is-visible');
      hamburgerBtn.setAttribute('aria-expanded', 'true');
      hamburgerBtn.innerHTML = CLOSE_SVG;
    }
  });
  // Reset icon when sidebar closes via overlay, Escape, or nav-link click
  document.addEventListener('ac:sidebar-closed', () => {
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerBtn.innerHTML = HAMBURGER_SVG;
  });
 
  /* ── Attach search to both desktop and mobile inputs ── */
  const attachFn = isAdminPage ? attachAdminSearch : attachSearch;
  const desktopInput = nav.querySelector('.nav-search input');
  if (desktopInput) attachFn(desktopInput);

  const mobileInput = mobileSearchBar.querySelector('input');
  if (mobileInput) attachFn(mobileInput);
 
  /* DARK / LIGHT MODE TOGGLE */
  const themeBtn = nav.querySelector('.theme-toggle-btn');
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const logoImg = nav.querySelector('.nav-logo-img');
  logoImg.src = savedTheme === 'dark' ? LOGO_DARK : LOGO_LIGHT;

  const [moonSvg, sunSvg, bellSvg] = await Promise.all([
    fetchIcon('moon'),
    fetchIcon('sun'),
    fetchIcon('bell'),
  ]);

  themeBtn.innerHTML = savedTheme === 'dark' ? sunSvg : moonSvg;

  themeBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    themeBtn.innerHTML = next === 'dark' ? sunSvg : moonSvg;
    logoImg.src = next === 'dark' ? LOGO_DARK : LOGO_LIGHT;
  });

  const notifyBtn = nav.querySelector('.notify-trigger');
  notifyBtn.insertAdjacentHTML('afterbegin', bellSvg);
}

/* PROFILE MODAL */
function openProfileModal(nav) {
  if (document.querySelector('.profile-modal-overlay')) return;
 
  const savedDate = localStorage.getItem('profileBirthday') || '';
  const savedInterests = JSON.parse(localStorage.getItem('profileInterests') || '[]');
  const isEdit = localStorage.getItem('profileComplete') === 'true';

  const imsProfile = window?.adobeIMS?.getProfile?.();
  // const isProfileMissing = !imsProfile;
  const isProfileMissing =
  !imsProfile ||
  !imsProfile.userId ||
  !imsProfile.email;

  const { adobeIoEndpoint } = getConfig();
  const baseUrl = adobeIoEndpoint || '';
 
  const overlay = document.createElement('div');
  overlay.className = 'profile-modal-overlay';
 
  overlay.innerHTML = `
    <div class="profile-modal">
      <div class="profile-modal-header">
        <h3>${isEdit ? 'Edit Your Profile' : 'Complete Your Profile'}</h3>
        <button class="modal-close">✕</button>
      </div>
      <div class="profile-modal-body">
        ${
        isProfileMissing
          ? `
        <label>First Name</label>
        <input type="text" class="first-name" placeholder="Enter first name" />

        <label>Last Name</label>
        <input type="text" class="last-name" placeholder="Enter last name" />

        <label>Email</label>
        <input type="email" class="email" placeholder="Enter email" />
      `
          : ''
      }
        <label>Birthday</label>
        <div class="date-field">
          <input type="date" value="${savedDate}" />
        </div>
        <div class="interests-header">
          <span>Interests</span>
          <span class="interest-count">${savedInterests.length} selected (min 3)</span>
        </div>
        <div class="interest-list">
          ${[
    'UI/UX Design', 'Development', 'Marketing', 'Music',
    'Leadership', 'Mentoring', 'Sports', 'Photography',
    'Travelling', 'Psychology', 'Fitness', 'Gaming', 'Art', 'Dancing', 'Fashion',
  ].map((i) => `<button class="interest-chip${savedInterests.includes(i) ? ' selected' : ''}">${i}</button>`).join('')}
        </div>
        <button class="update-btn" ${savedInterests.length >= 3 ? '' : 'disabled'}>Update Profile</button>
      </div>
    </div>
  `;
 
  document.body.appendChild(overlay);
 
  const chips = overlay.querySelectorAll('.interest-chip');
  const countText = overlay.querySelector('.interest-count');
  const updateBtn = overlay.querySelector('.update-btn');
 
  function updateState() {
    const selected = overlay.querySelectorAll('.interest-chip.selected').length;
    countText.textContent = `${selected} selected (min 3)`;
    updateBtn.disabled = selected < 3;
  }
 
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
      updateState();
    });
  });
 
  // updateBtn.addEventListener('click', () => {
  //   const dateInput = overlay.querySelector('input[type="date"]');
  //   if (!dateInput.value) {
  //     dateInput.setAttribute('required', 'true');
  //     dateInput.reportValidity();
  //     return;
  //   }
 
  //   const selectedInterests = [...overlay.querySelectorAll('.interest-chip.selected')]
  //     .map((c) => c.textContent.trim());
  //   localStorage.setItem('profileBirthday', dateInput.value);
  //   localStorage.setItem('profileInterests', JSON.stringify(selectedInterests));
  //   localStorage.setItem('profileComplete', 'true');
 
  //   const label = nav?.querySelector('.add-info-label');
  //   if (label) label.textContent = 'Edit Info';
  //   overlay.remove();
  // });
 
  overlay.querySelector('.modal-close').onclick = () => overlay.remove();
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

    updateBtn.addEventListener('click', async () => {
    const dateInput = overlay.querySelector('input[type="date"]');

    if (!dateInput.value) {
      dateInput.setAttribute('required', 'true');
      dateInput.reportValidity();
      return;
    }

    const selectedInterests = [...overlay.querySelectorAll('.interest-chip.selected')]
      .map((c) => c.textContent.trim());

    let payload = {
      birthday: dateInput.value,
      interests: selectedInterests,
    };

    //  Add extra fields only if IMS profile missing
    if (isProfileMissing) {
      const firstName = overlay.querySelector('.first-name')?.value?.trim();
      const lastName = overlay.querySelector('.last-name')?.value?.trim();
      const email = overlay.querySelector('.email')?.value?.trim();

      if (!firstName || !lastName || !email) {
        alert('Please fill all required fields');
        return;
      }

      payload = {
        ...payload,
        first_name: firstName,
        last_name: lastName,
        email,
      };
    }

    try {
      await updateEmployee(payload,baseUrl);
    } catch (e) {
      console.error('Update failed:', e);
    }

    localStorage.setItem('profileBirthday', dateInput.value);
    localStorage.setItem('profileInterests', JSON.stringify(selectedInterests));
    localStorage.setItem('profileComplete', 'true');

    overlay.remove();
  });
  
}
 