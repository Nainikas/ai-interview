// src/api.js
const BASE = import.meta.env.VITE_BACKEND_URL || "";

export default {
  get: async (path, opts = {}) => {
    // Safely default headers to an object
    const headers = { ...(opts.headers || {}) };
    // Inject our Basic‐Auth token if present
    const token = localStorage.getItem("ADMIN_AUTH");
    if (token) headers["Authorization"] = token;

    const res = await fetch(`${BASE}${path}`, {
      method: "GET",
      headers,
      // preserve cross‐site cookie behavior as needed
      credentials: opts.credentials || "same-origin",
      // include any other fetch options
      ...opts
    });

    if (!res.ok) {
      throw new Error(`API GET ${path} failed: ${res.status}`);
    }
    return await res.json();
  },

  post: async (path, body, opts = {}) => {
    // Safely default headers
    const headers = { ...(opts.headers || {}) };
    const isFormData = body instanceof FormData;
    if (!isFormData) headers["Content-Type"] = "application/json";
    // Inject auth token
    const token = localStorage.getItem("ADMIN_AUTH");
    if (token) headers["Authorization"] = token;

    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers,
      credentials: opts.credentials || "same-origin",
      body: isFormData ? body : JSON.stringify(body),
      ...opts
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API POST ${path} failed: ${res.status} ${text}`);
    }
    return await res.json();
  },
};
