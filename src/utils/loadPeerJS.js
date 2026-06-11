/**
 * PeerJS CDN Loader
 * Loads PeerJS from unpkg CDN via a <script> tag.
 * Metro bundler never sees the module — no webrtc-adapter resolution errors.
 * Returns the global Peer class once loaded.
 */

const PEERJS_CDN = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';

let loadPromise = null;

export function loadPeerJS() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return Promise.reject(new Error('SSR'));

  // Already loaded
  if (window.Peer) return Promise.resolve(window.Peer);

  // Already loading
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PEERJS_CDN;
    script.async = true;
    script.onload  = () => resolve(window.Peer);
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load PeerJS from CDN'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
