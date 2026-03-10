import axios from "axios";

const API = process.env.REACT_APP_API_URL || "https://gym-deploy-sul4.onrender.com";

// Cache layer to avoid redundant requests
const cache = {};
const CACHE_TTL = 30000; // 30s

const api = axios.create({
  baseURL: API,
  timeout: 60000, // 60s — handles Render free-tier cold starts (can take 30-50s)
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const u = localStorage.getItem("gym_admin") || "";
  const r = localStorage.getItem("gym_role")  || "";
  const s = localStorage.getItem("gym_shift") || "";
  if (u) config.headers["X-Admin-User"]  = u;
  if (r) config.headers["X-Admin-Role"]  = r;
  if (s) config.headers["X-Shift-Id"]    = s;
  return config;
});

// Simple in-memory cache helpers
export function getCached(key) {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { delete cache[key]; return null; }
  return entry.data;
}
export function setCache(key, data) { cache[key] = { data, ts: Date.now() }; }
export function clearCache(prefix) {
  if (!prefix) { Object.keys(cache).forEach(k => delete cache[k]); return; }
  Object.keys(cache).filter(k => k.startsWith(prefix)).forEach(k => delete cache[k]);
}

export function storeSession(username, role, shiftId) {
  localStorage.setItem("gym_admin", username);
  localStorage.setItem("gym_role",  role);
  if (shiftId) localStorage.setItem("gym_shift", String(shiftId));
}

export function getShiftId() {
  const v = localStorage.getItem("gym_shift");
  return v ? Number(v) : null;
}

export async function logoutAdmin() {
  const username = localStorage.getItem("gym_admin");
  const shiftId  = getShiftId();
  try { await api.post("/logout", { username, shift_id: shiftId }); } catch {}
  localStorage.removeItem("gym_admin");
  localStorage.removeItem("gym_role");
  localStorage.removeItem("gym_shift");
  clearCache();
}

export default API;
export { api };
