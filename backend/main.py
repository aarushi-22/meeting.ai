import os
import uuid
import tempfile
from datetime import datetime, timezone

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

import database as db
from models import MeetingOut, ActionItemsUpdate
from services.asr import transcribe_audio
from services.llm import generate_summary
from services.export import build_meeting_docx, build_action_items_ics

app = FastAPI(title="Meeting Summarizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    db.init_db()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- Meetings ----------

@app.post("/meetings", response_model=MeetingOut)
async def upload_meeting(file: UploadFile = File(...)):
    meeting_id = str(uuid.uuid4())
    created_at = now_iso()
    db.create_meeting(meeting_id, file.filename, created_at)

    # Write upload to a temp file just long enough to send to Groq; never persisted.
    suffix = os.path.splitext(file.filename)[1] or ".m4a"
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        transcript = transcribe_audio(tmp_path)
        result = generate_summary(transcript)

        summary_text = result["summary"]
        if result["key_decisions"]:
            decisions_block = "\n".join(f"- {d}" for d in result["key_decisions"])
            summary_text = f"{summary_text}\n\nKey Decisions:\n{decisions_block}"

        db.update_meeting(
            meeting_id,
            now_iso(),
            status="done",
            transcript=transcript,
            summary=summary_text,
            action_items=result["action_items"],
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        db.update_meeting(meeting_id, now_iso(), status="failed", error_message=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

    return db.get_meeting(meeting_id)


@app.get("/meetings", response_model=list[MeetingOut])
def get_meetings():
    return db.list_meetings()


@app.get("/meetings/{meeting_id}", response_model=MeetingOut)
def get_meeting(meeting_id: str):
    meeting = db.get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    return meeting


@app.delete("/meetings/{meeting_id}")
def delete_meeting(meeting_id: str):
    if not db.get_meeting(meeting_id):
        raise HTTPException(404, "Meeting not found")
    db.delete_meeting(meeting_id)
    return {"ok": True}


@app.patch("/meetings/{meeting_id}/action-items", response_model=MeetingOut)
def update_action_items(meeting_id: str, payload: ActionItemsUpdate):
    if not db.get_meeting(meeting_id):
        raise HTTPException(404, "Meeting not found")
    db.update_meeting(
        meeting_id,
        now_iso(),
        action_items=[item.model_dump() for item in payload.action_items],
    )
    return db.get_meeting(meeting_id)


# ---------- Exports ----------

@app.get("/meetings/{meeting_id}/export/docx")
def export_docx(meeting_id: str):
    meeting = db.get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    buf = build_meeting_docx(meeting)
    filename = f"{meeting['filename'].rsplit('.', 1)[0]}_summary.docx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.get("/meetings/{meeting_id}/export/ics")
def export_ics(meeting_id: str):
    meeting = db.get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    buf, count = build_action_items_ics(meeting)
    if count == 0:
        raise HTTPException(400, "No action items with deadlines to export")
    filename = f"{meeting['filename'].rsplit('.', 1)[0]}_action_items.ics"
    return StreamingResponse(
        buf,
        media_type="text/calendar",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ---------- Dashboard (to-do list + calendar aggregation) ----------

@app.get("/action-items")
def get_all_action_items():
    """Flattened action items across every meeting, each tagged with its
    source meeting. Powers both the To-Do List view (grouped by done) and
    the Calendar view (grouped by deadline) from one endpoint.
    """
    meetings = db.list_meetings()
    flattened = []
    for m in meetings:
        for item in m["action_items"]:
            flattened.append({
                **item,
                "meeting_id": m["id"],
                "meeting_filename": m["filename"],
            })
    return flattened
