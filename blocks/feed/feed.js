import { html, render } from '../../vendor/htm-preact.js';
import { useState, useEffect,useCallback,useRef } from '../../vendor/preact-hooks.js';


const MOCK_POSTS = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "Senior UX Designer",
    time: "2 hours ago",
    text: `Just finished the new design system for our enterprise platform 🎉 Spent 3 months getting every component just right. The key insight: <strong>consistency beats creativity</strong> when you're building for scale. Here's a sneak peek at the keyboard shortcuts overlay we designed...`,
    likes: 24,
    comments: 6,
    images: [
      "https://picsum.photos/seed/main/800/420",
      "https://picsum.photos/seed/aa/400/300",
      "https://picsum.photos/seed/bb/400/300",
      "https://picsum.photos/seed/cc/400/300",
      "https://picsum.photos/seed/dd/400/300",
    ]
  },
  {
    id: 2,
    name: "Marcus Rivera",
    role: "Engineering Manager",
    time: "4 hours ago",
    text: `Huge shoutout to the backend team for hitting <strong>99.98% uptime</strong> this quarter 🚀 We migrated 3 microservices to the new infra without a single customer-facing incident. That's what ownership looks like.`,
    likes: 41,
    comments: 3,
    images: []
  },
  {
    id: 3,
    name: "Priya Nair",
    role: "Product Manager",
    time: "Yesterday",
    text: `Wrapped up our Q1 roadmap review with leadership. Excited to share that <strong>three of our top-voted features</strong> are officially greenlit for Q2! Stay tuned for more details at the All-Hands next week 📋`,
    likes: 18,
    comments: 9,
    images: [
      "https://picsum.photos/seed/roadmap/800/400",
    ]
  },
  {
    id: 4,
    name: "James Okafor",
    role: "Senior Data Analyst",
    time: "Yesterday",
    text: `Built a new real-time dashboard for monitoring user retention across segments. First time we've had this level of visibility — the drop-off at day 7 is finally explainable 📊 Happy to walk anyone through it.`,
    likes: 33,
    comments: 12,
    images: [
      "https://picsum.photos/seed/dash/800/420",
      "https://picsum.photos/seed/chart1/400/300",
      "https://picsum.photos/seed/chart2/400/300",
    ]
  },
  {
    id: 5,
    name: "Lena Fischer",
    role: "HR Business Partner",
    time: "2 days ago",
    text: `Reminder: the <strong>Learning & Development budget</strong> resets at the end of this month 📚 Don't let it go to waste — courses, conferences, and books all qualify. Drop your requests in the L&D portal by Friday!`,
    likes: 57,
    comments: 4,
    images: []
  },
  {
    id: 6,
    name: "Tom Yashida",
    role: "DevOps Engineer",
    time: "2 days ago",
    text: `Just deployed our new CI/CD pipeline. Build times dropped from <strong>18 minutes → 4 minutes</strong> ⚡ The key was parallelising the test suites and caching dependencies more aggressively. Will write up a full post-mortem next week.`,
    likes: 29,
    comments: 7,
    images: [
      "https://picsum.photos/seed/devops/800/400",
    ]
  },
  {
    id: 7,
    name: "Ananya Bhatt",
    role: "Content Strategist",
    time: "3 days ago",
    text: `Our refreshed brand voice guide is now live on the internal wiki! 🎨 We've simplified the tone pillars from 7 down to 3: <strong>Clear, Human, Bold.</strong> Please use it for all external comms going forward.`,
    likes: 15,
    comments: 6,
    commentsList: [
      { id: 1, name: "Alex", text: "This is amazing 👏" },
      { id: 2, name: "John", text: "Loved the consistency point!" }
    ],
    images: [
      "https://picsum.photos/seed/brand1/400/300",
      "https://picsum.photos/seed/brand2/400/300",
    ]
  },
];

/*  Lightbox  */

function Lightbox({ images, startIndex, onClose }) {
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

      <!-- Counter -->
      <div class="lightbox-counter">${current + 1} / ${total}</div>

      <!-- Close -->
      <button class="lightbox-close" onClick=${onClose} aria-label="Close">✕</button>

      <!-- Image -->
      <div class="lightbox-image-wrap" onClick=${(e) => e.stopPropagation()}>
        <img
          class="lightbox-img"
          src=${images[current]}
          alt=""
        />

        <!-- Dot indicators -->
        ${total > 1 && html`
          <div class="lightbox-dots">
            ${images.map((_, i) => html`
              <span
                class="lightbox-dot ${i === current ? 'lightbox-dot-active' : ''}"
                onClick=${(e) => { e.stopPropagation(); setCurrent(i); }}
              />
            `)}
          </div>
        `}
      </div>

      <!-- Prev / Next -->
      ${total > 1 && html`
        <button class="lightbox-nav lightbox-nav-prev" onClick=${prev} aria-label="Previous">‹</button>
        <button class="lightbox-nav lightbox-nav-next" onClick=${next} aria-label="Next">›</button>
      `}

    </div>
  `;
}

/*  FeedCard  */

function FeedCard({ post }) {
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
        <div class="feed-avatar">${initials}</div>
        <div>
          <div class="feed-name">${post.name}</div>
          <div class="feed-meta">${post.role} • ${post.time}</div>
        </div>
      </div>

      <!-- Text -->
      <div class="feed-text" dangerouslySetInnerHTML=${{ __html: post.text }} />

      <!-- Hero image -->
      ${hero && html`
        <img
          class="feed-image-hero"
          src=${hero}
          alt=""
          onClick=${() => openLightbox(0)}
        />
      `}

      <!-- Grid images -->
      ${gridImages.length > 0 && html`
        <div class="feed-image-grid feed-image-grid-${gridImages.length}">
          ${gridImages.map((src, i) => html`
            <div
              class="feed-image-grid-item ${i === gridImages.length - 1 && extraCount > 0 ? 'feed-image-grid-item--overlay' : ''}"
              onClick=${() => openLightbox(i + 1)}
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

        <button
          class="feed-action-btn ${showComments ? 'feed-action-btn-active' : ''}"
          onClick=${() => setShowComments(v => !v)}
          aria-label="Comment"
        >
          <svg class="feed-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>${post.comments}</span>
        </button>
      </div>

      <!-- Comments placeholder -->
      ${showComments && html`
  <div class="feed-comments">

    <!-- Existing comments -->
    ${post.commentsList && post.commentsList.map(c => html`
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
    <div class="feed-comment-input-row">
      <div class="feed-comment-avatar">JN</div>
      <input class="feed-comment-input" placeholder="Write a comment…" />
    </div>

  </div>
`}

      <!-- Lightbox -->
      ${lightbox !== null && html`
        <${Lightbox}
          images=${allImages}
          startIndex=${lightbox}
          onClose=${() => setLightbox(null)}
        />
      `}

    </div>
  `;
}

/* Feed  */

function Feed() {
  const [posts, setPosts] = useState(MOCK_POSTS);

  useEffect(() => {
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

  return html`
    <div class="feed">
      ${posts.map(post => html`
        <${FeedCard} key=${post.id} post=${post} />
      `)}
    </div>
  `;
}

export default function decorate(block) {
  render(html`<${Feed} />`, block);
}

