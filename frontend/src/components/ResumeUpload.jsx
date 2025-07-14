import React, { useState } from "react";
import api from "../api";

export default function ResumeUpload({ onUploaded }) {
  const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const uploadResume = async () => {
    if (!resumeFile) {
      setError("Please select a PDF resume.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", resumeFile);

      const res = await api.post("/interview/upload-resume", formData);

      // ✅ Fixed check: response is raw JSON, not res.data
      if (res?.candidate_id) {
        onUploaded(res.candidate_id);
      } else {
        console.error("Unexpected response:", res);
        setError("Unexpected server response. Please try again.");
      }
    } catch (err) {
      console.error("Upload failed", err);
      setError("Failed to upload resume. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.heading}>👋 Welcome to AI Interview Agent</h1>
        <p style={styles.subheading}>Please upload your resume (PDF) to begin.</p>

        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setResumeFile(e.target.files[0])}
          style={styles.fileInput}
        />

        <button
          onClick={uploadResume}
          disabled={!resumeFile || uploading}
          style={styles.uploadButton}
        >
          {uploading ? "Uploading..." : "Upload Resume"}
        </button>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f5f5f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
    padding: "2rem 3rem",
    maxWidth: 500,
    width: "100%",
    textAlign: "center",
  },
  heading: {
    fontSize: "1.8rem",
    fontWeight: "bold",
    marginBottom: "0.5rem",
  },
  subheading: {
    fontSize: "1rem",
    color: "#555",
    marginBottom: "1.5rem",
  },
  fileInput: {
    marginBottom: "1rem",
  },
  uploadButton: {
    padding: "10px 20px",
    fontSize: "1rem",
    background: "#222",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  error: {
    color: "#b00020",
    marginTop: "1rem",
    fontWeight: "bold",
  },
};
