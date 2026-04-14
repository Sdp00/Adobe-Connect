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

export async function syncAndGetEmployee(baseUrl) {
  if (cachedEmployee) return cachedEmployee;

  const token = window.adobeIMS.getAccessToken();
  const profile = await window.adobeIMS.getProfile();

  const res = await fetch(`${baseUrl}/employee`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-gw-ims-org-id': '8B2628265E74EE890A495EDA@AdobeOrg',
    },
    body: JSON.stringify({
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
    }),
  });

  if (!res.ok) throw new Error('Failed to sync employee');

  cachedEmployee = await res.json();
  return cachedEmployee;
}

/**
 * Returns the cached employee or fetches it if not yet loaded.
 * @returns {Object|null}
 */
export function getCachedEmployee() {
  return cachedEmployee;
}
