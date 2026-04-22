// eslint-disable-next-line import/no-cycle, max-classes-per-file
import { loadIms } from './scripts.js';

/**
 * Checks if the user is signed in.
 * @returns {Promise<boolean>} - True if the user is signed in, otherwise false.
 */
export async function isSignedInUser() {
  try {
    await loadIms();
    return window?.adobeIMS?.isSignedInUser() || false;
  } catch (error) {
    console.error('Error checking sign-in status:', error);
    return false;
  }
}

/**
 * Fetches user data from Adobe IMS.
 * @returns {Promise<Object>} - The user data, including image, id, and name.
 */
export async function getUserData() {
  try {
    await loadIms();
    const profile = await window.adobeIMS.getProfile();

    return {
      id: profile.userId,
      name: profile.displayName,
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return {
      id: null,
      name: 'Unknown',
    };
  }
}

/**
 * Syncs the IMS user to /employee on the backend, caches result in memory.
 * @param {string} baseUrl - The API base URL.
 * @returns {Promise<Object>} - The employee record including _id.
 */
let cachedEmployee = null;

// export async function syncAndGetEmployee(baseUrl) {
//   if (cachedEmployee) return cachedEmployee;

//   const token = window.adobeIMS.getAccessToken();
//   // const profile = await window.adobeIMS.getProfile();

//   let profile;

//   try {
//     profile = await window.adobeIMS.getProfile();
//     // console.log('IMS PROFILE:', profile);
//   } catch (err) {
//     console.error('IMS PROFILE FAILED:', err);
//   }

//   // console.log('IMS PROFILE:', profile);

//   const formData = new FormData();
//   formData.append('email', profile.email);
//   formData.append('first_name', profile.first_name);
//   formData.append('last_name', profile.last_name);

//   // for (const [key, value] of formData.entries()) {
//   //   console.log('EMPLOYEE PAYLOAD:', key, value);
//   // }

//   // Array.from(formData.entries()).forEach(([key, value]) => {
//   //   console.log('EMPLOYEE PAYLOAD:', key, value);
//   // });

//   const res = await fetch(`${baseUrl}/employee`, {
//     method: 'POST',
//     headers: {
//       Authorization: `Bearer ${token}`,
//       // 'Content-Type': 'application/json',
//       'x-gw-ims-org-id': '8B2628265E74EE890A495EDA@AdobeOrg',
//     },
//     body: formData,
//     // body: JSON.stringify({
//     //   email: profile.email,
//     //   first_name: profile.first_name,
//     //   last_name: profile.last_name,
//     // }),
//   });

//   // if (!res.ok) throw new Error('Failed to sync employee');

//   // cachedEmployee = await res.json();
//   // return cachedEmployee;
//   if (!res.ok) {
//     const err = await res.text();
//     // console.error('EMPLOYEE API ERROR:', err);
//     throw new Error(err);
//   }

//   const data = await res.json();

//   // console.log('EMPLOYEE RESPONSE:', data);

//   cachedEmployee = data;
//   return cachedEmployee;
// }

export async function syncAndGetEmployee(baseUrl) {
  if (cachedEmployee) return cachedEmployee;

  await loadIms();

  const tokenObj = window.adobeIMS.getAccessToken();
  const accessToken = tokenObj?.token;
  const sid = tokenObj?.sid;

  const res = await fetch(`${baseUrl}/employee`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'x-gw-ims-org-id': '8B2628265E74EE890A495EDA@AdobeOrg',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch employees');
  }

  const employees = await res.json();

  //  Check if user exists
  const existing = employees.find((emp) => emp.imsId === sid);

  if (existing) {
    console.log('EMPLOYEE FOUND:', existing);
    cachedEmployee = existing;
    return existing; //  STOP → do not POST
  }

  let profile = null;
  let payload = {};

  // STEP 1: Try getProfile()
  try {
    profile = await window.adobeIMS.getProfile();
    console.log('IMS PROFILE:', profile);
  } catch (err) {
    console.warn('getProfile failed, using token fallback');
  }

  // STEP 2: Build payload
  if (profile && profile.email) {
    payload = {
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      imsId: sid, //  IMPORTANT
    };
  } else {
    //  fallback → token
    // const decoded = parseJwt(accessToken);

    // console.log('TOKEN DECODED:', decoded);

    payload = {
      email: 'akars@adobe.com',
      first_name: tokenObj?.first_name || '',
      last_name: tokenObj?.last_name || '',
      imsId: sid, // fallback chain
    };
  }

  // HARD GUARD
  if (!payload.imsId) {
    throw new Error('No valid IMS identity found');
  }

  // STEP 3: API CALL
  const formData = new FormData();
  formData.append('email', payload.email);
  formData.append('first_name', payload.first_name);
  formData.append('last_name', payload.last_name);
  formData.append('imsId', payload.imsId);

  const response = await fetch(`${baseUrl}/employee`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'x-gw-ims-org-id': '8B2628265E74EE890A495EDA@AdobeOrg',
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await res.text();
    throw new Error(err);
  }

  const data = await response.json();

  console.log('EMPLOYEE SAVED:', data);

  cachedEmployee = data;
  return cachedEmployee;
}

/**
 * Returns the cached employee or fetches it if not yet loaded.
 * @returns {Object|null}
 */
export function getCachedEmployee() {
  return cachedEmployee;
}

export async function getCurrentUser(baseUrl) {
  const token = window.adobeIMS.getAccessToken();

  const res = await fetch(`${baseUrl}/employee/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'x-gw-ims-org-id': '8B2628265E74EE890A495EDA@AdobeOrg',
    },
  });

  if (!res.ok) throw new Error('Failed to fetch current user');

  return res.json();
}

export async function updateEmployee(data, baseUrl) {
  const user = await getCurrentUser(); // you already use this elsewhere

  // eslint-disable-next-line no-underscore-dangle
  const employeeId = user?._id;

  if (!employeeId) {
    throw new Error('No employee ID found');
  }

  const payload = { ...data };
  // eslint-disable-next-line no-underscore-dangle
  delete payload._id; // prevent MongoDB error

  const response = await fetch(`${baseUrl}/employee/${employeeId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to update employee: ${text}`);
  }

  return response.json();
}
