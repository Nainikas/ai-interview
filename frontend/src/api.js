const api = {
  get: async (path, opts={}) => {
    const silent = opts.silent === true;
    if (!silent) console.log(`→ GET ${path}`);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}${path}`);
      if (!silent) console.log(`← GET ${path} ${res.status}`);
      if (!res.ok) {
        const text = await res.text();
        if (!silent) console.error(`API GET ${path} failed:`, res.status, text);
        throw new Error(`API GET ${path} failed: ${res.status}`);
      }
      const data = await res.json();
      if (!silent) console.log(`← GET ${path} response:`, data);
      return data;
    } catch (err) {
      if (!silent) console.error("❌ API Error (GET):", err);
      return {};
    }
  },

  post: async (path, body, opts={}) => {
    const silent = opts.silent === true || path.includes("log-behavior");
    if (!silent) console.log(`→ POST ${path}`, body);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!silent) console.log(`← POST ${path} ${res.status}`);
      if (!res.ok) {
        const text = await res.text();
        if (!silent) console.error(`API POST ${path} failed:`, res.status, text);
        throw new Error(`API POST ${path} failed: ${res.status}`);
      }
      const data = await res.json();
      if (!silent) console.log(`← POST ${path} response:`, data);
      return data;
    } catch (err) {
      if (!silent) console.error("❌ API Error (POST):", err);
      return {};
    }
  },
};

export default api;
