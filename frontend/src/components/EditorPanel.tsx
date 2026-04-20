import { useEffect, useMemo, useState } from 'react'
import { createVersion } from '../api/curriculum'
import type { CurriculumNode, TopicLevel, TopicNoteData } from '../types'

interface EditorPanelProps {
  selectedNode: CurriculumNode | null
  noteData: TopicNoteData | null
  loading: boolean
  error: string
  onRefresh: () => Promise<void>
  onCreateChild: (name: string, level: TopicLevel) => Promise<void>
  onRenameNode: (name: string) => Promise<void>
  onDeleteNode: () => Promise<void>
  structureSaving: boolean
}

const versionOptions = ['simple', 'industry', 'interview', 'professional']

function getChildLevel(level: TopicLevel | null): TopicLevel | null {
  if (level === null) return 'technology'
  if (level === 'technology') return 'module'
  if (level === 'module') return 'topic'
  return null
}

export default function EditorPanel({
  selectedNode,
  noteData,
  loading,
  error,
  onRefresh,
  onCreateChild,
  onRenameNode,
  onDeleteNode,
  structureSaving,
}: EditorPanelProps) {
  const [selectedVersion, setSelectedVersion] = useState('simple')
  const [versionType, setVersionType] = useState('simple')
  const [contentInput, setContentInput] = useState('')
  const [childName, setChildName] = useState('')
  const [renameValue, setRenameValue] = useState('')
  const [savingVersion, setSavingVersion] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [localError, setLocalError] = useState('')

  const availableVersions = useMemo(() => Object.keys(noteData?.versions || {}), [noteData])
  const activeContent = noteData?.versions?.[selectedVersion]
  const nextLevel = getChildLevel(selectedNode?.level ?? null)

  useEffect(() => {
    setStatusMessage('')
    setLocalError('')
    setContentInput('')
    setChildName('')
    setRenameValue(selectedNode?.name ?? '')
    const defaultVersion = availableVersions[0] || 'simple'
    setSelectedVersion(defaultVersion)
    setVersionType(defaultVersion)
  }, [selectedNode?.id, availableVersions])

  async function handleSaveVersion(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedNode) {
      return
    }

    setSavingVersion(true)
    setStatusMessage('')
    setLocalError('')

    try {
      const parsed = JSON.parse(contentInput)
      await createVersion(selectedNode.id, versionType, parsed)
      setSelectedVersion(versionType)
      setStatusMessage(noteData?.note ? 'Version saved successfully.' : 'First note created successfully.')
      setContentInput('')
      await onRefresh()
    } catch (err) {
      if (err instanceof SyntaxError) {
        setLocalError('Please enter valid JSON before saving.')
      } else {
        setLocalError(err instanceof Error ? err.message : 'Unable to save version.')
      }
    } finally {
      setSavingVersion(false)
    }
  }

  async function handleAddChild(e: React.FormEvent) {
    e.preventDefault()
    if (!nextLevel || !childName.trim()) {
      return
    }
    setStatusMessage('')
    setLocalError('')
    try {
      await onCreateChild(childName.trim(), nextLevel)
      setChildName('')
      setStatusMessage(`${nextLevel} created successfully.`)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Unable to create child node.')
    }
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedNode || !renameValue.trim()) {
      return
    }
    setStatusMessage('')
    setLocalError('')
    try {
      await onRenameNode(renameValue.trim())
      setStatusMessage('Node renamed successfully.')
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Unable to rename node.')
    }
  }

  if (!selectedNode) {
    return (
      <div className="rounded-[1.75rem] border border-brand-border bg-white p-8 shadow-brand">
        <p className="brand-label">Editor Panel</p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-brand-ink">
          Select a topic
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-brand-muted">
          Choose a node from the curriculum tree to edit structure or manage note content. This workspace is designed to feel like a visual content builder rather than a form-heavy admin screen.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-[1.75rem] border border-brand-border bg-white p-6 shadow-brand lg:h-[calc(100vh-10rem)] lg:overflow-y-auto">
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-5">
          <p className="brand-label">Editor Panel</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-brand-ink">
            {selectedNode.name}
          </h2>
          <p className="mt-3 text-sm leading-7 text-brand-muted">
            {noteData?.topic.breadcrumb || selectedNode.name}
          </p>
          <div className="mt-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
            {selectedNode.level}
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {statusMessage ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {statusMessage}
          </div>
        ) : null}
        {localError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {localError}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-2">
          <form onSubmit={handleRename} className="rounded-[1.5rem] border border-brand-border bg-slate-50/70 p-5">
            <h3 className="text-lg font-semibold text-brand-ink">Rename</h3>
            <p className="mt-1 text-sm text-brand-muted">Update the current node title.</p>
            <label className="mt-4 block space-y-2">
              <span className="text-sm font-semibold text-brand-ink">Name</span>
              <input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                disabled={structureSaving}
                className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-orange-300 focus:outline-none"
              />
            </label>
            <button type="submit" disabled={!renameValue.trim() || structureSaving} className="brand-button-secondary mt-4 w-full">
              Rename Node
            </button>
          </form>

          <div className="rounded-[1.5rem] border border-brand-border bg-slate-50/70 p-5">
            <h3 className="text-lg font-semibold text-brand-ink">Danger Zone</h3>
            <p className="mt-1 text-sm text-brand-muted">Delete this node and its subtree if it is no longer needed.</p>
            <button
              type="button"
              onClick={onDeleteNode}
              disabled={structureSaving}
              className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Delete Node
            </button>
          </div>
        </div>

        {selectedNode.level !== 'topic' ? (
          <form onSubmit={handleAddChild} className="rounded-[1.5rem] border border-brand-border bg-white p-5">
            <h3 className="text-lg font-semibold text-brand-ink">Add Child</h3>
            <p className="mt-1 text-sm text-brand-muted">
              {nextLevel
                ? `Create a ${nextLevel} under this ${selectedNode.level}.`
                : 'Leaf topics cannot have child nodes.'}
            </p>
            <label className="mt-4 block space-y-2">
              <span className="text-sm font-semibold text-brand-ink">Name</span>
              <input
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder={nextLevel ? `Enter ${nextLevel} name` : 'No child level available'}
                disabled={!nextLevel || structureSaving}
                className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-orange-300 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </label>
            <button type="submit" disabled={!nextLevel || !childName.trim() || structureSaving} className="brand-button-primary mt-4 w-full">
              {nextLevel ? `Add ${nextLevel}` : 'No child action'}
            </button>
          </form>
        ) : (
          <>
            <div className="rounded-[1.5rem] border border-brand-border bg-slate-50/70 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-brand-ink">Content</h3>
                  <p className="mt-1 text-sm text-brand-muted">
                    Only leaf nodes can hold notes and versions.
                  </p>
                </div>
                {!noteData?.note ? (
                  <button
                    type="button"
                    onClick={() => {
                      setVersionType('simple')
                      setSelectedVersion('simple')
                    }}
                    className="brand-button-primary"
                  >
                    Add First Note
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setContentInput(JSON.stringify(activeContent || {}, null, 2))
                      setVersionType(selectedVersion)
                    }}
                    className="brand-button-secondary"
                  >
                    Edit Content
                  </button>
                )}
              </div>

              {loading ? <p className="mt-4 text-sm text-brand-muted">Loading note data...</p> : null}
              {!loading && !noteData?.note ? (
                <p className="mt-4 text-sm leading-7 text-brand-muted">
                  No note exists for this topic yet. Save the first version below and the note will be created automatically.
                </p>
              ) : null}

              {!loading && noteData?.note ? (
                <>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {versionOptions.map((version) => {
                      const exists = Boolean(noteData.versions[version])
                      const active = selectedVersion === version

                      return (
                        <button
                          key={version}
                          type="button"
                          onClick={() => setSelectedVersion(version)}
                          className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                            active
                              ? 'bg-brand-orange text-white'
                              : exists
                                ? 'border border-orange-200 bg-brand-orangeSoft text-orange-700'
                                : 'border border-slate-200 bg-white text-slate-500'
                          }`}
                        >
                          {version}
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-5 rounded-[1.25rem] border border-slate-200 bg-white p-4">
                    {activeContent ? (
                      <pre className="overflow-x-auto whitespace-pre-wrap text-sm leading-7 text-slate-700">
                        {JSON.stringify(activeContent, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-sm text-brand-muted">No saved content for this version yet.</p>
                    )}
                  </div>
                </>
              )}
            </div>

            <form onSubmit={handleSaveVersion} className="rounded-[1.5rem] border border-brand-border bg-white p-5">
              <h3 className="text-lg font-semibold text-brand-ink">JSON Upload</h3>
              <p className="mt-1 text-sm text-brand-muted">
                Paste JSON for a version and save it directly to this topic.
              </p>

              <label className="mt-4 block space-y-2">
                <span className="text-sm font-semibold text-brand-ink">Version Type</span>
                <select
                  value={versionType}
                  onChange={(e) => setVersionType(e.target.value)}
                  className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-orange-300 focus:outline-none"
                >
                  {versionOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-4 block space-y-2">
                <span className="text-sm font-semibold text-brand-ink">Content (JSON)</span>
                <textarea
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  rows={14}
                  placeholder='{"definition":"...", "examples":[]}'
                  className="block w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 text-slate-900 shadow-sm focus:border-orange-300 focus:outline-none"
                />
              </label>

              <button
                type="submit"
                disabled={!contentInput.trim() || savingVersion}
                className="brand-button-primary mt-4 w-full"
              >
                {savingVersion ? 'Saving...' : noteData?.note ? 'Save Version' : 'Create First Note'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
