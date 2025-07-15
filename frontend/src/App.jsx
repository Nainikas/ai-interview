// src/App.jsx
import React, { useState, useEffect } from "react";
import api from "./api";                // ← note the "./api" import
import InterviewSession from "./components/InterviewSession";
import AdminDashboard from "./components/AdminDashboard";
import AdminLogin from "./components/AdminLogin";
import ResumeUpload from "./components/ResumeUpload";

export default function App() {
  const [view, setView] = useState("interview");
  const [candidateId, setCandidateId] = useState(null);

  useEffect(() => {
    if (localStorage.getItem("ADMIN_AUTH")) {
      setView("admin");
    }
  }, []);

  function handleAdminLogin(authHeader) {
    localStorage.setItem("ADMIN_AUTH", authHeader);
    setView("admin");
  }

  function handleLogout() {
    localStorage.removeItem("ADMIN_AUTH");
    setView("interview");
    setCandidateId(null);
  }

  const adminControls = (
    <div style={{ position: "absolute", top: 20, right: 30, zIndex: 100 }}>
      <button
        style={styles.button}
        onClick={() =>
          setView(localStorage.getItem("ADMIN_AUTH") ? "admin" : "admin-login")
        }
      >
        {localStorage.getItem("ADMIN_AUTH") ? "Admin Dashboard" : "Admin Login"}
      </button>
      {localStorage.getItem("ADMIN_AUTH") && (
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
        <ResumeUpload onUploaded={(id) => setCandidateId(id)} />
      )}

      {view === "interview" && candidateId && (
        <InterviewSession candidateId={candidateId} />
      )}

      {view === "admin-login" && <AdminLogin onLogin={handleAdminLogin} />}

      {view === "admin" && localStorage.getItem("ADMIN_AUTH") && (
        <AdminDashboard onLogout={handleLogout} />
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
  },
};
