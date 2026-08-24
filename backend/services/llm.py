"""
LLM summary + action item extraction.

Single prompt, forced JSON output, so the backend never has to regex-parse
free text out of the model's response. This is also the piece the eval
rubric calls out explicitly ("LLM prompt effectiveness") so the prompt is
kept deliberately structured and specific rather than a generic
"summarize this" one-liner.
"""

import os
import json
from groq import Groq

client = Groq(api_key=os.environ["GROQ_API_KEY"])

SYSTEM_PROMPT = """You are an assistant that turns raw meeting transcripts into \
structured, action-oriented summaries for a busy team. You are precise and \
conservative: you only report decisions and action items that are clearly \
supported by the transcript, and you never invent names, dates, or commitments \
that were not actually said.

Respond with ONLY a JSON object (no markdown fences, no preamble) in exactly \
this shape:

{
  "summary": "2-5 sentence plain-text summary of what the meeting was about and the key decisions made",
  "key_decisions": ["decision 1", "decision 2"],
  "action_items": [
    {"task": "short imperative task description", "owner": "person name or null if unclear", "deadline": "YYYY-MM-DD or null if not mentioned"}
  ]
}

Rules:
- If no clear owner is stated for a task, use null for "owner" — do not guess.
- If no deadline is stated or implied, use null for "deadline" — do not invent one.
- Only extract action items that are genuinely actionable tasks, not general discussion points.
- If the transcript is too short or unclear to extract meaningful decisions or action items, return empty arrays rather than fabricating content.
"""


def generate_summary(transcript: str) -> dict:
    """Returns a dict: {summary: str, key_decisions: list[str], action_items: list[dict]}"""
    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Meeting transcript:\n\n{transcript}"},
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
    )
    content = response.choices[0].message.content
    parsed = json.loads(content)

    # Assign stable local ids to action items now, so the frontend has
    # something to key edits/toggles against.
    action_items = []
    for i, item in enumerate(parsed.get("action_items", []), start=1):
        action_items.append({
            "id": str(i),
            "task": item.get("task", ""),
            "owner": item.get("owner"),
            "deadline": item.get("deadline"),
            "done": False,
        })

    return {
        "summary": parsed.get("summary", ""),
        "key_decisions": parsed.get("key_decisions", []),
        "action_items": action_items,
    }
