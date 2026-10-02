/* ===== Optional Server Logging (Round Stats) ===== */
(function (global) {
  "use strict";

  const STORAGE_DEVICE_KEY = "mp_device_id_v1";
  const APP_ID = "math-practice-p34";
  const APP_VERSION = "1.0.0";

  function getOrCreateDeviceId() {
    try {
      let id = localStorage.getItem(STORAGE_DEVICE_KEY);
      if (!id) {
        id = randomId();
        localStorage.setItem(STORAGE_DEVICE_KEY, id);
      }
      return id;
    } catch {
      return randomId();
    }
  }

  function randomId() {
    const arr = crypto?.getRandomValues ? crypto.getRandomValues(new Uint8Array(16)) : Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
    return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function nowIso() {
    try {
      return new Date().toISOString();
    } catch {
      return "" + Date.now();
    }
  }

  function baseEnvelope(eventType) {
    const ua = (navigator && navigator.userAgent) || "";
    return {
      appId: APP_ID,
      appVersion: APP_VERSION,
      eventType,
      ts: nowIso(),
      deviceId: getOrCreateDeviceId(),
      ua: ua.slice(0, 160),
      // page info for multi-site hosting paths
      location: (typeof location !== "undefined" && location.href) ? location.href : "",
      referrer: (typeof document !== "undefined" && document.referrer) ? document.referrer : "",
    };
  }

  function postEnvelope(envelope) {
    const url = global.STATS_ENDPOINT;
    if (!url) return; // disabled
    try {
      const body = JSON.stringify(envelope);
      const auth = (global.STATS_AUTH && String(global.STATS_AUTH).trim()) || null;
      if (navigator && typeof navigator.sendBeacon === "function") {
        const blob = new Blob([body], { type: "application/json" });
        // sendBeacon returns boolean but we don't need to handle synchronously
        navigator.sendBeacon(url, blob);
        return;
      }
      const headers = { "Content-Type": "application/json" };
      if (auth) headers["Authorization"] = `Bearer ${auth}`;
      // keepalive lets the request finish even when navigating away
      fetch(url, { method: "POST", headers, body, keepalive: true }).catch(() => {});
    } catch {
      // swallow errors — logging must never break gameplay
    }
  }

  const Stats = {
    logRoundStart(meta) {
      // meta: { mode, grade, difficulty, timed }
      const env = baseEnvelope("round_start");
      env.data = {
        mode: meta?.mode || null,
        grade: meta?.grade || null,
        difficulty: meta?.difficulty || null,
        timed: !!meta?.timed,
      };
      postEnvelope(env);
    },
    logRoundEnd(meta) {
      // meta: { mode, grade, difficulty, score, correct, wrong, bestStreak, total, accuracy, starsEarned, totalPoints, totalStars }
      const env = baseEnvelope("round_end");
      env.data = {
        mode: meta?.mode || null,
        grade: meta?.grade || null,
        difficulty: meta?.difficulty || null,
        score: meta?.score ?? null,
        correct: meta?.correct ?? null,
        wrong: meta?.wrong ?? null,
        bestStreak: meta?.bestStreak ?? null,
        total: meta?.total ?? null,
        accuracy: meta?.accuracy ?? null,
        starsEarned: meta?.starsEarned ?? null,
        totals: {
          totalPoints: meta?.totalPoints ?? null,
          totalStars: meta?.totalStars ?? null,
        },
      };
      postEnvelope(env);
    },
    // no-op guard if disabled
  };

  global.Stats = Stats;
})(typeof window !== "undefined" ? window : globalThis);

