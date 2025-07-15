// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

// Attach stored Basic-Auth on every request
api.interceptors.request.use((config) => {
  const auth = localStorage.getItem("ADMIN_AUTH");
  if (auth) {
    config.headers["Authorization"] = auth;
  }
  return config;
});

export default api;
