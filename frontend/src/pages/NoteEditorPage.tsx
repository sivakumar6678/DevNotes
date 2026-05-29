import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Globe, EyeOff, CheckCircle2 } from 'lucide-react'
import { SavingLoader } from '../components/Loader'
import NoteContent from '../components/NoteContent'
import { fetchNoteByTopic, createVersion, updateTopic } from '../api/curriculum'
import type { TopicNoteData } from '../types'
import { normalizeNoteVersion } from '../utils/contentNormalizer'

// ─── Constants ────────────────────────────────────────────────────────────────

const AVAILABLE_VERSIONS = [
  { id: 'industry', label: 'Industry', description: 'Deep-dive into production usage and architecture' },
  { id: 'interview', label: 'Interview', description: 'Q&A format for interview preparation' },
  { id: 'theory', label: 'Theory', description: 'Comprehensive theoretical explanation' },
  { id: 'simple', label: 'Simple', description: 'Beginner-friendly introductory content' },
  { id: 'revision', label: 'Revision', description: 'Quick summary for exam or last-minute review' },
  { id: 'realtime', label: 'Real-time', description: 'Practical real-world implementation examples' }
] as const

type VersionOption = string


const PLACEHOLDER_JSON = `{
  "definition": "A concise definition...",
  "how_it_works": "Step-by-step explanation...",
  "code_example": [
    {
      "title": "Basic Example",
      "language": "javascript",
      "code": "// your code here"
    }
  ],
  "best_practices": [
    "Always validate input",
    "Prefer immutability"
  ]
}`


// ─── High Fidelity Editor Skeleton ────────────────────────────────────────────
function EditorSkeleton() {
  return (
    <div className="ne-vertical-layout animate-pulse">
      {/* View Toggle Skeleton */}
      <div className="ne-view-toggle opacity-60">
        <div className="h-7 w-20 bg-slate-200 rounded-md" />
        <div className="h-7 w-20 bg-slate-100 rounded-md ml-2" />
      </div>

      <div className="flex flex-col gap-6">
        {/* Title skeleton */}
        <div className="space-y-2.5">
          <div className="h-4 w-32 bg-slate-200 rounded-full" />
          <div className="h-8 w-3/4 bg-slate-300 rounded-xl" />
          <div className="h-4 w-1/2 bg-slate-200 rounded-full" />
        </div>

        {/* Paragraph skeleton */}
        <div className="space-y-3 pt-6 border-t border-slate-100">
          <div className="h-4 w-full bg-slate-200 rounded-full" />
          <div className="h-4 w-11/12 bg-slate-200 rounded-full" />
          <div className="h-4 w-4/5 bg-slate-200 rounded-full" />
        </div>

        {/* Code block skeleton */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="h-4 w-24 bg-slate-300 rounded-md" />
            <div className="h-4 w-12 bg-slate-200 rounded-md" />
          </div>
          <div className="font-mono space-y-2 pt-2">
            <div className="h-3 w-3/4 bg-slate-200 rounded-md" />
            <div className="h-3 w-1/2 bg-slate-200 rounded-md" />
            <div className="h-3 w-2/3 bg-slate-200 rounded-md" />
            <div className="h-3 w-1/3 bg-slate-200 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}


// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NoteEditorPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const numericTopicId = topicId ? parseInt(topicId, 10) : null

  // Data
  const [noteData, setNoteData] = useState<TopicNoteData | null>(null)
  const [loadingNote, setLoadingNote] = useState(false)
  const [loadError, setLoadError] = useState('')

  // Editor state
  const [versionType, setVersionType] = useState<VersionOption>('industry')
  const [contentInputs, setContentInputs] = useState<Record<string, string>>({})

  // Original saved content for dirty-state comparison
  const [originalContent, setOriginalContent] = useState<Record<string, string>>({})

  const [jsonError, setJsonError] = useState('')

  // Save state
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [saveMessage, setSaveMessage] = useState('')

  // Publish state
  const [publishing, setPublishing] = useState(false)

  // Layout view mode
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor')

  // ── Load note data ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!numericTopicId) return
    let cancelled = false

    async function load() {
      setLoadingNote(true)
      setLoadError('')
      try {
        const data = await fetchNoteByTopic(numericTopicId!)
        if (data?.versions) {
          for (const key of Object.keys(data.versions)) {
            data.versions[key] = normalizeNoteVersion(data.versions[key])
          }
        }
        if (!cancelled) setNoteData(data)
      } catch {
        if (!cancelled) setLoadError('Could not load note data for this topic.')
      } finally {
        if (!cancelled) setLoadingNote(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [numericTopicId])

  // Clear drafts when switching topics
  useEffect(() => {
    setContentInputs({})
    setOriginalContent({})
  }, [numericTopicId])

  // ── Sync textarea when noteData changes ───────────────────────────────────
  useEffect(() => {
    if (!noteData?.versions) return

    const initialInputs: Record<string, string> = {}
    const initialOriginals: Record<string, string> = {}

    for (const v of AVAILABLE_VERSIONS) {
      if (noteData.versions[v.id]) {
        const strVal = JSON.stringify(noteData.versions[v.id], null, 2)
        initialInputs[v.id] = strVal
        initialOriginals[v.id] = strVal
      } else {
        initialInputs[v.id] = ''
        initialOriginals[v.id] = ''
      }
    }

    setContentInputs((prev) => {
      const merged = { ...prev }
      for (const key of Object.keys(initialInputs)) {
        if (merged[key] === undefined) {
          merged[key] = initialInputs[key]
        }
      }
      return merged
    })

    setOriginalContent((prev) => {
      const merged = { ...prev }
      for (const key of Object.keys(initialOriginals)) {
        if (merged[key] === undefined) {
          merged[key] = initialOriginals[key]
        }
      }
      return merged
    })
  }, [noteData])

  const contentInput = contentInputs[versionType] ?? ''
  const savedContent = originalContent[versionType] ?? ''
  const isDirty = contentInput !== savedContent

  // Clear errors when switching versions
  useEffect(() => {
    setJsonError('')
    setSaveStatus('idle')
    setSaveMessage('')
  }, [versionType])

  // ── Live JSON parse for preview ────────────────────────────────────────────
  const parsedPreview = useMemo<Record<string, unknown> | null>(() => {
    if (!contentInput.trim()) return null
    try {
      const result = JSON.parse(contentInput)
      if (result && typeof result === 'object' && !Array.isArray(result)) {
        setJsonError('')
        return result
      }
      setJsonError('Content must be a JSON object { … }, not an array or primitive.')
      return null
    } catch (err) {
      if (contentInput.trim()) {
        setJsonError(err instanceof SyntaxError ? err.message : 'Invalid JSON syntax.')
      } else {
        setJsonError('')
      }
      return null
    }
  }, [contentInput])

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!numericTopicId) return
    if (!contentInput.trim()) {
      setSaveStatus('error')
      setSaveMessage('Cannot save empty content.')
      return
    }
    let parsed: object
    try {
      parsed = JSON.parse(contentInput)
    } catch {
      setSaveStatus('error')
      setSaveMessage('Fix JSON errors before saving.')
      return
    }

    setSaving(true)
    setSaveStatus('idle')
    setSaveMessage('')
    try {
      await createVersion(numericTopicId, versionType, parsed)
      setSaveStatus('success')
      setSaveMessage(`"${versionType}" version saved successfully.`)

      const savedStr = JSON.stringify(parsed, null, 2)

      // Force refetch to keep local components in sync
      let fresh = null
      try {
        fresh = await fetchNoteByTopic(numericTopicId, true)
        if (fresh?.versions) {
          for (const key of Object.keys(fresh.versions)) {
            fresh.versions[key] = normalizeNoteVersion(fresh.versions[key])
          }
        }
        setNoteData(fresh)
      } catch (err) {
        console.error('Failed to refetch fresh data:', err)
      }

      const freshStr = fresh?.versions?.[versionType]
        ? JSON.stringify(fresh.versions[versionType], null, 2)
        : savedStr

      setContentInputs((prev) => ({
        ...prev,
        [versionType]: freshStr
      }))
      setOriginalContent((prev) => ({
        ...prev,
        [versionType]: freshStr
      }))

      // Auto-clear success message after 4 s
      setTimeout(() => { setSaveStatus('idle'); setSaveMessage('') }, 4000)
    } catch (err) {
      setSaveStatus('error')
      setSaveMessage(err instanceof Error ? err.message : 'Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }, [numericTopicId, versionType, contentInput])

  // ── Publish ───────────────────────────────────────────────────────────────
  const handlePublish = useCallback(async () => {
    if (!numericTopicId || !noteData?.topic) return
    setPublishing(true)
    setSaveStatus('idle')
    setSaveMessage('')
    try {
      await updateTopic(numericTopicId, { is_published: !noteData.topic.is_published, sort_order: noteData.topic.sort_order })
      setSaveStatus('success')
      setSaveMessage(noteData.topic.is_published ? 'Topic unpublished successfully.' : 'Topic published successfully.')
      const fresh = await fetchNoteByTopic(numericTopicId)
      if (fresh?.versions) {
        for (const key of Object.keys(fresh.versions)) {
          fresh.versions[key] = normalizeNoteVersion(fresh.versions[key])
        }
      }
      setNoteData(fresh)
      setTimeout(() => { setSaveStatus('idle'); setSaveMessage('') }, 4000)
    } catch (err) {
      setSaveStatus('error')
      setSaveMessage(err instanceof Error ? err.message : 'Failed to update publish status.')
    } finally {
      setPublishing(false)
    }
  }, [numericTopicId, noteData])

  // ── Derived ───────────────────────────────────────────────────────────────
  const topicName = noteData?.topic?.name ?? (loadingNote ? '' : `Topic #${topicId}`)
  const breadcrumb = noteData?.topic?.breadcrumb ?? ''
  const isSubtopic = noteData?.topic?.type === 'subtopic' || (noteData?.topic as Record<string, unknown>)?.node_type === 'subtopic'
  const hasJsonError = Boolean(jsonError)

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="ne-root">

      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <header className="ne-header">
        <div className="ne-header-inner">

          {/* Left: back + identity */}
          <div className="ne-header-left">
            <button
              type="button"
              onClick={() => navigate('/admin/curriculum')}
              aria-label="Back to Curriculum"
              className="ne-back-btn"
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </button>
            <div className="ne-topic-identity">
              {loadingNote ? (
                <div className="animate-pulse space-y-1.5 py-1">
                  <div className="h-2.5 w-32 bg-slate-200 rounded-full" />
                  <div className="h-4 w-48 bg-slate-300 rounded-md" />
                </div>
              ) : (
                <>
                  {breadcrumb && <p className="ne-breadcrumb">{breadcrumb}</p>}
                  <h1 className="ne-topic-name">{topicName || <span className="ne-topic-placeholder">Loading…</span>}</h1>
                </>
              )}
            </div>
          </div>

          {/* Right: version selector + save + publish */}
          <div className="ne-header-right">
            {loadingNote ? (
              <div className="animate-pulse flex items-center gap-2">
                <div className="h-8 w-24 bg-slate-200 rounded-xl" />
                <div className="h-8 w-28 bg-slate-200 rounded-xl ml-2" />
                <div className="h-8 w-20 bg-slate-200 rounded-xl ml-2" />
              </div>
            ) : (
              <>
                {noteData?.topic && (
                  <span className={`ne-badge ${noteData.topic.is_published ? 'ne-badge--published' : 'ne-badge--draft'}`}>
                    {noteData.topic.is_published ? <Globe size={12} /> : <EyeOff size={12} />}
                    {noteData.topic.is_published ? 'Published' : 'Draft'}
                  </span>
                )}

                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing || loadingNote || !numericTopicId || !noteData?.topic}
                  className={`ne-publish-btn ${noteData?.topic?.is_published ? 'ne-publish-btn--published' : ''}`}
                >
                  {publishing ? (
                    <>
                      <SavingLoader label="Publishing..." />
                      Publishing…
                    </>
                  ) : noteData?.topic?.is_published ? (
                    <>
                      <EyeOff size={15} />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <Globe size={15} />
                      Publish
                    </>
                  )}
                </button>

                <label htmlFor="version-select" className="ne-version-label ml-2">Version</label>
                <select
                  id="version-select"
                  value={versionType}
                  onChange={(e) => setVersionType(e.target.value as VersionOption)}
                  disabled={saving || loadingNote}
                  className="ne-version-select"
                >
                  {AVAILABLE_VERSIONS.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  id="save-note-btn"
                  onClick={handleSave}
                  disabled={saving || loadingNote || !numericTopicId || (!isDirty && !saving) || hasJsonError}
                  className={`ne-save-btn ${saving ? 'ne-save-btn--saving' : ''} ${(!isDirty && !saving && !loadingNote) ? 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-600 hover:bg-sky-600/10 hover:text-slate-900 cursor-not-allowed opacity-90' : ''}`}
                  aria-label="Save note content"
                >
                  {saving ? (
                    <>
                      <SavingLoader label="Saving note" />
                      Saving…
                    </>
                  ) : !isDirty ? (
                    <>
                      <CheckCircle2 size={15} aria-hidden="true" className="text-emerald-500" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save size={15} aria-hidden="true" />
                      Save
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status bar */}
        {saveStatus !== 'idle' && (
          <div
            role="status"
            aria-live="polite"
            className={`ne-status-bar${saveStatus === 'success' ? ' ne-status-bar--success' : ' ne-status-bar--error'}`}
          >
            {saveMessage}
          </div>
        )}
      </header>

      {/* ── Page Body ────────────────────────────────────────────────────────── */}
      <div className="ne-body">

        {/* Loading state */}
        {loadingNote && <EditorSkeleton />}

        {/* Load error */}
        {!loadingNote && loadError && (
          <div role="alert" className="ne-alert ne-alert--error">{loadError}</div>
        )}

        {/* Non-subtopic notice */}
        {!loadingNote && !loadError && !isSubtopic && noteData && (
          <div role="note" className="ne-alert ne-alert--info">
            Only <strong>subtopic</strong> nodes can store note content. This node is a{' '}
            <strong>{noteData.topic.type}</strong> and cannot have notes attached.
          </div>
        )}

        {/* Main Content */}
        {!loadingNote && !loadError && (
          <div className="ne-vertical-layout">

            <div className="ne-view-toggle">
              <button
                type="button"
                className={`ne-view-toggle-btn ${viewMode === 'editor' ? 'ne-view-toggle-btn--active' : ''}`}
                onClick={() => setViewMode('editor')}
              >Editor</button>
              <button
                type="button"
                className={`ne-view-toggle-btn ${viewMode === 'preview' ? 'ne-view-toggle-btn--active' : ''}`}
                onClick={() => setViewMode('preview')}
              >Preview</button>
            </div>

            {hasJsonError && contentInput.trim() && viewMode === 'editor' && (
              <div role="alert" aria-live="polite" className="ne-alert ne-alert--error ne-json-error mb-4">
                <strong>JSON Error:</strong> {jsonError}
              </div>
            )}

            <section
              className="ne-pane ne-pane--editor"
              aria-label="JSON content editor"
              style={{ display: viewMode === 'editor' ? 'flex' : 'none' }}
            >
              <textarea
                id="json-editor"
                value={contentInput}
                onChange={(e) => setContentInputs(prev => ({ ...prev, [versionType]: e.target.value }))}
                placeholder={PLACEHOLDER_JSON}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                className={`ne-editor-textarea${hasJsonError && contentInput.trim() ? ' ne-editor-textarea--error' : ''}`}
                aria-label="Note JSON content"
                aria-describedby={hasJsonError ? 'json-error-msg' : undefined}
              />
            </section>

            <section
              className="ne-pane ne-pane--preview"
              aria-label="Live content preview"
              style={{ display: viewMode === 'preview' ? 'flex' : 'none' }}
            >
              <div className="ne-preview-scroll">
                {parsedPreview ? (
                  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                  <NoteContent version={parsedPreview as Record<string, any>} />
                ) : hasJsonError && contentInput.trim() ? (
                  <div className="ne-preview-empty ne-preview-empty--error">
                    <span aria-hidden="true">⚠</span>
                    <p>Fix the JSON error to see the preview.</p>
                  </div>
                ) : (
                  <div className="ne-preview-empty">
                    <span aria-hidden="true">✦</span>
                    <p>Start typing valid JSON on the left<br />to see the live preview here.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
