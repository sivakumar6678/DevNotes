import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import CurriculumTree from '../components/CurriculumTree'
import { createTopic, deleteTopic, fetchCurriculum, updateTopic } from '../api/curriculum'
import type { CurriculumNode, TopicLevel } from '../types'

function flattenNodes(nodes: CurriculumNode[]): CurriculumNode[] {
  return nodes.flatMap((node) => [node, ...flattenNodes(node.children)])
}

function getChildLevel(level: TopicLevel | null): TopicLevel | null {
  if (level === null) return 'technology'
  if (level === 'technology') return 'module'
  if (level === 'module') return 'topic'
  return null
}

function actionLabel(level: TopicLevel | null): string {
  const childLevel = getChildLevel(level)
  if (!childLevel) return 'No child nodes available'
  if (childLevel === 'technology') return 'Add Technology'
  if (childLevel === 'module') return 'Add Module'
  return 'Add Topic'
}

export default function CurriculumPage() {
  const [tree, setTree] = useState<CurriculumNode[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [newNodeName, setNewNodeName] = useState('')
  const [editName, setEditName] = useState('')

  const allNodes = useMemo(() => flattenNodes(tree), [tree])
  const selectedNode = allNodes.find((node) => node.id === selectedId) || null
  const nextLevel = getChildLevel(selectedNode?.level ?? null)

  useEffect(() => {
    loadCurriculum()
  }, [])

  useEffect(() => {
    setEditName(selectedNode?.name ?? '')
  }, [selectedNode])

  async function loadCurriculum() {
    setLoading(true)
    setError('')

    try {
      const data = await fetchCurriculum()
      setTree(data)
      if (selectedId && !flattenNodes(data).some((node) => node.id === selectedId)) {
        setSelectedId(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load curriculum.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddNode(e: React.FormEvent) {
    e.preventDefault()
    if (!nextLevel) {
      return
    }

    setSaving(true)
    setError('')
    setStatusMessage('')

    try {
      await createTopic({
        name: newNodeName,
        parent_id: selectedNode?.id ?? null,
        level: nextLevel,
      })
      setNewNodeName('')
      setStatusMessage(`${actionLabel(selectedNode?.level ?? null)} created successfully.`)
      await loadCurriculum()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create node.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateNode(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedNode) {
      return
    }

    setSaving(true)
    setError('')
    setStatusMessage('')

    try {
      await updateTopic(selectedNode.id, { name: editName })
      setStatusMessage('Node updated successfully.')
      await loadCurriculum()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update node.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteNode() {
    if (!selectedNode) {
      return
    }

    const confirmed = window.confirm(`Delete "${selectedNode.name}" and all of its children?`)
    if (!confirmed) {
      return
    }

    setSaving(true)
    setError('')
    setStatusMessage('')

    try {
      await deleteTopic(selectedNode.id)
      setSelectedId(null)
      setStatusMessage('Node deleted successfully.')
      await loadCurriculum()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete node.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      <section className="brand-panel p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="brand-label">Curriculum Management</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-brand-ink sm:text-5xl">
              Build the syllabus tree with a clean editor.
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-brand-muted">
              Organize technologies, modules, and topics in one place, then keep the learning platform structured as it grows.
            </p>
          </div>
          <Link to="/admin" className="brand-button-secondary">
            Back to Admin
          </Link>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-brand">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="brand-label">Tree View</p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-brand-ink">
                Curriculum Structure
              </h2>
            </div>
            <button type="button" onClick={loadCurriculum} className="brand-button-secondary">
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-brand-muted">Loading curriculum...</p>
          ) : (
            <CurriculumTree nodes={tree} selectedId={selectedId} onSelect={(node) => setSelectedId(node.id)} />
          )}
        </section>

        <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-brand">
          <div className="space-y-6">
            <div>
              <p className="brand-label">Action Panel</p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-brand-ink">
                {selectedNode ? selectedNode.name : 'Add a technology to begin'}
              </h2>
              <p className="mt-3 text-sm leading-7 text-brand-muted">
                {selectedNode
                  ? `Selected ${selectedNode.level}. Add children where valid, rename the node, or delete the subtree safely.`
                  : 'No node selected. Create a top-level technology to start building the curriculum.'}
              </p>
            </div>

            {statusMessage ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {statusMessage}
              </div>
            ) : null}
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleAddNode} className="space-y-4 rounded-[1.75rem] border border-brand-border bg-slate-50/70 p-5">
              <div>
                <h3 className="text-lg font-semibold text-brand-ink">{actionLabel(selectedNode?.level ?? null)}</h3>
                <p className="mt-1 text-sm text-brand-muted">
                  {nextLevel
                    ? `This will create a new ${nextLevel} under the current selection.`
                    : 'Topics are leaf nodes, so no more children can be added here.'}
                </p>
              </div>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-brand-ink">Name</span>
                <input
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  placeholder={nextLevel ? `Enter ${nextLevel} name` : 'Select a different node'}
                  disabled={!nextLevel || saving}
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-orange-300 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </label>
              <button type="submit" disabled={!nextLevel || !newNodeName.trim() || saving} className="brand-button-primary w-full">
                {saving ? 'Saving...' : actionLabel(selectedNode?.level ?? null)}
              </button>
            </form>

            <form onSubmit={handleUpdateNode} className="space-y-4 rounded-[1.75rem] border border-brand-border bg-white p-5">
              <div>
                <h3 className="text-lg font-semibold text-brand-ink">Edit Node</h3>
                <p className="mt-1 text-sm text-brand-muted">Update the selected node name. The slug will refresh automatically.</p>
              </div>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-brand-ink">Name</span>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Select a node first"
                  disabled={!selectedNode || saving}
                  className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-orange-300 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </label>
              <button type="submit" disabled={!selectedNode || !editName.trim() || saving} className="brand-button-secondary w-full">
                Update Node
              </button>
            </form>

            <div className="rounded-[1.75rem] border border-red-100 bg-red-50/60 p-5">
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-brand-ink">Delete Node</h3>
                  <p className="mt-1 text-sm text-brand-muted">
                    Deletes the selected node and its child branch. This also removes linked note records for that subtree.
                  </p>
                </div>
                <button type="button" disabled={!selectedNode || saving} onClick={handleDeleteNode} className="inline-flex w-full items-center justify-center rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                  Delete Node
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
