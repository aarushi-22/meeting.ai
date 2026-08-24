import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllActionItems, updateActionItems, getMeeting } from '../api'

export default function Todo() {
  const [items, setItems] = useState(null)

  useEffect(() => {
    getAllActionItems().then(setItems)
  }, [])

  async function toggleDone(item) {
    const meeting = await getMeeting(item.meeting_id)
    const updatedItems = meeting.action_items.map((i) =>
      i.id === item.id ? { ...i, done: !i.done } : i
    )
    await updateActionItems(item.meeting_id, updatedItems)
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id && i.meeting_id === item.meeting_id ? { ...i, done: !i.done } : i
      )
    )
  }

  if (items === null) return <p className="subtitle">Loading…</p>

  const pending = items.filter((i) => !i.done)
  const done = items.filter((i) => i.done)

  return (
    <div>
      <h1>To-Do list</h1>
      <p className="subtitle">Every action item extracted across all meetings, in one place.</p>

      <h2>Pending ({pending.length})</h2>
      <div className="card">
        {pending.length === 0 && <div className="empty-state">Nothing pending. Nice.</div>}
        {pending.map((item) => (
          <ItemRow key={`${item.meeting_id}-${item.id}`} item={item} onToggle={toggleDone} />
        ))}
      </div>

      {done.length > 0 && (
        <>
          <h2>Done ({done.length})</h2>
          <div className="card">
            {done.map((item) => (
              <ItemRow key={`${item.meeting_id}-${item.id}`} item={item} onToggle={toggleDone} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ItemRow({ item, onToggle }) {
  return (
    <div className={`action-item ${item.done ? 'done' : ''}`}>
      <input type="checkbox" checked={item.done} onChange={() => onToggle(item)} />
      <div style={{ flex: 1 }}>
        <div className="task-text">{item.task}</div>
        <div className="task-meta">
          {item.owner || 'Unassigned'} · {item.deadline || 'No deadline'} ·{' '}
          <Link to={`/meetings/${item.meeting_id}`}>{item.meeting_filename}</Link>
        </div>
      </div>
    </div>
  )
}
