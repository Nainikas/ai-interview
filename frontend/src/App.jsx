// src/App.jsx
import React, { useState } from "react";
import InterviewSession from "./components/InterviewSession";
import AdminDashboard from "./components/AdminDashboard";
import AdminLogin from "./components/AdminLogin";
import ResumeUpload from "./components/ResumeUpload";

export default function App() {
  const [view, setView] = useState("interview"); // "interview" | "admin-login" | "admin"
  const [adminAuth, setAdminAuth] = useState(null); // Basic auth header string
  const [candidateId, setCandidateId] = useState(null);

  // invoked by AdminLogin with authHeader
  function handleAdminLogin(authHeader) {
    setAdminAuth(authHeader);
    setView("admin");
  }

  function handleLogout() {
    setAdminAuth(null);
    setView("interview");
    setCandidateId(null);
  }

  const adminControls = (
    <div style={{ position: "absolute", top: 20, right: 30, zIndex: 100 }}>
      <button
        style={styles.button}
        onClick={() => setView(adminAuth ? "admin" : "admin-login")}
      >
        {adminAuth ? "Admin Dashboard" : "Admin Login"}
      </button>
      {adminAuth && (
        <button style={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      )}
    </div>
  );

  return (
    <div>
      {adminControls}

      {view === "interview" && !candidateId && (
        <ResumeUpload onUploaded={id => setCandidateId(id)} />
      )}

      {view === "interview" && candidateId && (
        <InterviewSession candidateId={candidateId} />
      )}

      {view === "admin-login" && (
        <AdminLogin onLogin={handleAdminLogin} />
      )}

      {view === "admin" && adminAuth && (
        // Pass auth header down so AdminDashboard can use it
        <AdminDashboard authHeader={adminAuth} />
      )}
    </div>
  );
}

const styles = {
  button: {
    padding: "10px 20px",
    fontWeight: 600,
    borderRadius: 6,
    border: "1px solid #ccc",
    background: "#222",
    color: "#fff",
    cursor: "pointer",
    marginRight: 8,
  },
  logoutButton: {
    padding: "10px 16px",
    borderRadius: 6,
    border: "1px solid #ccc",
    background: "#aaa",
    color: "#222",
    cursor: "pointer",
  }
};
