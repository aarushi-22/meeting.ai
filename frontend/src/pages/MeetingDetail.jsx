import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getMeeting, updateActionItems, docxExportUrl, icsExportUrl } from '../api'

export default function MeetingDetail() {
  const { id } = useParams()
  const [meeting, setMeeting] = useState(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const data = await getMeeting(id)
    setMeeting(data)
    if (data.status === 'processing') {
      setTimeout(load, 2000) // poll while processing
    }
  }

  useEffect(() => { load() }, [id])

  async function saveItems(items) {
    setMeeting((m) => ({ ...m, action_items: items }))
    setSaving(true)
    await updateActionItems(id, items)
    setSaving(false)
  }

  function toggleDone(itemId) {
    const items = meeting.action_items.map((i) =>
      i.id === itemId ? { ...i, done: !i.done } : i
    )
    saveItems(items)
  }

  function editField(itemId, field, value) {
    const items = meeting.action_items.map((i) =>
      i.id === itemId ? { ...i, [field]: value } : i
    )
    setMeeting((m) => ({ ...m, action_items: items })) // local only while typing
  }

  function commitEdit() {
    saveItems(meeting.action_items)
  }

  if (!meeting) return <p className="subtitle">Loading…</p>

  if (meeting.status === 'processing') {
    return (
      <div>
        <h1>{meeting.filename}</h1>
        <p className="subtitle">Transcribing and summarizing… this page refreshes automatically.</p>
      </div>
    )
  }

  if (meeting.status === 'failed') {
    return (
      <div>
        <h1>{meeting.filename}</h1>
        <p style={{ color: '#A33' }}>Processing failed: {meeting.error_message}</p>
      </div>
    )
  }

  return (
    <div>
      <h1>{meeting.filename}</h1>
      <p className="subtitle">{new Date(meeting.created_at).toLocaleString()}</p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
        <a className="btn btn-outline btn-sm" href={docxExportUrl(id)}>Download Word summary</a>
        <a className="btn btn-outline btn-sm" href={icsExportUrl(id)}>Download .ics (deadlines)</a>
      </div>

      <h2>Summary</h2>
      <div className="card" style={{ whiteSpace: 'pre-wrap' }}>{meeting.summary}</div>

      <h2>Action items {saving && <span className="subtitle" style={{fontSize:'0.75rem'}}>saving…</span>}</h2>
      <div className="card">
        {meeting.action_items.length === 0 && <div className="empty-state">No action items extracted from this meeting.</div>}
        {meeting.action_items.map((item) => (
          <div key={item.id} className={`action-item ${item.done ? 'done' : ''}`}>
            <input type="checkbox" checked={item.done} onChange={() => toggleDone(item.id)} />
            <div style={{ flex: 1 }}>
              <input
                type="text"
                className="task-text"
                style={{ width: '100%', border: 'none', background: 'transparent', padding: '2px 0' }}
                value={item.task}
                onChange={(e) => editField(item.id, 'task', e.target.value)}
                onBlur={commitEdit}
              />
              <div className="task-meta" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Owner"
                  value={item.owner || ''}
                  onChange={(e) => editField(item.id, 'owner', e.target.value)}
                  onBlur={commitEdit}
                  style={{ width: 110 }}
                />
                <input
                  type="date"
                  value={item.deadline || ''}
                  onChange={(e) => editField(item.id, 'deadline', e.target.value)}
                  onBlur={commitEdit}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2>Full transcript</h2>
      <div className="transcript-box">{meeting.transcript}</div>
    </div>
  )
}
