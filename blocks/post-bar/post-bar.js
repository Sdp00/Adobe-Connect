import { html, render } from '../../vendor/htm-preact.js';
import { useState,useEffect } from '../../vendor/preact-hooks.js';
import Modal from '../../helper/modal.js';
import MediaUpload from '../../helper/media-upload.js';

function PostBar() {

  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [showFab, setShowFab] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        detail: { text ,files}
      })
    );

    setText('');
    setFiles([]);
    setIsModalOpen(false);
  };

  const resetForm = () => {
  setText('');
  setFiles([]);
  };

  const handleClose = () => {
  resetForm();
  setIsModalOpen(false);
  };


  return html`
    <div class="postbar">

      <div class="postbar-avatar">
        JN
      </div>

      <input
        class="postbar-input"
        placeholder="What's on your mind?"
        
        disabled
      />

      <button
        class="postbar-button"
        
        onClick=${() => setIsModalOpen(true)}
      >
        + Post
      </button>

    </div>
    
    ${showFab && html`
      <button
        class="postbar-fab"
        onClick=${() => setIsModalOpen(true)}
        aria-label="Create post"
      >
        +
      </button>
    `}
    
    <${Modal}
      isOpen=${isModalOpen}
      onClose=${handleClose}
      modalHeader="Create Post"
      onSubmit=${submitPost}
      submitLabel="Send"
      cancelLabel="Discard"
    >
       <!-- TEXTAREA LABEL -->
      <label class="modal-label">
        Description
      </label>

      <textarea
        class="modal-textarea"
        placeholder="What's on your mind?"
        value=${text}
        onInput=${(e) => setText(e.target.value)}
      />

      <!-- UPLOAD LABEL -->
      <label class="modal-label">
        Upload Media
      </label>

      <${MediaUpload} multiple value=${files} onChange=${setFiles} />
    </${Modal}>
    
  `;
}

export default function decorate(block) {
  
  render(html`<${PostBar} />`, block);
}