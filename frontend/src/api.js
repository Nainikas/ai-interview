// src/api.js
const api = {
  get: async (path) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}${path}`);
      if (!res.ok) throw new Error(`API GET ${path} failed`);
      return await res.json();
    } catch (err) {
      console.error("❌ API GET Error:", err);
      return {};
    }
  },

  post: async (path, body) => {
    const isFormData = body instanceof FormData;
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}${path}`, {
        method: "POST",
        headers: isFormData ? {} : { "Content-Type": "application/json" },
        body: isFormData ? body : JSON.stringify(body),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API POST ${path} failed: ${errText}`);
      }
      return await res.json();
    } catch (err) {
      console.error("❌ API POST Error:", err);
      return {};
    }
  },
};

export default api;
