# Meeting Summarizer

Upload a meeting recording, get a transcript + summary + editable action items back.

## Stack
- **ASR + LLM:** Groq API ("openai/gpt-oss-120b"), one API key for both.
- **Backend:** FastAPI + SQLite (`backend/meetings.db`, created automatically on first run)
- **Frontend:** React (Vite) + React Router
- **Exports:** `.docx` (via `python-docx`) and `.ics` (via `icalendar`), generated on demand

## Setup

### 1. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # then paste your Groq API key into .env
uvicorn main:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

## How it works
1. **New Meeting** — upload an audio file. It's sent to Groq Whisper for transcription, then the transcript is sent to Groq's LLM with a structured prompt that returns JSON: summary, key decisions, and action items (task/owner/deadline). Nothing about the audio file itself is stored — only the resulting text, in `meetings.db`.
2. **History** — every processed meeting, pulled straight from SQLite.
3. **Meeting detail** — view summary + full transcript, edit action items inline (owner/deadline/done), download a Word doc of the whole thing, or a `.ics` file of action items that have deadlines.
4. **To-Do List** — every action item across every meeting, flattened into one list, grouped by done/pending.

## Demo Video Link
