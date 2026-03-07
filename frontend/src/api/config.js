// src/api/config.js
// During local dev: uses localhost
// On Vercel: uses REACT_APP_API_URL environment variable
const API = process.env.REACT_APP_API_URL || "http://localhost:5000";
export default API;
