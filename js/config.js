// Configure server logging endpoint here. Leave blank to disable.
// Example: window.STATS_ENDPOINT = "https://your-worker.example.com/ingest";
// Optional bearer token (if your server expects Authorization: Bearer <token>):
// window.STATS_AUTH = "your-public-or-short-lived-token";
window.STATS_ENDPOINT = "";
// window.STATS_AUTH = "";

// Optional Cloud Progress Sync API (GET/PUT) — leave blank to disable
// Expected endpoints (CORS enabled):
//   GET  {BASE}/progress/{playerId} -> 200 {progressJson} or 404
//   PUT  {BASE}/progress/{playerId} body: {progressJson} -> 200/204
window.PROGRESS_BASE_URL = "";
// window.PROGRESS_AUTH = "";

