# backend/db.py

import os
import sqlalchemy
from databases import Database

DATABASE_URL = os.getenv("DATABASE_URL")
database = Database(DATABASE_URL)
metadata = sqlalchemy.MetaData()

# ─── New: Interview Sessions ─────────────────────────────────────
interview_sessions = sqlalchemy.Table(
    "interview_sessions",
    metadata,
    sqlalchemy.Column("id",           sqlalchemy.String, primary_key=True),  # UUID or candidate_id
    sqlalchemy.Column("candidate_name", sqlalchemy.String, nullable=True),
    sqlalchemy.Column("job_role",     sqlalchemy.String, nullable=True),
    sqlalchemy.Column("resume_file",  sqlalchemy.String, nullable=True),
    sqlalchemy.Column("created_at",   sqlalchemy.DateTime, nullable=False),
)

# ─── Q&A Logs ───────────────────────────────────────────────────
interview_logs = sqlalchemy.Table(
    "interview_logs",
    metadata,
    sqlalchemy.Column("id",             sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("candidate_id",   sqlalchemy.String,  nullable=False),
    sqlalchemy.Column("question",       sqlalchemy.Text,    nullable=True),
    sqlalchemy.Column("answer",         sqlalchemy.Text,    nullable=False),
    sqlalchemy.Column("score",          sqlalchemy.Float,   nullable=True),
    sqlalchemy.Column("subscores",      sqlalchemy.JSON,    nullable=True),
    sqlalchemy.Column("hallucination",  sqlalchemy.String,  nullable=True),
    sqlalchemy.Column("timestamp",      sqlalchemy.DateTime, nullable=False),
)

# ─── Behavioral Logs ────────────────────────────────────────────
behavior_logs = sqlalchemy.Table(
    "behavior_logs",
    metadata,
    sqlalchemy.Column("id",               sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("session_id",       sqlalchemy.String,  nullable=False),
    sqlalchemy.Column("timestamp",        sqlalchemy.DateTime, nullable=False),
    sqlalchemy.Column("engagement_score", sqlalchemy.Float,   nullable=False),
    sqlalchemy.Column("emotion",          sqlalchemy.String,  nullable=True),
    sqlalchemy.Column("face_present",     sqlalchemy.Boolean, nullable=True),
    sqlalchemy.Column("gaze_direction",   sqlalchemy.String,  nullable=True),
)

# ─── Engine & Table Creation ────────────────────────────────────
engine = sqlalchemy.create_engine(DATABASE_URL)
metadata.create_all(engine)
