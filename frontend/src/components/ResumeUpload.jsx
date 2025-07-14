// src/components/ResumeUpload.jsx
import React, { useState } from "react";
import api from "../api";

export default function ResumeUpload({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  async function upload() {
    if (!file) return setError("Pick a PDF or DOCX first");
    setError(""); setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/upload-resume`,
        { method: "POST", body: fd }
      );
      if (!res.ok) throw new Error(await res.text());
      const { chunks_indexed } = await res.json();
      onUploaded(chunks_indexed);
    } catch (e) {
      console.error(e);
      setError("Upload failed: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ textAlign: "center", marginTop: 60 }}>
      <h2>Upload your resume to get started</h2>
      <input
        type="file"
        accept=".pdf,.docx"
        onChange={e => setFile(e.target.files[0])}
      />
      <button onClick={upload} disabled={loading || !file}>
        {loading ? "Uploading…" : "Upload Resume"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
