import { html, render } from '../../vendor/htm-preact.js';
import { useState,useEffect } from '../../vendor/preact-hooks.js';
import  Modal  from '../../helper/modal.js';

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

  const handleFileChange = (e) => {
  const selected = Array.from(e.target.files);
  setFiles(selected);
};
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

  const handleDrop = (e) => {
  e.preventDefault();
  e.stopPropagation();

  const droppedFiles = Array.from(e.dataTransfer.files);
  setFiles(prev => [...prev, ...droppedFiles]);
};

const handleDragOver = (e) => {
  e.preventDefault();
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

      <!-- HIDDEN INPUT -->
      <input
        id="file-upload"
        type="file"
        multiple
        accept="image/*,video/*,application/pdf"
        class="modal-file-hidden"
        onChange=${handleFileChange}
      />

     <div
        class="modal-dropzone"
        onDrop=${handleDrop}
        onDragOver=${handleDragOver}
      >
        <p>Drag & drop files here</p>

        <label for="file-upload" class="modal-upload-btn">
          Or Upload
        </label>
      </div>

      <!-- PREVIEW -->
      ${files.length > 0 && html`
        <div class="modal-preview">
          ${files.map(file => {
            const url = URL.createObjectURL(file);

            if (file.type.startsWith('image/')) {
              return html`<img src=${url} class="modal-preview-img" />`;
            }

            if (file.type.startsWith('video/')) {
              return html`
                <video src=${url} class="modal-preview-video" controls />
              `;
            }

            return html`
              <div class="modal-preview-file">
                📄 ${file.name}
              </div>
            `;
          })}
        </div>
      `}
    </${Modal}>
    
  `;
}

export default function decorate(block) {
  
  render(html`<${PostBar} />`, block);
}