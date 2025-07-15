// src/components/AdminLogin.jsx
import React, { useState } from "react";
import api from "../api"; // your axios/fetch wrapper

export default function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    // Build Basic auth header
    const token = btoa(`${username}:${password}`);
    const authHeader = `Basic ${token}`;

    try {
      // Try hitting a protected endpoint
      await api.get("/admin/interview-sessions", {
        headers: { Authorization: authHeader }
      });
      // Success! Pass the header up so your app can use it.
      onLogin(authHeader);
    } catch (err) {
      console.error("Admin login failed", err);
      setError("Invalid credentials or no access.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h1 style={styles.heading}>🔒 Admin Login</h1>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={styles.input}
          autoFocus
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={styles.input}
        />
        <button type="submit" style={styles.button} disabled={submitting}>
          {submitting ? "Logging in…" : "Login"}
        </button>
        {error && <p style={styles.error}>{error}</p>}
      </form>
    </div>
  );
}


const styles = {
  container: {
    minHeight: "100vh",
    background: "#f2f2f2",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "2rem",
  },
  card: {
    background: "#fff",
    padding: "2rem 3rem",
    borderRadius: 12,
    boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
    textAlign: "center",
    maxWidth: 400,
    width: "100%",
  },
  heading: {
    fontSize: "1.8rem",
    marginBottom: "0.5rem",
  },
  subheading: {
    color: "#666",
    fontSize: "0.95rem",
    marginBottom: "1.5rem",
  },
  input: {
    width: "100%",
    padding: "10px",
    fontSize: "1rem",
    marginBottom: "1rem",
    borderRadius: 6,
    border: "1px solid #ccc",
  },
  button: {
    width: "100%",
    padding: "10px",
    fontSize: "1rem",
    background: "#222",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  error: {
    marginTop: "1rem",
    color: "#b00020",
    fontWeight: "bold",
  },
};
