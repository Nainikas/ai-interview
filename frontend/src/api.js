// src/api.js
const BASE = import.meta.env.VITE_BACKEND_URL || "";

const api = {
  get: async (path, opts = {}) => {
    const headers = { ...(opts.headers || {}) };
    const token = localStorage.getItem("ADMIN_AUTH");
    if (token) headers["Authorization"] = token;
    try {
      const res = await fetch(`${BASE}${path}`, {
        method: "GET",
        headers,
        credentials: opts.credentials || "same-origin",
      });
      if (!res.ok) throw new Error(`API GET ${path} failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error("❌ API GET Error:", err);
      throw err;
    }
  },

  post: async (path, body, opts = {}) => {
    const headers = {};
    const isFormData = body instanceof FormData;
    if (!isFormData) headers["Content-Type"] = "application/json";
    const token = localStorage.getItem("ADMIN_AUTH");
    if (token) headers["Authorization"] = token;

    try {
      const res = await fetch(`${BASE}${path}`, {
        method: "POST",
        headers,
        credentials: opts.credentials || "same-origin",
        body: isFormData ? body : JSON.stringify(body),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API POST ${path} failed: ${errText}`);
      }
      return await res.json();
    } catch (err) {
      console.error("❌ API POST Error:", err);
      throw err;
    }
  },
};

export default api;
