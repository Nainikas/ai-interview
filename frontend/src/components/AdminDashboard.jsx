import React, { useEffect, useState } from "react";
import api from "../api";

export default function AdminDashboard() {
  const [sessions,     setSessions    ] = useState([]);
  const [selected,     setSelected    ] = useState(null);
  const [qaLog,        setQaLog       ] = useState([]);
  const [behaviorLogs, setBehaviorLogs] = useState([]);

  // 1) fetch sessions once
  useEffect(() => {
    api.get("/admin/interview-sessions")
       .then(r => setSessions(r.sessions || []));
  }, []);

  // 2) when you click one, fetch BOTH logs
  useEffect(() => {
    if (!selected) return;

    api.get(`/admin/qa-log?candidate_id=${selected.id}`)
       .then(r => setQaLog(r.qa_log || []))
       .catch(() => setQaLog([]));

    api.get(`/admin/behavior-logs?candidate_id=${selected.id}`)
       .then(r => setBehaviorLogs(r.logs || []))
       .catch(() => setBehaviorLogs([]));
  }, [selected]);

  return (
    <div style={{ padding: 32, fontFamily: "system-ui" }}>
      <h1>Admin Dashboard</h1>
      <div style={{ display: "flex", gap: 32 }}>

        {/* SIDEBAR */}
        <div style={{ minWidth: 220 }}>
          <h2>Sessions</h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {sessions.map(s => (
              <li key={s.id} style={{ marginBottom: 8 }}>
                <button
                  onClick={() => setSelected(s)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: 8,
                    border: 0,
                    borderRadius: 4,
                    background: selected?.id === s.id ? "#007bff" : "#eee",
                    color:    selected?.id === s.id ? "#fff" : "#000",
                  }}
                >
                  {s.candidate_name}
                  <br/>
                  <small>{new Date(s.created_at).toLocaleString()}</small>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* MAIN PANEL */}
        <div style={{ flex: 1 }}>
          {!selected ? (
            <p>Select a session to view details.</p>
          ) : (
            <>
              <h2>Session: {selected.candidate_name}</h2>
              <p>Started: {new Date(selected.created_at).toLocaleString()}</p>

              <h3>Q&A & Scores</h3>
              {qaLog.length > 0 ? (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th>Question</th>
                      <th>Answer</th>
                      <th>Score</th>
                      <th>Subscores</th>
                      <th>Hallucination?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qaLog.map((qa, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #ddd" }}>
                        <td>{qa.question}</td>
                        <td>{qa.answer}</td>
                        <td style={{ textAlign: "center" }}>{qa.score}</td>
                        <td>
                          {qa.subscores
                            ? Object.entries(qa.subscores)
                                .map(([k,v])=>`${k}: ${v}`)
                                .join(", ")
                            : "-"}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {qa.hallucination ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No scored Q&A yet.</p>
              )}

              <h3 style={{ marginTop: 32 }}>Behavior Log</h3>
              {behaviorLogs.length > 0 ? (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Emotion</th>
                      <th>Face Present</th>
                    </tr>
                  </thead>
                  <tbody>
                    {behaviorLogs.map((b, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #ddd" }}>
                        <td>{new Date(b.timestamp).toLocaleTimeString()}</td>
                        <td>{b.emotion}</td>
                        <td>{b.face_present ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No behavior data yet.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}