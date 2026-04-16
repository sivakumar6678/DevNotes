import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createNoteVersion, getAllNotes, getToken } from '../api/auth'

interface NoteItem {
  id: number
  title: string
}

export default function AdminPage() {
  const navigate = useNavigate()
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [selectedNoteId, setSelectedNoteId] = useState('')
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
      await createNoteVersion(Number(selectedNoteId), versionType, parsedContent)
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
            value={selectedNoteId}
            onChange={(e) => setSelectedNoteId(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">Choose a note</option>
            {notes.map((note) => (
              <option key={note.id} value={note.id}>
                {note.title}
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
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  )
}