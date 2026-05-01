import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createNoteVersion, getAllNotes, getToken } from '../api/auth'
import { SavingLoader } from '../components/Loader'
import type { NoteOption } from '../types'

export default function AdminPage() {
  const navigate = useNavigate()
  const [notes, setNotes] = useState<NoteOption[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [versionType, setVersionType] = useState('industry')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!getToken()) {
      navigate('/login')
      return
    }
    loadNotes()
  }, [])

  async function loadNotes() {
    try {
      const data = await getAllNotes()
      setNotes(data.notes)
    } catch (err) {
      setError('Failed to load notes')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const parsedContent = JSON.parse(content)
      await createNoteVersion(Number(selectedTopicId), versionType, parsedContent)
      alert('Note version created successfully!')
      setContent('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit note version.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="mt-2 text-gray-600">Add note content</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="note" className="block text-sm font-medium">
            Select Note
          </label>
          <select
            id="note"
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">Choose a note</option>
            {notes.map((note) => (
              <option key={note.topic_id} value={note.topic_id}>
                {note.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="versionType" className="block text-sm font-medium">
            Version Type
          </label>
          <select
            id="versionType"
            value={versionType}
            onChange={(e) => setVersionType(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="simple">Simple</option>
            <option value="professional">Professional</option>
            <option value="industry">Industry</option>
            <option value="interview">Interview</option>
          </select>
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium">
            Content (JSON)
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={10}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder='{"definition": "...", ...}'
          />
        </div>
        {error && <p className="text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? <SavingLoader className="bg-blue-400/30" label="Submitting note version" /> : null}
          Submit
        </button>
      </form>
    </div>
  )
}
