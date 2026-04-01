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
  const [errors, setErrors] = useState({
    title: '',
    text: '',
    files: [],
  });

  function validateMedia(files = []) {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'application/pdf',
  ];

  const errors = [];

  files.forEach((file) => {
    if (!allowedTypes.includes(file.type)) {
      errors.push(`${file.name} is not a supported format`);
    }
  });

  return errors;
}

  function validatePost({ title, text, files }) {
  const errors = {
    title: '',
    text: '',
    files: [],
  };

  if (!title || !title.trim()) {
    errors.title = 'Title is required';
  }

  if (!text || !text.trim()) {
    errors.text = 'Description is required';
  }

  const mediaErrors = validateMedia(files);
  errors.files = mediaErrors;

  return errors;
}

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

const resetForm = () => {
  setTitle('');
  setText('');
  setFiles([]);
  };

  // const submitPost = () => {

  //   // if (!text.trim()) return;

  //    const validationErrors = validatePost({ title, text, files });

  //   setErrors(validationErrors);

  //   const hasError =
  //     validationErrors.title ||
  //     validationErrors.text ||
  //     validationErrors.files.length > 0;

  //   if (hasError) return;

  //   window.dispatchEvent(
  //     new CustomEvent('create-post', {
  //       detail: { title,text ,files}
  //     })
  //   );

  //   // setText('');
  //   // setText('');
  //   // setFiles([]);
  //   resetForm();
  //   setErrors({ title: '', text: '', files: [] });
  //   setIsModalOpen(false);
  // };

  const BASEURL=`https://293924-adobeconnectmw-dev.adobeio-static.net/api/v1/web/adobe-connect/`
  
//   const submitPost = async () => {
//   const validationErrors = validatePost({ title, text, files });
//   setErrors(validationErrors);

//   if (validationErrors.title || validationErrors.text || validationErrors.files.length > 0) return;

//   const formData = new FormData();
//   formData.append('title', title);
//   formData.append('text', text);

//   files.forEach(file => {
//     formData.append('files', file);
//   });

//   try {
//     const res = await fetch(`${BASEURL}/user-blog`, {
//       method: 'POST',
//       body: formData
//     });

//     const newPost = await res.json();

//     // update UI
//     window.dispatchEvent(
//       new CustomEvent('post-created', { detail: newPost })
//     );

//     resetForm();
//     setIsModalOpen(false);
//   } catch (err) {
//     console.error('Post failed:', err);
//   }
// };

const submitPost = async () => {
  const validationErrors = validatePost({ title, text, files });
  setErrors(validationErrors);

  if (validationErrors.title || validationErrors.text || validationErrors.files.length > 0) return;

  try {
    //  STEP 1: upload all files
    const uploadedMedia = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${BASEURL}/file`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      // expected response example:
      // { url: "/uploads/xyz.jpg", type: "image" }

      uploadedMedia.push({
        url: data.url,
        type: file.type.startsWith('image')
          ? 'image'
          : file.type.startsWith('video')
          ? 'video'
          : 'pdf',
        name: file.name
      });
    }

    //  STEP 2: create post
    const postPayload = {
      title,
      text,
      media: uploadedMedia
    };

    const res = await fetch(`${BASEURL}/user-blog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postPayload)
    });

    const newPost = await res.json();

    //  update UI
    window.dispatchEvent(
      new CustomEvent('post-created', { detail: newPost })
    );

    resetForm();
    setIsModalOpen(false);

  } catch (err) {
    console.error('Post failed:', err);
  }
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
            onInput=${(e) => {
              setTitle(e.target.value);
              setErrors(prev => ({ ...prev, title: '' }));
            }}
          />
          ${errors.title && html`
            <div class="field-error">${errors.title}</div>
          `}

       <!-- TEXTAREA LABEL -->
        <label class="modal-label">
          ${descriptionLabel}
        </label>

      <textarea
        class="modal-textarea"
        placeholder="What's on your mind?"
        value=${text}
        onInput=${(e) => {
          setText(e.target.value);
          setErrors(prev => ({ ...prev, text: '' }));
        }}
      />
      ${errors.text && html`
        <div class="field-error">${errors.text}</div>
      `}

    ${isMediaEnabled && html`  
      <!-- UPLOAD LABEL -->
      <label class="modal-label">
        Upload Media
      </label>

      <${MediaUpload} multiple value=${files} onChange=${(newFiles) => {
    setFiles(newFiles);
    setErrors(prev => ({ ...prev, files: [] }));
  }} />
      ${errors.files.length > 0 && html`
        <div class="field-error">
          ${errors.files.map(err => html`<div>${err}</div>`)}
        </div>
      `}
    `}
    </${Modal}>
    
  `;
}

export default function decorate(block) {

  const config = getConfig(block);
  block.innerHTML = '';
  
  render(html`<${PostBar} config=${config} />`, block);
}