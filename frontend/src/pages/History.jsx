import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listMeetings, deleteMeeting } from '../api'

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{status}</span>
}

export default function History() {
  const [meetings, setMeetings] = useState(null)

  async function load() {
    setMeetings(await listMeetings())
  }

  useEffect(() => { load() }, [])

  async function handleDelete(e, id) {
    e.preventDefault()
    e.stopPropagation()
    await deleteMeeting(id)
    load()
  }

  if (meetings === null) return <p className="subtitle">Loading…</p>

  return (
    <div>
      <h1>History</h1>
      <p className="subtitle">Every meeting processed on this machine.</p>

      <div className="card" style={{ padding: '4px 22px' }}>
        {meetings.length === 0 && <div className="empty-state">No meetings yet. Upload one to get started.</div>}
        {meetings.map((m) => (
          <Link to={`/meetings/${m.id}`} key={m.id} className="meeting-row">
            <div>
              <div className="meeting-title">{m.filename}</div>
              <div className="meeting-meta">{new Date(m.created_at).toLocaleString()}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <StatusBadge status={m.status} />
              <button className="btn btn-outline btn-sm" onClick={(e) => handleDelete(e, m.id)}>Delete</button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
