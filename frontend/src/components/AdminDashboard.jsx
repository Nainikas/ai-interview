// src/components/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import api from "../api";

export default function AdminDashboard({ onLogout }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedLogs, setExpandedLogs] = useState({});

  const toggle = (id, type) => {
    setExpandedLogs((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [type]: !prev[id]?.[type] },
    }));
  };

  useEffect(() => {
    (async () => {
      try {
        const { sessions: sessionsData = [] } =
          await api.get("/admin/interview-sessions");

        const enriched = await Promise.all(
          sessionsData.map(async (s) => {
            let qa = [];
            try {
              const { qa_log = [] } = await api.get(`/admin/qa-log?candidate_id=${s.id}`);
              qa = qa_log;
            } catch (err) {
              if (!String(err).includes("404")) throw err;
            }

            let behavior = [];
            try {
              const { logs = [] } = await api.get(`/admin/behavior-logs?candidate_id=${s.id}`);
              behavior = logs;
            } catch (err) {
              console.warn("Behavior logs error for", s.id, err);
            }

            return { ...s, qa, behavior };
          })
        );

        setSessions(enriched);
        setError(null);
      } catch (err) {
        console.error("AdminDashboard loading error:", err);
        if (String(err).includes("401")) {
          setError("Unauthorized — please log in again.");
          onLogout();
        } else {
          setError("Failed to load admin data.");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [onLogout]);

  if (loading) return <p>Loading interview sessions…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (sessions.length === 0) return <p>No sessions available.</p>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🧑‍💼 Admin Dashboard</h1>
      {sessions.map((session) => (
        <div key={session.id} style={styles.card}>
          <h3>Candidate: {session.candidate_name || session.id}</h3>
          <p><strong>Resume:</strong> {session.resume_file}</p>
          <p><strong>Created:</strong> {new Date(session.created_at).toLocaleString()}</p>

          {/* 🧠 Behavior Logs Dropdown */}
          <div style={styles.section}>
            <button style={styles.toggleBtn} onClick={() => toggle(session.id, "behavior")}>
              🧠 {expandedLogs[session.id]?.behavior ? "Hide" : "Show"} Behavioral Logs
            </button>
            {expandedLogs[session.id]?.behavior && (
              <div style={styles.behaviorBlock}>
                {session.behavior.length === 0 ? (
                  <p>No behavior logs.</p>
                ) : (
                  <ul>
                    {session.behavior.map((b, i) => (
                      <li key={i}>
                        [{new Date(b.timestamp).toLocaleTimeString()}] Emotion: {b.emotion}, Face: {b.face_present ? "Yes" : "No"}, Gaze: {b.gaze_direction}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* 📋 Q&A Logs Dropdown */}
          <div style={styles.section}>
            <button style={styles.toggleBtn} onClick={() => toggle(session.id, "qa")}>
              📋 {expandedLogs[session.id]?.qa ? "Hide" : "Show"} Q&A Logs
            </button>
            {expandedLogs[session.id]?.qa && (
              <div style={styles.qaBlock}>
                {session.qa.length === 0 ? (
                  <p>No Q&A logs.</p>
                ) : (
                  session.qa.map((q, idx) => (
                    <div key={idx} style={styles.qaItem}>
                      <p><strong>Q:</strong> {q.question}</p>
                      <p><strong>A:</strong> {q.answer}</p>
                      <p><strong>Score:</strong> {q.score}</p>
                      {q.subscores && (
                        <ul style={{ marginLeft: "1rem", fontSize: "0.9rem" }}>
                          <li>Relevance: {q.subscores.relevance}</li>
                          <li>Accuracy: {q.subscores.accuracy}</li>
                          <li>Completeness: {q.subscores.completeness}</li>
                          <li>Clarity: {q.subscores.clarity}</li>
                        </ul>
                      )}
                      <p><strong>Hallucination:</strong> {q.hallucination}</p>

                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container:     { padding: "2rem", background: "#f5f5f5", minHeight: "100vh" },
  title:         { fontSize: "2rem", marginBottom: "1.5rem" },
  card:          {
    background: "#fff",
    borderRadius: 10,
    boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
    padding: "1.5rem 2rem",
    marginBottom: "2rem",
  },
  section:       { marginTop: "1rem" },
  toggleBtn:     {
    background: "#222",
    color: "#fff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: 5,
    cursor: "pointer",
    marginBottom: "0.5rem",
  },
  behaviorBlock: {
    background: "#f0f8ff",
    padding: "1rem",
    borderRadius: 8,
  },
  qaBlock:       {
    background: "#fdfdfd",
    padding: "1rem",
    borderRadius: 8,
    marginTop: "1rem",
  },
  qaItem:        {
    background: "#f9f9f9",
    borderRadius: 6,
    padding: "1rem",
    marginBottom: "1rem",
  },
};
