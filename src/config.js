// frontend/src/config.js
// Config chargée au runtime (pas au build time)
// Utilise la variable globale définie dans index.html

export const API_URL = window.RUNTIME_API_URL || 'https://tce-serv-rbe-serveurs.up.railway.app';

console.log('[CONFIG] API_URL:', API_URL);
console.log('[CONFIG] Hostname:', window.location.hostname);
