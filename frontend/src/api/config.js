import axios from "axios";

const API = process.env.REACT_APP_API_URL || "https://gym-deploy-sul4.onrender.com";

const api = axios.create({
  baseURL: API,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

const cache = new Map();
const CACHE_TTL = 30000;

api.interceptors.request.use((config) => {
  const adminUser = localStorage.getItem("gym_admin") || "unknown";
  config.headers["X-Admin-User"] = adminUser;
  if (config.method === "get") {
    const key = config.baseURL + config.url + JSON.stringify(config.params || {});
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) config._cached = cached.data;
    config._cacheKey = key;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.config.method === "get" && response.config._cacheKey)
      cache.set(response.config._cacheKey, { data: response, ts: Date.now() });
    return response;
  },
  (error) => { cache.clear(); return Promise.reject(error); }
);

export const clearCache = () => cache.clear();
export const isSuperAdmin = () => localStorage.getItem("gym_role") === "superadmin";
export const getShiftId = () => localStorage.getItem("gym_shift_id");

// Called after successful login — stores shift_id returned from backend
export const storeSession = (username, role, shiftId) => {
  localStorage.setItem("gym_admin",    username);
  localStorage.setItem("gym_role",     role);
  if (shiftId) localStorage.setItem("gym_shift_id", String(shiftId));
};

// Called on logout — sends shift_id so backend can calculate shift revenue
export const logoutAdmin = async () => {
  const username = localStorage.getItem("gym_admin");
  const shiftId  = localStorage.getItem("gym_shift_id");
  try {
    if (username) {
      const res = await api.post("/logout", { username, shift_id: shiftId ? parseInt(shiftId) : null });
      const rev = res.data?.shift_revenue;
      if (rev !== undefined) {
        // Show shift summary alert before clearing
        alert(`Shift ended.\nTotal walk-in revenue collected this shift: P${Number(rev).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`);
      }
    }
  } catch {}
  localStorage.removeItem("gym_admin");
  localStorage.removeItem("gym_role");
  localStorage.removeItem("gym_shift_id");
};

export default API;
export { api };
