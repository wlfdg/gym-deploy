// src/api/config.js
// During local dev: uses localhost
// On Vercel: uses REACT_APP_API_URL environment variable
const API = process.env.REACT_APP_API_URL || "// config.js (fixed)
export const BASE_URL = process.env.REACT_APP_API_URL || "https://gym-deploy-sul4.onrender.com";
export default API;
