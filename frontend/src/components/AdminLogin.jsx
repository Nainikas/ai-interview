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
      // Try fetching the protected sessions endpoint to verify credentials
      const res = await fetch(`${BACKEND}/admin/interview-sessions`, {
        headers: { Authorization: authHeader },
      });
      if (!res.ok) {
        throw new Error(`${res.status}`);
      }

      // Success → persist the header and notify App
      localStorage.setItem("ADMIN_AUTH", authHeader);
      onLogin(authHeader);
    } catch {
      setError("Invalid username or password");
    }
  }

  return (
    <div style={styles.container}>
      <h2>Admin Login</h2>
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
        <button style={styles.button} type="submit">
          Log In
        </button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
}

const styles = {
  container: { padding: "2rem", maxWidth: 320, margin: "3rem auto", textAlign: "center" },
  form:      { display: "flex", flexDirection: "column", gap: "1rem" },
  input:     { padding: "0.75rem", fontSize: "1rem", borderRadius: 4, border: "1px solid #ccc" },
  button:    { padding: "0.75rem", fontSize: "1rem", borderRadius: 4, background: "#222", color: "#fff", cursor: "pointer" },
};
