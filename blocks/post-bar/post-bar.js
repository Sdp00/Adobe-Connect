import { html, render } from '../../vendor/htm-preact.js';
import { useState,useEffect } from '../../vendor/preact-hooks.js';
import Modal from '../../helper/modal.js';
import MediaUpload from '../../helper/media-upload.js';
// import { isSignedInUser } from '../../scripts/auth.js';
import { isSignedInUser, syncAndGetEmployee, getCachedEmployee, getCurrentUser } from '../../scripts/auth.js';
import getConfig from '../../scripts/config.js';
import getUserInfo from '../../scripts/user.js';
// import {getConfig as authConfig} from '../../scripts/config.js';


function getBlockConfig(block) {
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

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  //   // window.dispatchEvent(
  //   //   new CustomEvent('create-post', {
  //   //     detail: { title,text ,files}
  //   //   })
  //   // );

  //   //  Convert files → backend media format
  //   const media = files.map((file, index) => {
  //     let type = 'image';

  //     if (file.type.startsWith('video/')) type = 'video';
  //     else if (file.type === 'application/pdf') type = 'pdf';

  //     return {
  //       _id: `media_${Date.now()}_${index}`,
  //       type,
  //       url: URL.createObjectURL(file),
  //       name: file.name,
  //       stats: {
  //         likes: 0,
  //         commentsCount: 0
  //       },
  //       comments: []
  //     };
  //   });

  //   // Create backend-style post
  //   const newPost = {
  //     _id: `post_${Date.now()}`,
  //     author: {
  //       avatar: "avatar.jpg",
  //       name: "You",
  //       role: "Employee",
  //       userId: "current_user"
  //     },
  //     createdAt: new Date().toISOString(),
  //     updatedAt: new Date().toISOString(),
  //     content: {
  //       title,
  //       text,
  //       media
  //     }
  //   };

  //   //  Dispatch
  //   window.dispatchEvent(
  //     new CustomEvent('create-post', {
  //       detail: newPost
  //     })
  //   );

  //   // setText('');
  //   // setText('');
  //   // setFiles([]);
  //   resetForm();
  //   setErrors({ title: '', text: '', files: [] });
  //   setIsModalOpen(false);
  // };

  const { adobeIoEndpoint } = getConfig();
  const baseUrl = adobeIoEndpoint || '';
  // const profile = window.adobeIMS.getProfile();

  

const submitPost = async () => {
  const validationErrors = validatePost({ title, text, files });
  setErrors(validationErrors);

  const hasError =
    validationErrors.title ||
    validationErrors.text ||
    validationErrors.files.length > 0;

  if (hasError) return;

  setIsSubmitting(true);

  try {
    const token = window.adobeIMS.getAccessToken();
    const profile = window.adobeIMS.getProfile();

    console.log("TOKEN:", token);
    console.log("PROFILE:", profile);


    // const userId = profile?.userId || profile?.sub;
    const users = await getCurrentUser(baseUrl);
    // const token = window.adobeIMS.getAccessToken();
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

    
    // const userId = currentUser._id;
    // const employee = getCachedEmployee();
    // if (!employee?._id) throw new Error('Employee not loaded');
    // if (!employee) {
    //   employee = await syncAndGetEmployee(baseUrl); // fallback
    // }

    // if (!employee?._id) {
    //   throw new Error('Employee not available');
    // }

    const formData = new FormData();

    // formData.append('userId', userId); 
    formData.append('userId', employee._id);
    formData.append('createdAt', new Date().toISOString());
    formData.append('title', title);
    formData.append('description', text);

    //  field name is "files"
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch(
      `${baseUrl}/feed`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-gw-ims-org-id': '8B2628265E74EE890A495EDA@AdobeOrg'
        },
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error('Failed to create post');
    }

    const data = await response.json();
    console.log('Post created:', data);

    window.dispatchEvent(
      new CustomEvent('post-created-success', {
        detail: data
      })
    );

    resetForm();
    setIsModalOpen(false);

  } catch (err) {
    console.error(err);
  }finally {
    setIsSubmitting(false); // STOP LOADING
  }
};



  

  const handleClose = () => {
  resetForm();
  setIsModalOpen(false);
  };

//   async function syncUserToEmployee(baseUrl) {
//   const token = window.adobeIMS.getAccessToken();
//   const profile = window.adobeIMS.getProfile();

//   // avoid duplicate calls
//   // const existing = localStorage.getItem('user');

//   // if (existing) return JSON.parse(existing);

//   const res = await fetch(`${baseUrl}/employee`, {
//     method: 'POST',
//     headers: {
//       Authorization: `Bearer ${token}`,
//       'Content-Type': 'application/json',
//       'x-gw-ims-org-id': '8B2628265E74EE890A495EDA@AdobeOrg'
//     },
//     body: JSON.stringify({
//       // imsId: profile.userId,
//       email: profile.email,
//       first_name: profile.first_name,
//       last_name: profile.last_name
//     })
//   });

//   if (!res.ok) throw new Error('Failed to sync user');

//   const user = await res.json();

//   // store DB user
//   // localStorage.setItem('user', JSON.stringify(user));

//   return user;
// }

  const handleOpenPostComposer = async () => {
    const isSignedIn = await isSignedInUser();
    if (!isSignedIn) {
      window?.adobeIMS?.signIn();
      return;
    }
    //  await syncUserToEmployee(baseUrl);
    try {
    await syncAndGetEmployee(baseUrl); // syncs + caches employee on first call
  } catch (err) {
    console.error('Failed to sync employee:', err);
    return;
  }
    setIsModalOpen(true);
  };

  // const getProfile = () => {
  //   return window.adobeIMS?.getProfile?.() || null;
  // };

  // const profile = getProfile();

  // const initials = profile?.name
  //   ? profile.name
  //       .split(' ')
  //       .map((n) => n[0])
  //       .join('')
  //       .slice(0, 2)
  //       .toUpperCase()
  //   : 'NA';

  // const initials='NA'
  const { name, initials } = getUserInfo();

  

  return html`
    <div class="postbar">

      <div class="postbar-avatar">
        ${initials}
      </div>

      <input
        class="postbar-input"
        placeholder=${postInputText}
        
        disabled
      />

      <button
        class="postbar-button"
        
        onClick=${handleOpenPostComposer}
      >
        ${postButtonLabel}
      </button>

    </div>
    
    ${showFab && html`
      <button
        class="postbar-fab"
        onClick=${handleOpenPostComposer}
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
      isSubmitting=${isSubmitting}
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

  const config = getBlockConfig(block);
  block.innerHTML = '';
  
  render(html`<${PostBar} config=${config} />`, block);
}