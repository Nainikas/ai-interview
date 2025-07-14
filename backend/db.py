# backend/db.py

import os
import sqlalchemy
from databases import Database

# Load your DATABASE_URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")
database = Database(DATABASE_URL)
metadata = sqlalchemy.MetaData()

# -----------------------------------------------------------------------------
# Interview logs: stores each Q&A turn, scores, and hallucination flag
# -----------------------------------------------------------------------------
interview_logs = sqlalchemy.Table(
    "interview_logs",
    metadata,
    sqlalchemy.Column("id",           sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("candidate_id", sqlalchemy.String,  nullable=False),
    sqlalchemy.Column("question",     sqlalchemy.Text,    nullable=True),
    sqlalchemy.Column("answer",       sqlalchemy.Text,    nullable=False),
    sqlalchemy.Column("score",        sqlalchemy.Float,   nullable=True),
    sqlalchemy.Column("subscores",    sqlalchemy.JSON,    nullable=True),
    sqlalchemy.Column("hallucination",sqlalchemy.String,  nullable=True),
    sqlalchemy.Column("timestamp",    sqlalchemy.DateTime, nullable=False),
)

# -----------------------------------------------------------------------------
# Behavior logs: stores per-tick engagement metrics for each session
# -----------------------------------------------------------------------------
behavior_logs = sqlalchemy.Table(
    "behavior_logs",
    metadata,
    sqlalchemy.Column("id",               sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("session_id",       sqlalchemy.String,  nullable=False),
    sqlalchemy.Column("timestamp",        sqlalchemy.DateTime, nullable=False),
    sqlalchemy.Column("engagement_score", sqlalchemy.Float,   nullable=False),
    # Optional additional fields you may collect:
    sqlalchemy.Column("emotion",          sqlalchemy.String,  nullable=True),
    sqlalchemy.Column("face_present",     sqlalchemy.Boolean, nullable=True),
    sqlalchemy.Column("gaze_direction",   sqlalchemy.String,  nullable=True),
)

# -----------------------------------------------------------------------------
# Engine & table creation
# -----------------------------------------------------------------------------
engine = sqlalchemy.create_engine(DATABASE_URL)
# Create any tables that don't yet exist
metadata.create_all(engine)
