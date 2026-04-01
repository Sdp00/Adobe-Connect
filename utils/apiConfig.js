export default function getBackendBaseUrl() {
  const envUrl = window?.ENV?.BACKEND_URL
    || import.meta?.env?.VITE_API_URL;
    // process?.env?.API_URL;

  return envUrl && envUrl.trim() !== ''
    ? envUrl.replace(/\/$/, '')
    : 'http://localhost:3000';
}
