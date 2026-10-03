/* ===== Optional Cloud Progress Sync (GET/PUT) =====
  Configure in js/config.js:
    window.PROGRESS_BASE_URL = "https://your-endpoint.example.com";
    // Expected endpoints (CORS enabled):
    //   GET  {BASE}/progress/{playerId} -> 200 {progressJson} or 404
    //   PUT  {BASE}/progress/{playerId} body: {progressJson} -> 200/204
    // Optional: window.PROGRESS_AUTH = "BearerToken"
*/
(function (global) {
  "use strict";

  const CLOUD_ID_KEY = "mp_cloud_id_v1";

  function isEnabled() {
    return typeof global.PROGRESS_BASE_URL === "string" && global.PROGRESS_BASE_URL.trim() !== "";
  }

  function getUrl(id) {
    const base = String(global.PROGRESS_BASE_URL || "").replace(/\/+$/, "");
    return `${base}/progress/${encodeURIComponent(id)}`;
  }

  function getQueryParam(name) {
    try {
      const u = new URL(global.location?.href || "");
      return u.searchParams.get(name);
    } catch {
      return null;
    }
  }

  function getOrCreatePlayerId() {
    // Allow override via ?pid=XXXX to link a new device
    const fromUrl = getQueryParam("pid");
    if (fromUrl && fromUrl.length >= 6) {
      try { localStorage.setItem(CLOUD_ID_KEY, fromUrl); } catch {}
      return fromUrl;
    }
    try {
      let id = localStorage.getItem(CLOUD_ID_KEY);
      if (!id) {
        id = generateId();
        localStorage.setItem(CLOUD_ID_KEY, id);
      }
      return id;
    } catch {
      return generateId();
    }
  }

  function generateId() {
    const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 10; i++) s += alpha[Math.floor(Math.random() * alpha.length)];
    return s;
  }

  async function fetchProgress(playerId) {
    if (!isEnabled()) return null;
    const url = getUrl(playerId);
    const headers = {};
    if (global.PROGRESS_AUTH) headers["Authorization"] = `Bearer ${global.PROGRESS_AUTH}`;
    try {
      const res = await fetch(url, { headers, method: "GET", credentials: "omit", cache: "no-store" });
      if (res.status === 404) return null;
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async function pushProgress(playerId, progress) {
    if (!isEnabled() || !progress) return;
    const url = getUrl(playerId);
    const headers = { "Content-Type": "application/json" };
    if (global.PROGRESS_AUTH) headers["Authorization"] = `Bearer ${global.PROGRESS_AUTH}`;
    try {
      const body = JSON.stringify(progress);
      if (navigator && typeof navigator.sendBeacon === "function") {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(url, blob);
        return;
      }
      await fetch(url, { method: "PUT", headers, body, keepalive: true, credentials: "omit" });
    } catch {
      // ignore failures
    }
  }

  global.ProgressSync = {
    isEnabled,
    getOrCreatePlayerId,
    fetch: fetchProgress,
    push: pushProgress,
  };
})(typeof window !== "undefined" ? window : globalThis);

