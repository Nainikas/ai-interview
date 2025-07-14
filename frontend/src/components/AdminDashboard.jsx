// src/components/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import api from "../api";

export default function AdminDashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      const res = await api.get("/admin/logs");
      setLogs(res.data.sessions || []);
    } catch (err) {
      console.error("Error fetching logs", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🧑‍💼 Admin Dashboard</h1>

      {loading ? (
        <p>Loading interview sessions...</p>
      ) : logs.length === 0 ? (
        <p>No sessions available.</p>
      ) : (
        logs.map((session) => (
          <div key={session.session_id} style={styles.card}>
            <h3>Candidate ID: {session.candidate_id}</h3>
            <p><strong>Session ID:</strong> {session.session_id}</p>
            <p><strong>Start Time:</strong> {session.start_time}</p>

            <div style={styles.behaviorBlock}>
              <h4>🧠 Behavioral Analysis</h4>
              <ul>
                <li><strong>Eye Contact:</strong> {session.behavior.eye_contact}</li>
                <li><strong>Expression:</strong> {session.behavior.expression}</li>
                <li><strong>Presence:</strong> {session.behavior.presence}</li>
                <li><strong>Suspicious?</strong> {session.behavior.suspicious ? "⚠️ Yes" : "✅ No"}</li>
              </ul>
            </div>

            <div style={styles.qaBlock}>
              <h4>📋 Interview Q&A</h4>
              {session.qa.map((entry, index) => (
                <div key={index} style={styles.qaItem}>
                  <p><strong>Q:</strong> {entry.question}</p>
                  <p><strong>A:</strong> {entry.answer}</p>
                  <p><strong>Score:</strong> {entry.score} / 10</p>
                  <p><strong>Hallucination Check:</strong> {entry.hallucination}</p>
                  <p><strong>Subscores:</strong> {Object.entries(entry.subscores || {}).map(
                    ([k, v]) => `${k}: ${v.toFixed(1)} `
                  )}</p>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    fontFamily: "system-ui, sans-serif",
    background: "#f5f5f5",
    minHeight: "100vh",
  },
  title: {
    fontSize: "2rem",
    marginBottom: "1.5rem",
  },
  card: {
    background: "#fff",
    borderRadius: 10,
    boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
    padding: "1.5rem 2rem",
    marginBottom: "2rem",
  },
  behaviorBlock: {
    background: "#f0f8ff",
    padding: "1rem",
    borderRadius: 8,
    marginTop: "1rem",
  },
  qaBlock: {
    marginTop: "1.5rem",
  },
  qaItem: {
    background: "#f9f9f9",
    borderRadius: 6,
    padding: "1rem",
    marginBottom: "1rem",
  },
};
