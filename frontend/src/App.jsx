// src/App.jsx
import React, { useState } from "react";
import InterviewSession from "./components/InterviewSession";
import AdminDashboard from "./components/AdminDashboard";
import AdminLogin from "./components/AdminLogin";
import ResumeUpload from "./components/ResumeUpload";

export default function App() {
  const [view, setView] = useState("interview"); // "interview" | "admin-login" | "admin"
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [candidateId, setCandidateId] = useState(null); // from resume upload

  function handleAdminLogin() {
    setAdminLoggedIn(true);
    setView("admin");
  }

  function handleLogout() {
    setAdminLoggedIn(false);
    setView("interview");
    setCandidateId(null);
  }

  const adminControls = view !== "admin-login" && (
    <div style={{
      position: "absolute", top: 20, right: 30, zIndex: 100
    }}>
      <button
        style={{
          padding: "10px 20px", fontWeight: 600,
          borderRadius: 6, border: "1px solid #ccc",
          background: "#222", color: "#fff",
          cursor: "pointer"
        }}
        onClick={() => setView(adminLoggedIn ? "admin" : "admin-login")}
      >
        {adminLoggedIn ? "Admin Dashboard" : "Admin Login"}
      </button>
      {adminLoggedIn && (
        <button
          style={{
            marginLeft: 12, padding: "10px 16px",
            borderRadius: 6, border: "1px solid #ccc",
            background: "#aaa", color: "#222",
            cursor: "pointer"
          }}
          onClick={handleLogout}
        >
          Logout
        </button>
      )}
    </div>
  );

  return (
    <div>
      {adminControls}

      {/* 1) Upload → 2) Interview → 3) Admin */}
      {view === "interview" && !candidateId && (
        <ResumeUpload onUploaded={(id) => setCandidateId(id)} />
      )}

      {view === "interview" && candidateId && (
        <InterviewSession candidateId={candidateId} />
      )}

      {view === "admin-login" && (
        <AdminLogin onLogin={handleAdminLogin} />
      )}

      {view === "admin" && adminLoggedIn && (
        <AdminDashboard />
      )}
    </div>
  );
}
