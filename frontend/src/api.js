const BASE_URL = 'http://localhost:8000'

export async function uploadMeeting(file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${BASE_URL}/meetings`, { method: 'POST', body: formData })
  if (!res.ok) throw new Error('Upload failed')
  return res.json()
}

export async function listMeetings() {
  const res = await fetch(`${BASE_URL}/meetings`)
  if (!res.ok) throw new Error('Failed to load meetings')
  return res.json()
}

export async function getMeeting(id) {
  const res = await fetch(`${BASE_URL}/meetings/${id}`)
  if (!res.ok) throw new Error('Failed to load meeting')
  return res.json()
}

export async function deleteMeeting(id) {
  const res = await fetch(`${BASE_URL}/meetings/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete meeting')
  return res.json()
}

export async function updateActionItems(id, actionItems) {
  const res = await fetch(`${BASE_URL}/meetings/${id}/action-items`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action_items: actionItems }),
  })
  if (!res.ok) throw new Error('Failed to update action items')
  return res.json()
}

export async function getAllActionItems() {
  const res = await fetch(`${BASE_URL}/action-items`)
  if (!res.ok) throw new Error('Failed to load action items')
  return res.json()
}

export function docxExportUrl(id) {
  return `${BASE_URL}/meetings/${id}/export/docx`
}

export function icsExportUrl(id) {
  return `${BASE_URL}/meetings/${id}/export/ics`
}
