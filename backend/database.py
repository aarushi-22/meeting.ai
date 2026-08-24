"""
SQLite persistence layer.

Single-file, local-only database. No auth, no multi-user separation —
by design (see project scope notes). One table holds everything: the
meeting record, its transcript, its LLM summary, and its action items
(stored as a JSON string, since SQLite has no first-class array/JSON type
worth relying on for a project this size).
"""

import sqlite3
import json
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(__file__).parent / "meetings.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS meetings (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    status TEXT NOT NULL,          -- 'processing' | 'done' | 'failed'
    transcript TEXT,
    summary TEXT,
    action_items TEXT,             -- JSON string: [{id, task, owner, deadline, done}]
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    error_message TEXT
);
"""


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with get_conn() as conn:
        conn.execute(SCHEMA)


def row_to_dict(row: sqlite3.Row) -> dict:
    d = dict(row)
    d["action_items"] = json.loads(d["action_items"]) if d["action_items"] else []
    return d


def create_meeting(id: str, filename: str, created_at: str):
    with get_conn() as conn:
        conn.execute(
            """INSERT INTO meetings (id, filename, status, action_items, created_at, updated_at)
               VALUES (?, ?, 'processing', '[]', ?, ?)""",
            (id, filename, created_at, created_at),
        )


def update_meeting(id: str, updated_at: str, **fields):
    """Generic partial update. Pass column=value kwargs, e.g.
    update_meeting(id, now, status='done', transcript='...', summary='...')
    action_items, if passed, should be a Python list — it gets JSON-serialized here.
    """
    if "action_items" in fields and not isinstance(fields["action_items"], str):
        fields["action_items"] = json.dumps(fields["action_items"])

    fields["updated_at"] = updated_at
    set_clause = ", ".join(f"{k} = ?" for k in fields)
    values = list(fields.values()) + [id]

    with get_conn() as conn:
        conn.execute(f"UPDATE meetings SET {set_clause} WHERE id = ?", values)


def get_meeting(id: str) -> dict | None:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM meetings WHERE id = ?", (id,)).fetchone()
        return row_to_dict(row) if row else None


def list_meetings() -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM meetings ORDER BY created_at DESC"
        ).fetchall()
        return [row_to_dict(r) for r in rows]


def delete_meeting(id: str):
    with get_conn() as conn:
        conn.execute("DELETE FROM meetings WHERE id = ?", (id,))
