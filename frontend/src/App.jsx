// src/App.jsx
import React, { useState } from "react";
import InterviewSession from "./components/InterviewSession";
import AdminDashboard from "./components/AdminDashboard";
import AdminLogin from "./components/AdminLogin";
import api from "./api";

export default function App() {
  const [view, setView] = useState("interview");      // "interview" | "admin-login" | "admin"
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [uploadError, setUploadError] = useState("");

  function handleAdminLogin() {
    setAdminLoggedIn(true);
    setView("admin");
  }
  function handleLogout() {
    setAdminLoggedIn(false);
    setView("interview");
  }

  async function handleResumeUpload(e) {
    e.preventDefault();
    setUploadError("");
    const fileInput = e.target.elements.resume.files[0];
    if (!fileInput) {
      setUploadError("Please choose a file.");
      return;
    }
    const form = new FormData();
    form.append("file", fileInput);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/interview/upload-resume`,
        {
          method: "POST",
          body: form,
        }
      );
      if (!resp.ok) throw new Error(await resp.text());
      const { chunks_indexed } = await resp.json();
      console.log("Resume ingested:", chunks_indexed, "chunks");
      setResumeUploaded(true);
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadError("Upload failed: " + err.message);
    }
  }

  // top-right admin buttons
  const adminControls = view !== "admin-login" && (
    <div style={{
      position: "absolute",
      top: 20, right: 30, zIndex: 100
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

      {/* 1) Resume Upload → 2) Interview → 3) Admin/Login */}
      {view === "interview" && !resumeUploaded && (
        <div style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          height: "100vh", fontFamily: "system-ui"
        }}>
          <h1>Upload Your Resume</h1>
          <form onSubmit={handleResumeUpload}>
            <input type="file" name="resume" accept=".pdf,.docx" />
            <button
              type="submit"
              style={{
                marginLeft: 8, padding: "8px 16px",
                borderRadius: 4, border: "none",
                background: "#007bff", color: "#fff",
                cursor: "pointer"
              }}
            >
              Upload & Start Interview
            </button>
          </form>
          {uploadError && (
            <p style={{ color: "red", marginTop: 12 }}>{uploadError}</p>
          )}
        </div>
      )}

      {view === "interview" && resumeUploaded && (
        <InterviewSession />
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
