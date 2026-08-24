from pydantic import BaseModel


class ActionItem(BaseModel):
    id: str          # small stable id within the meeting, e.g. "1", "2"
    task: str
    owner: str | None = None
    deadline: str | None = None   # ISO date string, e.g. "2026-08-25", nullable
    done: bool = False


class ActionItemsUpdate(BaseModel):
    action_items: list[ActionItem]


class MeetingOut(BaseModel):
    id: str
    filename: str
    status: str
    transcript: str | None = None
    summary: str | None = None
    action_items: list[ActionItem] = []
    created_at: str
    updated_at: str
    error_message: str | None = None
