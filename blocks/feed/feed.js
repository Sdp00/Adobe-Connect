import { html, render } from '../../vendor/htm-preact.js';
import { useState, useEffect,useCallback,useRef } from '../../vendor/preact-hooks.js';


const DEFAULT_CONFIG = {
  hideLikeIcon: false,
  hideCommentIcon: false,
  hideImages: false,
  disableLightbox: false,
  showAvatars: true,
  maxCommentsVisible: 3,
  allowComments: true,
};

/*  Lightbox  */

function Lightbox({ images, startIndex, onClose,commentsList,commentInput,setCommentInput,addComment }) {
  const [current, setCurrent] = useState(startIndex);
  const total = images.length;

  const prev = useCallback((e) => {
    e.stopPropagation();
    setCurrent(i => (i - 1 + total) % total);
  }, [total]);

  const next = useCallback((e) => {
    e.stopPropagation();
    setCurrent(i => (i + 1) % total);
  }, [total]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft')  setCurrent(i => (i - 1 + total) % total);
      if (e.key === 'ArrowRight') setCurrent(i => (i + 1) % total);
      if (e.key === 'Escape')     onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [total, onClose]);

  return html`
    <div class="lightbox-backdrop" onClick=${onClose}>

    <div class="lightbox-container" onClick=${(e) => e.stopPropagation()}>

      <!-- LEFT: MEDIA -->
      <div class="lightbox-media">

        <!-- Close -->
        <button class="lightbox-close" onClick=${onClose}>✕</button>

        <!-- Counter -->
        <div class="lightbox-counter">${current + 1} / ${total}</div>

        <!-- Image -->
        <img
          class="lightbox-img"
          src=${images[current]}
          alt=""
        />

        <!-- Prev / Next -->
        ${total > 1 && html`
          <button class="lightbox-nav lightbox-nav-prev" onClick=${prev}>‹</button>
          <button class="lightbox-nav lightbox-nav-next" onClick=${next}>›</button>
        `}
      </div>

      <!-- RIGHT: COMMENTS -->
      <div class="lightbox-side">

        <div class="lightbox-side-header">
          <div class="feed-avatar">JN</div>
          <div>
            <div class="feed-name">You</div>
            <div class="feed-meta">Now</div>
          </div>
        </div>

        <div class="lightbox-comments">

          ${commentsList.map(c => html`
            <div class="feed-comment">
              <div class="feed-comment-avatar">
                ${c.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div class="feed-comment-body">
                <div class="feed-comment-name">${c.name}</div>
                <div class="feed-comment-text">${c.text}</div>
              </div>
            </div>
          `)}

        </div>

        <div class="lightbox-comment-input-row">
          <div class="feed-comment-avatar">JN</div>
          <input
            class="feed-comment-input"
            placeholder="Write a comment…"
            value=${commentInput}
            onInput=${(e) => setCommentInput(e.target.value)}
            onKeyDown=${(e) => e.key === 'Enter' && addComment()}
          />

          <button
            class="feed-comment-submit"
            onClick=${addComment}
            disabled=${!commentInput.trim()}
          >
            Post
          </button>
        </div>

      </div>

    </div>

  </div>
  `;
}

/*  FeedCard  */

function FeedCard({ post ,config }) {
  const [liked,    setLiked]    = useState(false);
  const [likes,    setLikes]    = useState(post.likes);
  const [showComments, setShowComments] = useState(false);
  const [lightbox, setLightbox] = useState(null); // null | index

  const [commentsList, setCommentsList] = useState(post.commentsList || []);
  const [commentInput, setCommentInput] = useState('');

  const allImages = post.images || [];
  const [hero, ...rest] = allImages;
  const gridImages = rest.slice(0, 3);
  const extraCount = rest.length > 3 ? rest.length - 3 : 0;

  const initials = post.name === "You"
    ? "JN"
    : post.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const toggleLike = () => {
    setLiked(l => !l);
    setLikes(n => liked ? n - 1 : n + 1);
  };

  const addComment = () => {
  if (!commentInput.trim()) return;

  const newComment = {
    id: Date.now(),
    name: "You",
    text: commentInput
  };

  setCommentsList(prev => [...prev, newComment]);
  setCommentInput('');
};

  // Grid image click → open lightbox at hero(0) + grid offset
  const openLightbox = (imgIndex) => setLightbox(imgIndex);

  return html`
    <div class="feed-card">

      <!-- Header -->
      <div class="feed-header">
      ${config.showAvatars && html`
        <div class="feed-avatar">${initials}</div>
      `}
        <div>
          <div class="feed-name">${post.name}</div>
          <div class="feed-meta">${post.role} • ${post.time}</div>
        </div>
      </div>

      <!-- Text -->
      <div class="feed-text" dangerouslySetInnerHTML=${{ __html: post.text }} />

      <!-- Hero image -->
      ${!config.hideImages && hero && html`
        <img
          class="feed-image-hero"
          src=${hero}
          alt=""
          onClick=${() => !config.disableLightbox && openLightbox(0)}
        />
      `}

      <!-- Grid images -->
      ${!config.hideImages && gridImages.length > 0 && html`
        <div class="feed-image-grid feed-image-grid-${gridImages.length}">
          ${gridImages.map((src, i) => html`
            <div
              class="feed-image-grid-item ${i === gridImages.length - 1 && extraCount > 0 ? 'feed-image-grid-item--overlay' : ''}"
              onClick=${() => !config.disableLightbox && openLightbox(i + 1)}
            >
              <img src=${src} alt="" />
              ${i === gridImages.length - 1 && extraCount > 0 && html`
                <span class="feed-image-overlay-count">+${extraCount}</span>
              `}
            </div>
          `)}
        </div>
      `}

      <!-- Actions bar -->
      <div class="feed-actions">
      ${!config.hideLikeIcon && html`
        <button
          class="feed-action-btn ${liked ? 'feed-action-btn-liked' : ''}"
          onClick=${toggleLike}
          aria-label="Like"
        >
          <svg
            class="feed-action-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill=${liked ? 'currentColor' : 'none'}
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
          </svg>
          <span>${likes}</span>
        </button>
      `}  
      ${!config.hideCommentIcon && html`
        <button
          class="feed-action-btn ${showComments ? 'feed-action-btn-active' : ''}"
          onClick=${() => setShowComments(v => !v)}
          aria-label="Comment"
        >
          <svg class="feed-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>${commentsList.length}</span>
        </button>
      `}
      </div>

      <!-- Comments placeholder -->
      ${showComments && html`
        <div class="feed-comments">

          <!-- Existing comments -->
          ${post.commentsList && post.commentsList
            .slice(0, config.maxCommentsVisible)
            .map(c => html`
            <div class="feed-comment">
              <div class="feed-comment-avatar">
                ${c.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div class="feed-comment-body">
                <div class="feed-comment-name">${c.name}</div>
                <div class="feed-comment-text">${c.text}</div>
              </div>
            </div>
          `)}

          <!-- Input -->
          ${config.allowComments && html`
          <div class="feed-comment-input-row">
            <div class="feed-comment-avatar">JN</div>
            <input
              class="feed-comment-input"
              placeholder="Write a comment…"
              value=${commentInput}
              onInput=${(e) => setCommentInput(e.target.value)}
              onKeyDown=${(e) => e.key === 'Enter' && addComment()}
            />
            <button
              class="feed-comment-submit"
              onClick=${addComment}
              disabled=${!commentInput.trim()}
            >
              Post
            </button>
          </div>
            `}
        </div>
        
      `}

      <!-- Lightbox -->
      ${!config.disableLightbox && lightbox !== null && html`
        <${Lightbox}
          images=${allImages}
          startIndex=${lightbox}
          onClose=${() => setLightbox(null)}
          commentsList=${commentsList}
          commentInput=${commentInput}
          setCommentInput=${setCommentInput}
          addComment=${addComment}
        />
      `}

    </div>
  `;
}

/* Feed  */

function Feed({ config }) {
  const [posts, setPosts]           = useState([]);
  const [visibleCount, setVisibleCount] = useState(3);
  const [loading, setLoading]       = useState(false);
  const loaderRef                   = useRef(null);
  const POSTS_PER_PAGE              = 3;

  // Load JSON once
  useEffect(() => {
    fetch('/data/post.json')
      .then(res => res.json())
      .then(data => setPosts(data))
      .catch(err => console.error('Error loading posts:', err));

    const handler = (e) => {
      const newPost = {
        id: Date.now(),
        name: "You",
        role: "Employee",
        time: "now",
        text: e.detail.text,
        likes: 0,
        comments: 0,
        images: []
      };
      setPosts(prev => [newPost, ...prev]);
    };
    window.addEventListener('create-post', handler);
    return () => window.removeEventListener('create-post', handler);
  }, []);

  // IntersectionObserver — reads latest posts/visibleCount via refs
  const postsRef       = useRef(posts);
  const visibleRef     = useRef(visibleCount);
  const loadingRef     = useRef(loading);

  useEffect(() => { postsRef.current    = posts;        }, [posts]);
  useEffect(() => { visibleRef.current  = visibleCount; }, [visibleCount]);
  useEffect(() => { loadingRef.current  = loading;      }, [loading]);

  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      if (loadingRef.current)         return;

      const current = visibleRef.current;
      const total   = postsRef.current.length;

      if (current >= total) return; // nothing more to load

      setLoading(true);
      // Simulate network delay (remove setTimeout if data is already local)
      setTimeout(() => {
        setVisibleCount(n => Math.min(n + POSTS_PER_PAGE, total));
        setLoading(false);
      }, 400);
    }, { threshold: 0.1 });

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, []); // ← runs once; stale-closure problem solved by refs above

  const visiblePosts = posts.slice(0, visibleCount);
  const hasMore      = visibleCount < posts.length;

  return html`
    <div class="feed">
      ${visiblePosts.map(post => html`
        <${FeedCard} key=${post.id} post=${post} config=${config} />
      `)}

      <div ref=${loaderRef} class="feed-loader">
        ${loading
          ? html`<div class="feed-loader-spinner"></div>`
          : hasMore
            ? html`<span>Scroll for more</span>`
            : html`<span>You're all caught up ✓</span>`
        }
      </div>
    </div>
  `;
}

export default function decorate(block) {

  const rows = [...block.children];

  const config = { ...DEFAULT_CONFIG };

  rows.forEach(row => {
    const [keyEl, valueEl] = row.children;
    if (!keyEl || !valueEl) return;

    const key = keyEl.textContent.trim();
    let value = valueEl.textContent.trim();

    // Convert boolean strings
    if (value === 'true') value = true;
    if (value === 'false') value = false;

    // Convert numbers
    if (!isNaN(value) && value !== '') value = Number(value);

    config[key] = value;
  });

  console.log("FEED CONFIG:", config);

  block.innerHTML=''

  render(html`<${Feed} config=${config} />`, block);
}

