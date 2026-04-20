import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createNoteVersion, getAllNotes, getCurrentUser, getToken, logout } from '../api/auth'
import type { NoteOption } from '../types'
import UserManagement from './UserManagement'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [notes, setNotes] = useState<NoteOption[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [versionType, setVersionType] = useState('industry')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [activeSection, setActiveSection] = useState<'notes' | 'users'>('notes')

  useEffect(() => {
    if (!getToken() || currentUser?.role !== 'admin') {
      navigate('/login')
      return
    }
    loadNotes()
  }, [currentUser?.role, navigate])

  async function loadNotes() {
    try {
      const data = await getAllNotes()
      setNotes(data.notes || [])
    } catch (err) {
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

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sticky top-6 h-fit">
          <div className="mb-8 space-y-3">
            <h2 className="text-2xl font-semibold">Admin Dashboard</h2>
            <p className="text-sm text-slate-600">Manage notes and approve user access.</p>
          </div>
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setActiveSection('notes')}
              className={`w-full rounded-2xl px-4 py-3 text-left shadow-sm transition ${
                activeSection === 'notes'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Add Note
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('users')}
              className={`w-full rounded-2xl px-4 py-3 text-left shadow-sm transition ${
                activeSection === 'users'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Manage Users
            </button>
            <button
              type="button"
              onClick={() => navigate('/curriculum')}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-left text-slate-700 hover:bg-slate-50"
            >
              Curriculum
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-left text-slate-700 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </aside>

        <main className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          {activeSection === 'notes' ? (
            <>
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-3xl font-semibold">Add Note Version</h1>
                  <p className="text-sm text-slate-600">Submit JSON content for a selected note.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Select Note</span>
                    <select
                      value={selectedTopicId}
                      onChange={(e) => setSelectedTopicId(e.target.value)}
                      required
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none"
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
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="simple">Simple</option>
                      <option value="professional">Professional</option>
                      <option value="industry">Industry</option>
                      <option value="interview">Interview</option>
                    </select>
                  </label>
                </div>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Content (JSON)</span>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    rows={10}
                    placeholder='{"summary": "…"}'
                    className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none"
                  />
                </label>

                {statusMessage && <p className="text-green-700">{statusMessage}</p>}
                {error && <p className="text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-3xl bg-blue-600 px-6 py-3 text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Submitting...' : 'Save Version'}
                </button>
              </form>
            </>
          ) : (
            <UserManagement />
          )}
        </main>
      </div>
    </div>
  )
}
