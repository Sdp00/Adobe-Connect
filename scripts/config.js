/**
 * get site config
 */
export default function getConfig() {
  if (window.adobeconnect && window.adobeconnect.config) {
    return window.adobeconnect.config;
  }

  const HOSTS = ['main--adobe-connect--sdp00.aem.page', 'main--adobe-connect--sdp00.aem.live'];

  const currentHost = window.location.hostname;
  const isProd = HOSTS.includes(currentHost);
  const ims = {
    client_id: 'adobeconnectpoc',
    environment: isProd ? 'prod' : 'stg1',
  };

  window.adobeconnect = window.adobeconnect || {};
  window.adobeconnect.config = {
    ims,
    adobeIoEndpoint: `https://293924-adobeconnectmw${!isProd ? '-dev' : ''}.adobeio-static.net/api/v1/web/adobe-connect`,
  };
  return window.adobeconnect.config;
}
