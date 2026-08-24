import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadMeeting } from '../api'

export default function Upload() {
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  function handleFiles(files) {
    if (files && files[0]) {
      setFile(files[0])
      setError(null)
    }
  }

  async function handleSubmit() {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const meeting = await uploadMeeting(file)
      navigate(`/meetings/${meeting.id}`)
    } catch (e) {
      setError('Upload failed. Is the backend running on localhost:8000?')
      setUploading(false)
    }
  }

  return (
    <div>
      <h1>New meeting</h1>
      <p className="subtitle">Upload a recording. It gets transcribed and summarized automatically — usually takes under a minute.</p>

      <div
        className={`dropzone ${dragging ? 'dragover' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
      >
        <div className="dropzone-label">{file ? file.name : 'Drop an audio file here, or click to browse'}</div>
        <div className="dropzone-sub">MP3, WAV, M4A supported</div>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && <p style={{ color: '#A33', marginTop: 12 }}>{error}</p>}

      <div style={{ marginTop: 20 }}>
        <button className="btn" disabled={!file || uploading} onClick={handleSubmit}>
          {uploading ? 'Transcribing & summarizing…' : 'Process meeting'}
        </button>
      </div>
    </div>
  )
}
