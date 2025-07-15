// src/components/AdminLogin.jsx
import React, { useState } from "react";

export default function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState(null);
  const BACKEND = import.meta.env.VITE_BACKEND_URL;

  async function handleSubmit(e) {
    e.preventDefault();
    const authHeader = "Basic " + btoa(`${username}:${password}`);

    try {
      const res = await fetch(`${BACKEND}/admin/interview-sessions`, {
        headers: { Authorization: authHeader },
      });
      if (!res.ok) throw new Error(`${res.status}`);

      localStorage.setItem("ADMIN_AUTH", authHeader);
      onLogin(authHeader);
    } catch {
      setError("Invalid username or password");
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h2 style={styles.title}>Admin Login</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button style={styles.button} type="submit">Log In</button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </form>
      </div>
    </div>
  );
}

const styles = {
  wrapper:   {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "#f5f5f5",
  },
  container: {
    padding: "2rem",
    width: "320px",
    background: "#fff",
    borderRadius: 10,
    boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  title:     { marginBottom: "1rem", fontSize: "1.5rem", color: "#222" },
  form:      { display: "flex", flexDirection: "column", gap: "1rem" },
  input:     { padding: "0.75rem", fontSize: "1rem", borderRadius: 4, border: "1px solid #ccc" },
  button:    { padding: "0.75rem", fontSize: "1rem", borderRadius: 4, background: "#222", color: "#fff", cursor: "pointer" },
};
