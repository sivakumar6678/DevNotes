import { useEffect, useMemo, useState } from 'react'
import CurriculumTree from '../components/CurriculumTree'
import EditorPanel from '../components/EditorPanel'
import { createTopic, deleteTopic, fetchCurriculum, fetchNoteByTopic, updateTopic } from '../api/curriculum'
import type { CurriculumNode, TopicLevel, TopicNoteData } from '../types'

function flattenNodes(nodes: CurriculumNode[]): CurriculumNode[] {
  return nodes.flatMap((node) => [node, ...flattenNodes(node.children)])
}

function getChildLevel(level: TopicLevel | null): TopicLevel | null {
  if (level === null) return 'technology'
  if (level === 'technology') return 'module'
  if (level === 'module') return 'topic'
  return null
}

function addLabel(level: TopicLevel | null): string {
  const childLevel = getChildLevel(level)
  if (childLevel === 'technology') return 'Add Technology'
  if (childLevel === 'module') return 'Add Module'
  if (childLevel === 'topic') return 'Add Topic'
  return 'No child action'
}

export default function CurriculumEditorPage() {
  const [tree, setTree] = useState<CurriculumNode[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [treeLoading, setTreeLoading] = useState(true)
  const [treeError, setTreeError] = useState('')
  const [panelLoading, setPanelLoading] = useState(false)
  const [panelError, setPanelError] = useState('')
  const [noteData, setNoteData] = useState<TopicNoteData | null>(null)
  const [newNodeName, setNewNodeName] = useState('')
  const [structureSaving, setStructureSaving] = useState(false)
  const [structureMessage, setStructureMessage] = useState('')

  const allNodes = useMemo(() => flattenNodes(tree), [tree])
  const selectedNode = allNodes.find((node) => node.id === selectedId) || null

  useEffect(() => {
    loadCurriculum()
  }, [])

  useEffect(() => {
    loadNoteForSelection(selectedNode)
  }, [selectedNode?.id])

  async function loadCurriculum() {
    setTreeLoading(true)
    setTreeError('')

    try {
      const data = await fetchCurriculum()
      setTree(data)
      if (selectedId && !flattenNodes(data).some((node) => node.id === selectedId)) {
        setSelectedId(null)
      }
    } catch (err) {
      setTreeError(err instanceof Error ? err.message : 'Unable to load curriculum.')
    } finally {
      setTreeLoading(false)
    }
  }

  async function loadNoteForSelection(node: CurriculumNode | null) {
    setPanelError('')
    setNoteData(null)

    if (!node || node.level !== 'topic') {
      setPanelLoading(false)
      return
    }

    setPanelLoading(true)
    try {
      const data = await fetchNoteByTopic(node.id)
      setNoteData(data)
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : 'Unable to load note.')
    } finally {
      setPanelLoading(false)
    }
  }

  async function handleAddNode(e: React.FormEvent) {
    e.preventDefault()
    const nextLevel = getChildLevel(selectedNode?.level ?? null)
    if (!nextLevel) {
      return
    }

    setStructureSaving(true)
    setStructureMessage('')
    setTreeError('')

    try {
      await createTopic({
        name: newNodeName,
        parent_id: selectedNode?.id ?? null,
        level: nextLevel,
      })
      setNewNodeName('')
      setStructureMessage(`${addLabel(selectedNode?.level ?? null)} created successfully.`)
      await loadCurriculum()
    } catch (err) {
      setTreeError(err instanceof Error ? err.message : 'Unable to create node.')
    } finally {
      setStructureSaving(false)
    }
  }

  async function handleRenameNode(name: string, targetNode: CurriculumNode | null = selectedNode) {
    if (!targetNode) {
      return
    }

    setStructureSaving(true)
    setStructureMessage('')
    setTreeError('')

    try {
      await updateTopic(targetNode.id, { name })
      setStructureMessage('Node renamed successfully.')
      await loadCurriculum()
    } catch (err) {
      setTreeError(err instanceof Error ? err.message : 'Unable to rename node.')
    } finally {
      setStructureSaving(false)
    }
  }

  async function handleDeleteNode(targetNode: CurriculumNode | null = selectedNode) {
    if (!targetNode) {
      return
    }

    const confirmed = window.confirm(`Delete "${targetNode.name}" and all of its children?`)
    if (!confirmed) {
      return
    }

    setStructureSaving(true)
    setStructureMessage('')
    setTreeError('')

    try {
      await deleteTopic(targetNode.id)
      if (selectedId === targetNode.id) {
        setSelectedId(null)
      }
      setStructureMessage('Node deleted successfully.')
      await loadCurriculum()
    } catch (err) {
      setTreeError(err instanceof Error ? err.message : 'Unable to delete node.')
    } finally {
      setStructureSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-8 sm:px-6">
      <section className="brand-panel p-8">
        <p className="brand-label">Curriculum Editor</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-brand-ink sm:text-5xl">
          Tree-based curriculum and note editor in one workspace.
        </h1>
        <p className="mt-4 max-w-4xl text-lg leading-8 text-brand-muted">
          Select a topic from the curriculum tree, then create or update note versions without switching screens or using dropdown-based note selection.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.32fr_0.68fr]">
        <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-brand">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="brand-label">Curriculum Tree</p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-brand-ink">
                Structure
              </h2>
            </div>
            <button type="button" onClick={loadCurriculum} className="brand-button-secondary">
              Refresh
            </button>
          </div>

          {treeError ? (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {treeError}
            </div>
          ) : null}
          {structureMessage ? (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {structureMessage}
            </div>
          ) : null}

          {treeLoading ? (
            <p className="text-sm text-brand-muted">Loading curriculum...</p>
          ) : (
            <CurriculumTree
              nodes={tree}
              selectedId={selectedId}
              onSelect={(node) => setSelectedId(node.id)}
              onAddChild={async (node) => {
                setSelectedId(node.id)
                setStructureMessage('')
                setTreeError('')
                const level = getChildLevel(node.level)
                if (!level) {
                  return
                }
                const name = window.prompt(`Add ${level} under "${node.name}"`, '')
                if (!name || !name.trim()) {
                  return
                }
                setStructureSaving(true)
                try {
                  await createTopic({
                    name: name.trim(),
                    parent_id: node.id,
                    level,
                  })
                  setStructureMessage(`${level} created successfully.`)
                  await loadCurriculum()
                } catch (err) {
                  setTreeError(err instanceof Error ? err.message : 'Unable to create node.')
                } finally {
                  setStructureSaving(false)
                }
              }}
              onRename={async (node) => {
                setSelectedId(node.id)
                setStructureMessage('')
                setTreeError('')
                const name = window.prompt(`Rename "${node.name}"`, node.name)
                if (!name || !name.trim() || name.trim() === node.name) {
                  return
                }
                await handleRenameNode(name.trim(), node)
              }}
              onDelete={async (node) => {
                setSelectedId(node.id)
                await handleDeleteNode(node)
              }}
            />
          )}

          <form onSubmit={handleAddNode} className="mt-6 space-y-4 rounded-[1.75rem] border border-brand-border bg-slate-50/70 p-5">
            <div>
              <h3 className="text-lg font-semibold text-brand-ink">Quick Add</h3>
              <p className="mt-1 text-sm text-brand-muted">
                Add the next valid node directly from the current selection.
              </p>
            </div>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-brand-ink">{addLabel(selectedNode?.level ?? null)}</span>
              <input
                value={newNodeName}
                onChange={(e) => setNewNodeName(e.target.value)}
                placeholder={getChildLevel(selectedNode?.level ?? null) ? 'Enter node name' : 'Select a valid parent'}
                disabled={!getChildLevel(selectedNode?.level ?? null) || structureSaving}
                className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-orange-300 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </label>
            <button
              type="submit"
              disabled={!getChildLevel(selectedNode?.level ?? null) || !newNodeName.trim() || structureSaving}
              className="brand-button-primary w-full"
            >
              {structureSaving ? 'Saving...' : addLabel(selectedNode?.level ?? null)}
            </button>
          </form>
        </section>

        <EditorPanel
          selectedNode={selectedNode}
          noteData={noteData}
          loading={panelLoading}
          error={panelError}
          onCreateChild={async (name, level) => {
            if (!selectedNode && level !== 'technology') {
              throw new Error('Select a parent node first.')
            }
            setStructureSaving(true)
            try {
              await createTopic({
                name,
                parent_id: selectedNode?.id ?? null,
                level,
              })
              await loadCurriculum()
            } finally {
              setStructureSaving(false)
            }
          }}
          onRenameNode={async (name) => {
            setStructureSaving(true)
            try {
              await handleRenameNode(name)
            } finally {
              setStructureSaving(false)
            }
          }}
          onDeleteNode={async () => {
            await handleDeleteNode()
          }}
          structureSaving={structureSaving}
          onRefresh={async () => {
            await loadCurriculum()
            await loadNoteForSelection(selectedNode)
          }}
        />
      </div>
    </div>
  )
}
