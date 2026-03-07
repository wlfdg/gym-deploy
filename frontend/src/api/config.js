import axios from "axios";

const API = process.env.REACT_APP_API_URL || "https://gym-deploy-sul4.onrender.com";

// Axios instance with timeout + base URL
const api = axios.create({
  baseURL: API,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Simple in-memory cache for GET requests
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

api.interceptors.request.use((config) => {
  if (config.method === "get") {
    const key = config.baseURL + config.url + JSON.stringify(config.params || {});
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      config._cached = cached.data;
    }
    config._cacheKey = key;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.config.method === "get" && response.config._cacheKey) {
      cache.set(response.config._cacheKey, { data: response, ts: Date.now() });
    }
    return response;
  },
  (error) => {
    // Clear cache on errors so stale data doesn't persist
    cache.clear();
    return Promise.reject(error);
  }
);

// Call this after any mutation (POST/PUT/DELETE) to invalidate cache
export const clearCache = () => cache.clear();

export default API;
export { api };
