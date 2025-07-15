import React, { useEffect, useState } from "react";
import api from "../api";

export default function AdminDashboard({ authHeader }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      // 1) get all sessions
      const sessRes = await api.get("/admin/interview-sessions", {
        headers: { Authorization: authHeader }
      });
      const sessions = sessRes.data.sessions;

      // 2) for each session, fetch QA and behavior in parallel
      const enriched = await Promise.all(sessions.map(async (s) => {
        const [qaRes, behRes] = await Promise.all([
          api.get("/admin/qa-log", {
            headers: { Authorization: authHeader },
            params: { candidate_id: s.id }
          }),
          api.get("/admin/behavior-logs", {
            headers: { Authorization: authHeader },
            params: { candidate_id: s.id }
          })
        ]);
        return {
          ...s,
          qa: qaRes.data.qa_log,
          behavior: behRes.data.logs
        };
      }));

      setSessions(enriched);
    } catch (err) {
      console.error("Error loading admin data", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🧑‍💼 Admin Dashboard</h1>

      {loading ? (
        <p>Loading interview sessions…</p>
      ) : sessions.length === 0 ? (
        <p>No sessions available.</p>
      ) : (
        sessions.map((session) => (
          <div key={session.id} style={styles.card}>
            <h3>Candidate: {session.candidate_name || session.id}</h3>
            <p><strong>Session ID:</strong> {session.id}</p>
            <p><strong>Resume:</strong> {session.resume_file}</p>
            <p><strong>Created:</strong> {new Date(session.created_at).toLocaleString()}</p>

            <div style={styles.behaviorBlock}>
              <h4>🧠 Behavioral Logs</h4>
              {session.behavior.length === 0 ? (
                <p>No behavior logs.</p>
              ) : (
                <ul>
                  {session.behavior.map((b, i) => (
                    <li key={i}>
                      [{new Date(b.timestamp).toLocaleTimeString()}]  
                      Emotion: {b.emotion},  
                      Face: {b.face_present ? "Yes" : "No"},  
                      Gaze: {b.gaze_direction}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={styles.qaBlock}>
              <h4>📋 Q&A Logs</h4>
              {session.qa.length === 0 ? (
                <p>No Q&A logs.</p>
              ) : (
                session.qa.map((q, idx) => (
                  <div key={idx} style={styles.qaItem}>
                    <p><strong>Q:</strong> {q.question}</p>
                    <p><strong>A:</strong> {q.answer}</p>
                    <p><strong>Score:</strong> {q.score}</p>
                    <p><strong>Hallucination:</strong> {q.hallucination}</p>
                  </div>
                ))
              )}
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
