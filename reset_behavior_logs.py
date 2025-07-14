# reset_behavior_logs.py

import os
from dotenv import load_dotenv

# Load your .env (so DATABASE_URL is set)
load_dotenv()

# Now import your DB metadata
from backend.db import engine, metadata

if "behavior_logs" in metadata.tables:
    metadata.tables["behavior_logs"].drop(engine, checkfirst=True)
    print("Dropped existing behavior_logs table.")

# Re-create all tables
metadata.create_all(engine)
print("Recreated all tables (behavior_logs now includes engagement_score).")
