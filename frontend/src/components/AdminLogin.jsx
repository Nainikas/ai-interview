import React, { useState } from "react";

export default function AdminLogin({ onLogin }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  const SECRET = import.meta.env.VITE_SECRET_PASSWORD;

  function handleSubmit(e) {
    e.preventDefault();
    // Change this password for demo!
    if (pw === SECRET) {
      onLogin();
      setPw("");
      setError("");
    } else {
      setError("Incorrect password. Try again.");
      setPw("");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: 320,
        margin: "120px auto",
        background: "#222",
        color: "#fff",
        padding: 32,
        borderRadius: 10,
        boxShadow: "0 4px 18px #2224"
      }}
    >
      <h2>Admin Login</h2>
      <input
        type="password"
        placeholder="Admin password"
        value={pw}
        onChange={e => setPw(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          margin: "18px 0",
          borderRadius: 5,
          border: "1px solid #555",
          fontSize: 18,
        }}
      />
      <button
        type="submit"
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: 6,
          border: "none",
          background: "#007bff",
          color: "#fff",
          fontWeight: 600,
          fontSize: 16,
          cursor: "pointer"
        }}
      >
        Login
      </button>
      {error && (
        <div style={{ marginTop: 12, color: "#ff5555" }}>{error}</div>
      )}
    </form>
  );
}