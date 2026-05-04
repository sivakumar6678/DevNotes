import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createNoteVersion, getAllNotes } from '../api/auth'
import { SavingLoader } from '../components/Loader'
import { useAuth } from '../context/AuthContext'
import type { NoteOption } from '../types'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [notes, setNotes] = useState<NoteOption[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [versionType, setVersionType] = useState('industry')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    if (!isAdmin) {
      navigate('/login')
      return
    }
    loadNotes()
  }, [isAdmin, navigate])

  async function loadNotes() {
    try {
      const data = await getAllNotes()
      setNotes(data.notes || [])
    } catch {
      setError('Failed to load notes. Please refresh.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setStatusMessage('')

    try {
      const parsedContent = JSON.parse(content)
      await createNoteVersion(Number(selectedTopicId), versionType, parsedContent)
      setStatusMessage('Note version created successfully.')
      setContent('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit note version.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Add Note Version</h1>
        <p className="mt-1 text-sm text-slate-500">
          Submit JSON content for a selected note topic.
        </p>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Select Note</span>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
              >
                <option value="">Choose a note</option>
                {notes.map((note) => (
                  <option key={note.topic_id} value={note.topic_id}>
                    {note.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Version Type</span>
              <select
                value={versionType}
                onChange={(e) => setVersionType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
              >
                <option value="simple">Simple</option>
                <option value="industry">Industry</option>
                <option value="interview">Interview</option>
                <option value="revision">Revision</option>
                <option value="realtime">Realtime</option>
                <option value="theory">Theory</option>
              </select>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Content (JSON)</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={12}
              placeholder='{"summary": "…"}'
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
            />
          </label>

          {statusMessage && (
            <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {statusMessage}
            </p>
          )}
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <SavingLoader className="bg-white/30" label="Saving note version" /> : null}
              Save Version
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
