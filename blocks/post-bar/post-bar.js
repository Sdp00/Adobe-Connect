import { html, render } from '../../vendor/htm-preact.js';
import { useState,useEffect } from '../../vendor/preact-hooks.js';

function PostBar() {

  const [text, setText] = useState('');
  const [showFab, setShowFab] = useState(false);

  useEffect(() => {
  const handleScroll = () => {
    if (window.scrollY > 120) {
      setShowFab(true);
    } else {
      setShowFab(false);
    }
  };

  window.addEventListener('scroll', handleScroll);

  return () => window.removeEventListener('scroll', handleScroll);
}, []);

  const submitPost = () => {

    if (!text.trim()) return;

    window.dispatchEvent(
      new CustomEvent('create-post', {
        detail: { text }
      })
    );

    setText('');
  };

  return html`
    <div class="postbar">

      <div class="postbar-avatar">
        JN
      </div>

      <input
        class="postbar-input"
        placeholder="What's on your mind?"
        value=${text}
        onInput=${(e)=>setText(e.target.value)}
      />

      <button
        class="postbar-button"
        onClick=${submitPost}
      >
        + Post
      </button>

    </div>
    
    ${showFab && html`
      <button
        class="postbar-fab"
        onClick=${submitPost}
        aria-label="Create post"
      >
        +
      </button>
    `}
    
  `;
}

export default function decorate(block) {
  
  render(html`<${PostBar} />`, block);
}