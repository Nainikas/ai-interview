// src/api.js
const BASE = import.meta.env.VITE_BACKEND_URL;

// low‐level request helper
async function request(path, opts = {}) {
  const headers = opts.headers || {};

  // attach stored Basic‑Auth if present
  const auth = localStorage.getItem("ADMIN_AUTH");
  if (auth) {
    headers["Authorization"] = auth;
  }

  const response = await fetch(BASE + path, {
    ...opts,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${text}`);
  }
  // no content
  if (response.status === 204) return {};
  return response.json();
}

export default {
  get(path) {
    return request(path, { method: "GET" });
  },
  post(path, body) {
    // if this is a FormData upload, let the browser set the Content-Type
    if (body instanceof FormData) {
      return request(path, { method: "POST", body });
    }
    // otherwise assume JSON
    return request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },
  put(path, body) {
    return request(path, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },
  delete(path) {
    return request(path, { method: "DELETE" });
  },
};
