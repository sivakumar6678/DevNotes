import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import {
  fetchTechnologies,
  fetchCurriculumByTech,
  fetchNoteByTopic,
  createVersion,
  createTopic,
  updateTopic,
  deleteTopic,
} from '../api/curriculum'
import CurriculumTree from '../components/CurriculumTree'
import EditorDrawer from '../components/EditorDrawer'
import type { CurriculumNode, TopicNoteData, TopicLevel, Technology } from '../types'

export default function CurriculumPage() {
  const [technologies, setTechnologies] = useState<Technology[]>([])
  const [activeTechSlug, setActiveTechSlug] = useState<string | null>(null)

  const [tree, setTree] = useState<CurriculumNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedTopic, setSelectedTopic] = useState<CurriculumNode | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [noteData, setNoteData] = useState<TopicNoteData | null>(null)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [drawerError, setDrawerError] = useState('')
  const [selectionMessage, setSelectionMessage] = useState('')

  const [isAddTechModalOpen, setIsAddTechModalOpen] = useState(false)
  const [newTechName, setNewTechName] = useState('')

  useEffect(() => {
    loadTechnologies()
  }, [])

  useEffect(() => {
    if (activeTechSlug) {
      loadCurriculum(activeTechSlug)
    } else {
      setTree([])
    }
  }, [activeTechSlug])

  async function loadTechnologies() {
    try {
      const data = await fetchTechnologies()
      setTechnologies(data)
      if (data.length > 0 && !activeTechSlug) {
        setActiveTechSlug(data[0].slug)
      }
    } catch (err) {
      setError('Unable to load technologies.')
    }
  }

  async function loadCurriculum(slug: string) {
    setLoading(true)
    setError('')
    try {
      const data = await fetchCurriculumByTech(slug)
      setTree(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load curriculum.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddTech(e: React.FormEvent) {
    e.preventDefault()
    const name = newTechName.trim()
    if (!name) return

    try {
      await createTopic({ parent_id: null, name, level: 'technology' })
      setNewTechName('')
      setIsAddTechModalOpen(false)
      await loadTechnologies()
      // Note: we might want to set the new tech as active, but backend doesn't return the slug in a predictable way unless we slugify it.
      // Re-fetching technologies will update the list.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create technology')
    }
  }

  async function handleNodeSelect(node: CurriculumNode) {
    const nodeType = node.type ?? node.level

    setSelectedTopic(node)

    if (nodeType !== 'topic') {
      setIsDrawerOpen(false)
      setNoteData(null)
      setSelectionMessage('Only topic nodes can be edited.')
      setTimeout(() => setSelectionMessage(''), 3000)
      return
    }

    setSelectionMessage('')

    setIsDrawerOpen(true)
    setDrawerLoading(true)
    setNoteData(null)

    try {
      const data = await fetchNoteByTopic(node.id)
      setNoteData(data)
    } catch (err) {
      console.error('Failed to load note:', err)
    } finally {
      setDrawerLoading(false)
    }
  }

  function handleCloseDrawer() {
    setIsDrawerOpen(false)
  }

  async function handleSaveVersion(versionType: string, content: object) {
    if (!selectedTopic) return

    setSaving(true)
    setSaveStatus('')
    setDrawerError('')

    try {
      await createVersion(selectedTopic.id, versionType, content)
      setSaveStatus('Note content saved successfully.')
      setTimeout(() => setSaveStatus(''), 3000)
    } catch (err) {
      setDrawerError(err instanceof Error ? err.message : 'Unable to save note.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddChild(parentId: number | null, name: string, level: TopicLevel) {
    try {
      await createTopic({ parent_id: parentId, name, level })
      if (activeTechSlug) await loadCurriculum(activeTechSlug)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add node')
    }
  }

  async function handleRenameNode(topicId: number, name: string) {
    try {
      await updateTopic(topicId, { name })
      if (activeTechSlug) await loadCurriculum(activeTechSlug)
      await loadTechnologies() // Reload tech names in tabs just in case it was a tech node (though tree only shows modules)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename node')
    }
  }

  async function handleDeleteNode(topicId: number) {
    try {
      await deleteTopic(topicId)
      if (selectedTopic?.id === topicId) {
        setSelectedTopic(null)
        setIsDrawerOpen(false)
      }
      if (activeTechSlug) await loadCurriculum(activeTechSlug)
      await loadTechnologies()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete node')
    }
  }

  const activeTech = technologies.find((t) => t.slug === activeTechSlug)

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 px-6 pt-5">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Curriculum Builder</h1>
              <p className="mt-1 text-sm text-slate-600">Select a technology to manage its curriculum</p>
            </div>
            <button
              onClick={() => setIsAddTechModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Add Technology
            </button>
          </div>

          <div className="flex gap-6 overflow-x-auto border-t border-slate-200 pt-2 hide-scrollbar">
            {technologies.map((tech) => (
              <button
                key={tech.slug}
                onClick={() => setActiveTechSlug(tech.slug)}
                className={`whitespace-nowrap border-b-2 px-1 pb-3 pt-2 text-sm font-medium transition ${
                  activeTechSlug === tech.slug
                    ? 'border-brand-orange text-brand-orange'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                {tech.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {selectionMessage && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {selectionMessage}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-slate-600">Loading curriculum...</div>
        ) : activeTech ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">{activeTech.name} Curriculum</h2>
            </div>
            <CurriculumTree
              nodes={tree}
              techId={activeTech.id}
              selectedId={selectedTopic?.id ?? null}
              onSelect={handleNodeSelect}
              onAddChild={handleAddChild}
              onRename={handleRenameNode}
              onDelete={handleDeleteNode}
            />
          </div>
        ) : (
          <div className="text-center text-slate-500 py-12">
            No curriculum found. Please create a technology first.
          </div>
        )}
      </main>

      {/* Add Technology Modal */}
      {isAddTechModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddTechModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setIsAddTechModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-semibold text-slate-900">Add New Technology</h3>
            <p className="mt-1 text-sm text-slate-500">Create a root technology to organize modules and topics.</p>
            
            <form onSubmit={handleAddTech} className="mt-5 space-y-4">
              <div>
                <label htmlFor="techName" className="block text-sm font-medium text-slate-700">
                  Technology Name
                </label>
                <input
                  id="techName"
                  autoFocus
                  type="text"
                  value={newTechName}
                  onChange={(e) => setNewTechName(e.target.value)}
                  placeholder="e.g. JavaScript"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddTechModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTechName.trim()}
                  className="rounded-lg bg-brand-orange px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-orange/90 disabled:opacity-50"
                >
                  Create Technology
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTopic && selectedTopic.type === 'topic' && (
        <EditorDrawer
          isOpen={isDrawerOpen}
          node={selectedTopic}
          noteData={noteData}
          loading={drawerLoading}
          error={drawerError}
          onClose={handleCloseDrawer}
          onSave={handleSaveVersion}
          saving={saving}
          saveStatus={saveStatus}
        />
      )}
    </div>
  )
}
