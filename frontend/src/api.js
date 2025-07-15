// src/api.js

const BASE = import.meta.env.VITE_BACKEND_URL;

async function request(path, opts = {}) {
  const headers = opts.headers || {};
  // attach stored Basic-Auth if present
  const auth = localStorage.getItem("ADMIN_AUTH");
  if (auth) headers["Authorization"] = auth;

  const res = await fetch(BASE + path, {
    ...opts,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${text}`);
  }
  // if no content, return empty object
  if (res.status === 204) return {};
  return res.json();
}

export default {
  get(path) {
    return request(path, { method: "GET" });
  },
  post(path, body) {
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
