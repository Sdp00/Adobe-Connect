import { html, render } from '../../vendor/htm-preact.js';
import { useState, useEffect, useCallback, useRef } from '../../vendor/preact-hooks.js';
import { readBlockConfig } from '../../scripts/aem.js';
import getConfig from '../../scripts/config.js';
import withAuth  from "../../scripts/auth-guard.js";
import { getCachedEmployee, getCurrentUser, isSignedInUser, syncAndGetEmployee } from "../../scripts/auth.js";
import  getUserInfo  from '../../scripts/user.js';



const DEFAULT_CONFIG = {
  hideLikeIcon: false,
  hideCommentIcon: false,
  hideImages: false,
  disableLightbox: false,
  showAvatars: true,
  maxCommentsVisible: 3,
  allowComments: true,
  // dataUrl: "/data/post.json"
  dataUrl:"/feed"
};

function Lightbox({ mediaItems, startIndex, onClose, commentInput, setCommentInput, addComment ,toggleMediaLike,isPostingComment,postName,postInitials,postTime  }) {
  // const [current, setCurrent] = useState(startIndex);
  const safeIndex = Math.min(startIndex, mediaItems.length - 1);
const [current, setCurrent] = useState(safeIndex);
  const total = mediaItems.length;

  const prev = useCallback((e) => {
    e.stopPropagation();
    setCurrent(i => (i - 1 + total) % total);
  }, [total]);

  const next = useCallback((e) => {
    e.stopPropagation();
    setCurrent(i => (i + 1) % total);
  }, [total]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft')  setCurrent(i => (i - 1 + total) % total);
      if (e.key === 'ArrowRight') setCurrent(i => (i + 1) % total);
      if (e.key === 'Escape')     onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [total, onClose]);

  const item = mediaItems?.[current]||null;
  const commentsList = item?.comments || [];

  // const likes = item?.stats?.likes || 0;
  // const commentsCount = item?.stats?.commentsCount || commentsList.length;

  const itemStats = item?.stats || { likes: 0, commentsCount: 0 };

  const renderMedia = () => {
    if (!item) {
    return html`<div>No media</div>`;
  }
    if (item.type?.startsWith('video/')) {
      return html`<video class="lightbox-img" src=${item.url} controls autoplay key=${item.url} />`;
    }
    if (item.type === 'application/pdf') {
      return html`<iframe class="lightbox-pdf-frame" src=${item.url} title=${item.name} />`;
    }
    // plain image string or object
    const src = typeof item === 'string' ? item : item.url;
    return html`<img class="lightbox-img" src=${src} alt="" />`;
  };

  const getThumb = (m) => {
    if (typeof m === 'string') return html`<img src=${m} alt="" />`;
    if (m.type?.startsWith('image/')) return html`<img src=${m.url} alt="" />`;
    if (m.type?.startsWith('video/')) return html`
      <div class="lightbox-thumb-icon">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      </div>`;
    if (m.type === 'application/pdf') return html`
      <div class="lightbox-thumb-icon lightbox-thumb-pdf">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>`;
  };

  const { name, initials } = getUserInfo();

  return html`
    <div class="lightbox-backdrop" onClick=${onClose}>
      <div class="lightbox-container" onClick=${(e) => e.stopPropagation()}>

        <!-- LEFT: MEDIA -->
        <div class="lightbox-media">
          <button class="lightbox-close" onClick=${onClose}>✕</button>
          <div class="lightbox-counter">${current + 1} / ${total}</div>

          <div class="lightbox-media-viewer">
            ${renderMedia()}
          </div>

          
          ${total > 1 && html`
            <button class="lightbox-nav lightbox-nav-prev" onClick=${prev}>‹</button>
            <button class="lightbox-nav lightbox-nav-next" onClick=${next}>›</button>
          `}

          <!-- Thumbnail strip -->
          ${total > 1 && html`
            <div class="lightbox-thumbstrip">
              ${mediaItems.map((m, i) => html`
                <div
                  class="lightbox-thumb ${i === current ? 'lightbox-thumb-active' : ''}"
                  onClick=${(e) => { e.stopPropagation(); setCurrent(i); }}
                >
                  ${getThumb(m)}
                </div>
              `)}
            </div>
          `}
        </div>

        <!-- RIGHT: COMMENTS -->
        <div class="lightbox-side">
          <div class="lightbox-side-header">
            <div class="feed-avatar">${postInitials}</div>
            <div>
              <div class="feed-name">${postName}</div>
              <div class="feed-meta">${postTime}</div>
            </div>
          </div>
          <!-- Stats bar -->
          <div class="lightbox-stats-bar">
            <button
              class="lightbox-stat lightbox-like-btn ${item?.liked ? 'lightbox-stat-liked' : ''}"
              onClick=${() => toggleMediaLike(current)}
            >
              <svg viewBox="0 0 24 24"
                fill=${item?.liked ? 'currentColor' : 'none'}
                stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
              </svg>
              ${itemStats.likes} likes
            </button>
            <span class="lightbox-stat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              ${commentsList.length} comments
            </span>
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
            <div class="feed-comment-avatar">${initials}</div>
            <input
              class="feed-comment-input"
              placeholder="Write a comment…"
              value=${commentInput}
              onInput=${(e) => setCommentInput(e.target.value)}
              onKeyDown=${(e) => e.key === 'Enter' && addComment(current)}
              disabled=${isPostingComment}
            />
            <button class="feed-comment-submit" onClick=${() =>addComment(current)} disabled=${!commentInput.trim() || isPostingComment}>
              ${isPostingComment ? 'Posting...' : 'Post'}
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
  const [isPostingComment, setIsPostingComment] = useState(false);
  const { adobeIoEndpoint } = getConfig();
  const baseUrl = adobeIoEndpoint || '';
  

  // const allImages = post.images || [];
  // const [hero, ...rest] = allImages;
  // const gridImages = rest.slice(0, 3);
  // const extraCount = rest.length > 3 ? rest.length - 3 : 0;

  // Build unified media array for lightbox: images → videos → pdfs
// const imageItems = (post.images || []).map(url => ({ url, type: 'image/jpeg' }));
// const videoItems = post.videos || [];
// const pdfItems   = post.pdfs   || [];
// const allMedia   = [...imageItems, ...videoItems, ...pdfItems];

// const allMedia = (post.mediaWithComments || []).map(m => {
//   if (m.type === 'image') {
//     return { ...m, type: 'image/jpeg' };
//   }
//   if (m.type === 'video') {
//     return { ...m, type: 'video/mp4' };
//   }
//   if (m.type === 'pdf') {
//     return { ...m, type: 'application/pdf' };
//   }
//   return m;
// });
const allMedia = (post.mediaWithComments || []).map(m => {
  const type = m.type === 'image' ? 'image/jpeg'
             : m.type === 'video' ? 'video/mp4'
             : m.type === 'pdf'   ? 'application/pdf'
             : m.type;
  return { ...m, type, liked: false };  //  ADD liked: false
});
const [mediaState, setMediaState] = useState(allMedia);

// ALL media goes into the same grid
// const [heroItem, ...restItems] = allMedia;
// const gridItems  = restItems.slice(0, 3);
// const extraCount = restItems.length > 3 ? restItems.length - 3 : 0;
let heroItem = null;
let gridItems = [];
let extraCount = 0;

if (mediaState.length === 1) {
  heroItem = mediaState[0];
} else if (mediaState.length === 2) {
  gridItems = mediaState; //  both side by side
} else {
  heroItem = mediaState[0];
  const restItems = mediaState.slice(1);
  gridItems = restItems.slice(0, 3);
  extraCount = restItems.length > 3 ? restItems.length - 3 : 0;
}
// Image layout (hero + grid) — unchanged
// const allImages = post.images || [];
// const [hero, ...rest] = allImages;
// const gridImages = rest.slice(0, 3);
// const extraCount = rest.length > 3 ? rest.length - 3 : 0;

const { name: currentName, initials: currentInitials } = getUserInfo();

  const initials = post.name === "You"
    ? {currentInitials}
    : post.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  // const toggleLike = () => {
  //   setLiked(l => !l);
  //   setLikes(n => liked ? n - 1 : n + 1);
  // };
  const toggleLike = withAuth(() => {
  setLiked(l => !l);
  setLikes(n => liked ? n - 1 : n + 1);
});

const handleToggleComments = withAuth(() => {
  setShowComments(v => !v);
});

//   const addComment = () => {
//   if (!commentInput.trim()) return;

//   const newComment = {
//     id: Date.now(),
//     name: "You",
//     text: commentInput
//   };

//   setCommentsList(prev => [...prev, newComment]);
//   setCommentInput('');
// };

// const addComment = () => {
//   if (!commentInput.trim()) return;

//   const newComment = {
//     id: Date.now(),
//     name: "You",
//     text: commentInput
//   };

//   // Update merged (FEED)
//   setCommentsList(prev => [...prev, newComment]);

//   // Update current media (LIGHTBOX)
//   if (lightbox !== null) {
//     allMedia[lightbox].comments.push(newComment);
//   }

//   setCommentInput('');
// };

// const addComment = () => {
//   if (!commentInput.trim()) return;

//   const newComment = {
//     id: Date.now(),
//     name: "You",
//     text: commentInput
//   };

//   // Update FEED (merged)
//   setCommentsList(prev => [...prev, newComment]);

//   // Update MEDIA (IMMUTABLE)
//   if (lightbox !== null) {
//     // setMediaState(prev => {
//     //   const updated = [...prev];
//     //   updated[lightbox] = {
//     //     ...updated[lightbox],
//     //     comments: [...(updated[lightbox].comments || []), newComment]
//     //   };
//     //   return updated;
//     // });
//     setMediaState(prev => {
//   if (lightbox === null) return prev;

//   const updated = [...prev];

//   const currentItem = updated[lightbox] || {};
  
//   updated[lightbox] = {
//     ...currentItem,
//     comments: [...(currentItem.comments || []), newComment]
//   };

//   return updated;
// });
//   }

//   setCommentInput('');
// };

const addComment = async (index) => {
  if (!commentInput.trim()) return;

  setIsPostingComment(true);

    // let employee = getCachedEmployee();

    // if (!employee?._id) {
    //   employee = await syncAndGetEmployee(baseUrl);
    // }

    // if (!employee?._id) {
    //   throw new Error("Employee not found");
    // }
    const users = await getCurrentUser(baseUrl);
        const token = window.adobeIMS.getAccessToken();
        const sid = token?.sid;
    
            // try match
        let employee = users.find(user => user.imsId === sid);
    
        // fallback (important)
        if (!employee) {
          console.warn('SID match failed, fallback to email');
    
          const profile = window.adobeIMS.getProfile();
    
          employee = users.find(
            user => user.email === profile?.email
            );
          }
    
          if (!employee?._id) {
            throw new Error('Employee not found');
          }

  // const currentMedia = mediaState[lightbox];
  const currentMedia = mediaState[index];

  const payload = {
    comment: commentInput,
    feedId: post.id,
    like:false,
    mediaId: currentMedia._id, 
    userId: employee._id // replace with auth user
  };
  

  try {
    const response = await fetch(`${baseUrl}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const savedComment = await response.json();

    const newComment = {
      id: savedComment._id,
      name: "You",
      text: savedComment.comment
    };

    //  Update FEED comments
    setCommentsList(prev => [...prev, newComment]);

    //  Update MEDIA comments
    setMediaState(prev => {
      const updated = [...prev];
      // const item = updated[lightbox];
      const item = updated[index];

      // updated[lightbox] = {
      //   ...item,
      //   comments: [...(item.comments || []), newComment],
      //   stats: {
      //     ...item.stats,
      //     commentsCount: (item.stats?.commentsCount || 0) + 1
      //   }
      // };

      updated[index] = {
        ...item,
        comments: [...(item.comments || []), newComment],
        stats: {
          ...item.stats,
          commentsCount: (item.stats?.commentsCount || 0) + 1
        }
      };

      return updated;
    });

    setCommentInput('');
  } catch (err) {
    console.error("Failed to post comment", err);
  } finally {
    setIsPostingComment(false); // END loading
  }

};

const toggleMediaLike = (index) => {
  setMediaState(prev => {
    const updated = [...prev];
    const item = updated[index];
    const wasLiked = item.liked;
    updated[index] = {
      ...item,
      liked: !wasLiked,
      stats: {
        ...item.stats,
        likes: wasLiked ? item.stats.likes - 1 : item.stats.likes + 1
      }
    };
    return updated;
  });
};

  // Grid image click → open lightbox at hero(0) + grid offset
  // const openLightbox = (imgIndex) => setLightbox(imgIndex);
  // const openLightbox = (imgIndex) => {
  // if (imgIndex >= mediaState.length) return;
  // setLightbox(imgIndex);
  // };

  const openLightbox = withAuth((imgIndex) => {
  if (imgIndex >= mediaState.length) return;
  setLightbox(imgIndex);
});

const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

useEffect(() => {
  isSignedInUser().then(setIsUserLoggedIn);
}, []);

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

      <!-- Title -->
      ${post.title && html`
        <div class="feed-title">${post.title}</div>
      `}

      <!-- Text -->
      <div class="feed-text" dangerouslySetInnerHTML=${{ __html: post.text }} />

      <!-- Hero image -->
      <!-- Hero media (first item) -->
      ${!config.hideImages && heroItem && html`
        <div
          class="feed-media-hero-wrap"
          title=${!isUserLoggedIn ? "Login to access" : ""}
          onClick=${() => !config.disableLightbox && openLightbox(0)}
        >
          ${heroItem.type?.startsWith('video/') ? html`
            <video class="feed-image-hero" src=${heroItem.url} preload="metadata" />
            <div class="feed-video-play-btn feed-video-play-btn-hero">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </div>
          ` : heroItem.type === 'application/pdf' ? html`
            <div class="feed-pdf-hero">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <span>${heroItem.name}</span>
            </div>
          ` : html`
            <img class="feed-image-hero" src=${heroItem.url} alt="" />
          `}
        </div>
      `}

      <!-- Grid: remaining media items -->
      ${!config.hideImages && gridItems.length > 0 && html`
        <div class="feed-image-grid feed-image-grid-${gridItems.length}">
          ${gridItems.map((item, i) => html`
            <div
              class="feed-image-grid-item ${i === gridItems.length - 1 && extraCount > 0 ? 'feed-image-grid-item--overlay' : ''}"
              title=${!isUserLoggedIn ? "Login to access" : ""}
              onClick=${() => !config.disableLightbox &&  openLightbox(heroItem ? i + 1 : i)}
            >
              ${item.type?.startsWith('video/') ? html`
                <video src=${item.url} preload="metadata" />
                <div class="feed-grid-play-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </div>
              ` : item.type === 'application/pdf' ? html`
                <div class="feed-grid-pdf-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span>${item.name}</span>
                </div>
              ` : html`
                <img src=${item.url} alt="" />
              `}
              ${i === gridItems.length - 1 && extraCount > 0 && html`
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
          title=${!isUserLoggedIn ? "Login to access" : ""}
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
          title=${!isUserLoggedIn ? "Login to access" : ""}
          onClick=${handleToggleComments}
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
          ${commentsList
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
          toggleMediaLike=${toggleMediaLike}
          mediaItems=${mediaState}
          startIndex=${lightbox}
          onClose=${() => setLightbox(null)}
          commentsList=${mediaState[lightbox]?.comments || []}
          commentInput=${commentInput}
          setCommentInput=${setCommentInput}
          addComment=${addComment}
          isPostingComment=${isPostingComment}
          postName=${post.name}
          postInitials=${post.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
          postTime=${post.time}
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

  const { adobeIoEndpoint } = getConfig();
  const baseUrl = adobeIoEndpoint || '';
  // const baseUrl = '';

  const POSTS_API = config.dataUrl
  ? (config.dataUrl.startsWith('http')
      ? config.dataUrl
      : `${baseUrl || ''}${config.dataUrl}`)
  : `${baseUrl || ''}/feed`;

  // Load JSON once
  useEffect(() => {
    // fetch('/data/post.json')
    fetch(POSTS_API)
      .then(res => res.json())
      // .then(data =>setPosts(data))
      .then(data => {
        const transformed = data.map(transformPost);
        console.log(data)
        setPosts(transformed);
      })
      .catch(err => console.error('Error loading posts:', err));

    // const handler = (e) => {
    //   const { title, text, files = [] } = e.detail;
    //   const mediaItems = files.map(file => ({
    //     url: URL.createObjectURL(file),
    //     type: file.type,
    //     name: file.name,
    //   }));
    //   const newPost = {
    //     id: Date.now(),
    //     name: "You",
    //     role: "Employee",
    //     time: "now",
    //     title: e.detail.title,
    //     text: e.detail.text,
    //     likes: 0,
    //     comments: 0,
    //     // images: []
    //     images: mediaItems.filter(m => m.type.startsWith('image/')).map(m => m.url),
    //     videos: mediaItems.filter(m => m.type.startsWith('video/')),
    //     pdfs:   mediaItems.filter(m => m.type === 'application/pdf'),
    //   };
    //   setPosts(prev => [newPost, ...prev]);
    // };
    const handler = (e) => {
    const apiPost = e.detail;

    const transformed = transformPost(apiPost);

    setPosts(prev => [transformed, ...prev]);
  };


    window.addEventListener('create-post', handler);
    return () => window.removeEventListener('create-post', handler);
  }, []);

//   function transformPost(apiPost) {
//   const media = apiPost.content?.media || [];

//   const images = [];
//   const videos = [];
//   const pdfs = [];
//   let commentsList = [];
//   let totalLikes = 0;

//   media.forEach((m) => {
//     // normalize URL (important if backend is relative)
//     const fullUrl = m.url.startsWith('http')
//       ? m.url
//       : `${getBackendBaseUrl()}${m.url}`;

//     if (m.type === 'image') {
//       images.push(fullUrl);
//     } else if (m.type === 'video') {
//       videos.push({
//         url: fullUrl,
//         type: 'video/mp4'
//       });
//     } else if (m.type === 'pdf') {
//       pdfs.push({
//         url: fullUrl,
//         type: 'application/pdf',
//         name: m.name
//       });
//     }

//     // comments
//     if (m.comments) {
//       commentsList = [
//         ...commentsList,
//         ...m.comments.map(c => ({
//           id: c._id,
//           name: c.author?.name || 'User',
//           text: c.text
//         }))
//       ];
//     }

//     // likes
//     totalLikes += m.stats?.likes || 0;
//   });

//   return {
//     id: apiPost._id,
//     name: apiPost.author?.name || 'User',
//     role: apiPost.author?.role || '',
//     time: new Date(apiPost.createdAt).toLocaleString(),
//     title: apiPost.content?.title,
//     text: apiPost.content?.text,
//     likes: totalLikes,
//     commentsList,
//     images,
//     videos,
//     pdfs
//   };
// }

function transformPost(apiPost) {
  // const media = apiPost.content?.media || [];

  const media = apiPost?.files || [];
  

  const images = [];
  const videos = [];
  const pdfs = [];
  const mediaWithComments = [];
  // let commentsList = [];
  // let totalLikes = 0;

  const commentsList = (apiPost.comments || []).map(c => ({
    id: c._id,
    name: `${c.user?.first_name || ''} ${c.user?.last_name || ''}`.trim() || 'User',
    text: c.comment
  }));

  let totalLikes = apiPost.comments?.filter(c => c.like)?.length || 0;

  media.forEach((m) => {
    // const fullUrl = m.url.startsWith('http')
    //   ? m.url
    //   : `${getBackendBaseUrl()}${m.url}`;

    const { adobeIoEndpoint } = getConfig();
  //   const fullUrl =
  // m.url.startsWith('http') || m.url.startsWith('blob:')
  //   ? m.url
  //   : `${adobeIoEndpoint}${m.url}`;

  const fileUrl = m.url || m.filePath || '';

const fullUrl =
  fileUrl.startsWith('http') || fileUrl.startsWith('blob:')
    ? fileUrl
    : `${adobeIoEndpoint}${fileUrl}`;

    // MEDIA TYPE MAPPING (IMPORTANT FIX)
    // if (m.type === 'image') {
    //   images.push(fullUrl);
    // } else if (m.type === 'video') {
    //   videos.push({
    //     url: fullUrl,
    //     type: 'video/mp4'
    //   });
    // } else if (m.type === 'pdf') {
    //   pdfs.push({
    //     url: fullUrl,
    //     type: 'application/pdf',
    //     name: m.name
    //   });
    // }

    const mime = m.type || m.mimetype || '';

if (mime.startsWith('image/')) {
  images.push(fullUrl);
} else if (mime.startsWith('video/')) {
  videos.push({
    url: fullUrl,
    type: mime
  });
} else if (mime === 'application/pdf') {
  pdfs.push({
    url: fullUrl,
    type: 'application/pdf',
    name: m.fileName || m.name
  });
}

    // mediaWithComments.push({
    //   type: m.type,
    //   url: fullUrl,
    //   name: m.name,
    //   stats: m.stats || { likes: 0, commentsCount: 0 },
    //   comments: (m.comments || []).map(c => ({
    //     id: c._id,
    //     name: c.author?.name || 'User',
    //     text: c.text
    //   }))
    // });

    mediaWithComments.push({
      _id: m._id,
  type: mime.startsWith('image/') ? 'image'
       : mime.startsWith('video/') ? 'video'
       : mime === 'application/pdf' ? 'pdf'
       : mime,
  url: fullUrl,
  name: m.fileName || m.name,
  // stats: m.stats || { likes: 0, commentsCount: 0 },
  stats: {
        likes: totalLikes,
        commentsCount: commentsList.length
      },
  // comments: (m.comments || []).map(c => ({
  //   id: c._id,
  //   name: c.author?.name || 'User',
  //   text: c.text
  // }))
  comments: (apiPost.comments || [])
    .filter(c => c.mediaId === m._id)
    .map(c => ({
      id: c._id,
      name: `${c.user?.first_name || ''} ${c.user?.last_name || ''}`.trim() || 'User',
      text: c.comment
    }))
  // comments: commentsList
});

    // COMMENTS
    // if (m.comments) {
    //   commentsList = [
    //     ...commentsList,
    //     ...m.comments.map(c => ({
    //       id: c._id,
    //       name: c.author?.name || 'User',
    //       text: c.text
    //     }))
    //   ];
    // }


    // LIKES
    totalLikes += m.stats?.likes || 0;
  });

  return {
    id: apiPost._id,
    // name: apiPost.author?.name || 'User',
     name: `${apiPost.author?.first_name || ''} ${apiPost.author?.last_name || ''}`.trim() || 'User',
    // role: apiPost.author?.role || '',
    role: apiPost.author?.email || '',
    time: new Date(apiPost.createdAt).toLocaleString(),
    // title: apiPost.content?.title || "",
    title: apiPost?.title || "",
    // text: apiPost.content?.text || "",
    text: apiPost?.description || "",
    likes: totalLikes,
    commentsList,
    images,
    videos,
    pdfs,
    mediaWithComments
  };
}


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

  // rows.forEach(row => {
  //   const [keyEl, valueEl] = row.children;
  //   if (!keyEl || !valueEl) return;

  //   const key = keyEl.textContent.trim();
  //   let value = valueEl.textContent.trim();

  //   // Convert boolean strings
  //   if (value === 'true') value = true;
  //   if (value === 'false') value = false;

  //   // Convert numbers
  //   if (!isNaN(value) && value !== '') value = Number(value);

  //   config[key] = value;
  // });

  // console.log("FEED CONFIG:", config);

  block.innerHTML=''

  render(html`<${Feed} config=${config} />`, block);
}
