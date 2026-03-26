import { html, render } from '../../vendor/htm-preact.js';
import { useState,useEffect } from '../../vendor/preact-hooks.js';
import Modal from '../../helper/modal.js';
import MediaUpload from '../../helper/media-upload.js';


function getConfig(block) {
  const config = {};

  [...block.children].forEach((row) => {
    const key = row.children[0]?.textContent?.trim();
    const value = row.children[1]?.textContent?.trim();

    if (key) {
      config[key] = value;
    }
  });

  return config;
  
}

function PostBar({config={}}) {

  const {
    postInputText="What's on your mind?",
    postButtonLabel="POST",
    modalHeader = 'Create Post',
    titleLabel = 'Title',
    descriptionLabel = 'Description',
    submitLabel = 'Send',
    cancelLabel = 'Discard',
    showMediaUpload = 'true',
  } = config;

  const isMediaEnabled = showMediaUpload !== 'false';

  const [title, setTitle] = useState('');
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
    setText('');
    setFiles([]);
    setIsModalOpen(false);
  };

  const resetForm = () => {
  setText('');
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
        placeholder=${postInputText}
        
        disabled
      />

      <button
        class="postbar-button"
        
        onClick=${() => setIsModalOpen(true)}
      >
        ${postButtonLabel}
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
      modalHeader=${modalHeader}
      onSubmit=${submitPost}
      submitLabel=${submitLabel}
      cancelLabel=${cancelLabel}
    >

        <!-- TITLE LABEL -->
          <label class="modal-label">
            ${titleLabel}
          </label>

          <input
            class="modal-input"
            placeholder="Enter title"
            value=${title}
            onInput=${(e) => setTitle(e.target.value)}
          />
       <!-- TEXTAREA LABEL -->
      <label class="modal-label">
        ${descriptionLabel}
      </label>

      <textarea
        class="modal-textarea"
        placeholder="What's on your mind?"
        value=${text}
        onInput=${(e) => setText(e.target.value)}
      />

    ${isMediaEnabled && html`  
      <!-- UPLOAD LABEL -->
      <label class="modal-label">
        Upload Media
      </label>

      <${MediaUpload} multiple value=${files} onChange=${setFiles} />
    `}
    </${Modal}>
    
  `;
}

export default function decorate(block) {

  const config = getConfig(block);
  block.innerHTML = '';
  
  render(html`<${PostBar} config=${config} />`, block);
}