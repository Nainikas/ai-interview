// src/api.js

const api = {
  get: async (path) => {
    console.log(`→ GET ${path}`);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}${path}`);
      console.log(`← GET ${path} ${res.status}`);
      if (!res.ok) {
        const text = await res.text();
        console.error(`API ${path} GET failed:`, res.status, text);
        throw new Error(`API GET ${path} failed: ${res.status}`);
      }
      const data = await res.json();
      console.log(`← GET ${path} response:`, data);
      return data;
    } catch (err) {
      console.error("❌ API Error (GET):", err);
      return {};
    }
  },

  post: async (path, body) => {
    console.log(`→ POST ${path}`, body);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      console.log(`← POST ${path} ${res.status}`);
      if (!res.ok) {
        const text = await res.text();
        console.error(`API ${path} POST failed:`, res.status, text);
        throw new Error(`API POST ${path} failed: ${res.status}`);
      }
      const data = await res.json();
      console.log(`← POST ${path} response:`, data);
      return data;
    } catch (err) {
      console.error("❌ API Error (POST):", err);
      return {};
    }
  },
};

export default api;
