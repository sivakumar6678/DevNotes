import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, ChevronDown, ChevronUp, Save } from 'lucide-react'
import { PrimaryLoader, SavingLoader } from '../components/Loader'
import NoteContent from '../components/NoteContent'
import { fetchNoteByTopic, createVersion } from '../api/curriculum'
import type { TopicNoteData } from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const VERSION_OPTIONS = ['simple', 'industry', 'interview', 'revision', 'realtime', 'theory'] as const
type VersionOption = (typeof VERSION_OPTIONS)[number]

const SCHEMA_FIELDS: { key: string; type: string; description: string }[] = [
  { key: 'definition', type: 'string', description: 'A concise definition of the topic.' },
  { key: 'problem_it_solves', type: 'string', description: 'What problem this concept addresses.' },
  { key: 'detailed_explanation', type: 'string', description: 'In-depth multi-paragraph explanation.' },
  { key: 'core_concepts', type: 'Array<{name, explanation}>', description: 'Key sub-concepts as a list.' },
  { key: 'how_it_works', type: 'string', description: 'Step-by-step mechanism description.' },
  { key: 'syntax', type: 'string | Array<{title, language, code}>', description: 'Syntax snippets or blocks.' },
  { key: 'code_example', type: 'string | Array<{title, language, code}>', description: 'Code examples with optional language.' },
  { key: 'practical_example', type: 'Array<{title, description, code, explanation, language}>', description: 'Worked practical examples.' },
  { key: 'real_world_example', type: 'Array<{title, description}>', description: 'Real-world usage scenarios.' },
  { key: 'common_mistakes', type: 'string[]', description: 'Pitfalls and common errors.' },
  { key: 'best_practices', type: 'string[]', description: 'Recommended patterns and conventions.' },
  { key: 'interview_notes', type: 'Array<{question, answer}>', description: 'Q&A pairs for interview prep.' },
]

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

// ─── Schema Guide ─────────────────────────────────────────────────────────────

function SchemaGuide() {
  const [open, setOpen] = useState(false)

  return (
    <section className="ne-schema-guide" aria-label="JSON Schema Reference">
      <button
        type="button"
        id="schema-toggle"
        aria-expanded={open}
        aria-controls="schema-body"
        onClick={() => setOpen((o) => !o)}
        className="ne-schema-toggle"
      >
        <span className="ne-schema-toggle-label">
          <BookOpen size={14} aria-hidden="true" />
          JSON Schema Reference
        </span>
        {open ? <ChevronUp size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />}
      </button>

      {open && (
        <div id="schema-body" role="region" aria-labelledby="schema-toggle" className="ne-schema-body">
          <p className="ne-schema-intro">
            Your JSON content may contain any combination of the following top-level keys.
            All fields are optional — include only what's relevant.
          </p>
          <div className="ne-schema-table-wrap">
            <table className="ne-schema-table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {SCHEMA_FIELDS.map((f) => (
                  <tr key={f.key}>
                    <td><code className="ne-code-pill">{f.key}</code></td>
                    <td><span className="ne-type-pill">{f.type}</span></td>
                    <td>{f.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ne-schema-tip">
            <strong>Tip:</strong> Switch versions to copy an existing content structure, then modify it for the new version.
          </div>
        </div>
      )}
    </section>
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
  const [contentInput, setContentInput] = useState('')
  const [jsonError, setJsonError] = useState('')

  // Save state
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [saveMessage, setSaveMessage] = useState('')

  // ── Load note data ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!numericTopicId) return
    let cancelled = false

    async function load() {
      setLoadingNote(true)
      setLoadError('')
      try {
        const data = await fetchNoteByTopic(numericTopicId!)
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

  // ── Sync textarea when version or noteData changes ────────────────────────
  useEffect(() => {
    const versionContent = noteData?.versions?.[versionType]
    setContentInput(versionContent ? JSON.stringify(versionContent, null, 2) : '')
    setJsonError('')
    setSaveStatus('idle')
    setSaveMessage('')
  }, [versionType, noteData])

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
      // Refresh note data to keep version switcher in sync
      const fresh = await fetchNoteByTopic(numericTopicId)
      setNoteData(fresh)
      // Auto-clear success message after 4 s
      setTimeout(() => { setSaveStatus('idle'); setSaveMessage('') }, 4000)
    } catch (err) {
      setSaveStatus('error')
      setSaveMessage(err instanceof Error ? err.message : 'Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }, [numericTopicId, versionType, contentInput])

  // ── Derived ───────────────────────────────────────────────────────────────
  const topicName = noteData?.topic?.name ?? (loadingNote ? '' : `Topic #${topicId}`)
  const breadcrumb = noteData?.topic?.breadcrumb ?? ''
  const isSubtopic = noteData?.topic?.type === 'topic' // backend sends type='topic' for subtopic-level
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
              {breadcrumb && <p className="ne-breadcrumb">{breadcrumb}</p>}
              <h1 className="ne-topic-name">{topicName || <span className="ne-topic-placeholder">Loading…</span>}</h1>
            </div>
          </div>

          {/* Right: version selector + save */}
          <div className="ne-header-right">
            <label htmlFor="version-select" className="ne-version-label">Version</label>
            <select
              id="version-select"
              value={versionType}
              onChange={(e) => setVersionType(e.target.value as VersionOption)}
              disabled={saving || loadingNote}
              className="ne-version-select"
            >
              {VERSION_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </option>
              ))}
            </select>

            <button
              type="button"
              id="save-note-btn"
              onClick={handleSave}
              disabled={saving || loadingNote || !numericTopicId || hasJsonError}
              className={`ne-save-btn${saving ? ' ne-save-btn--saving' : ''}`}
              aria-label="Save note content"
            >
              {saving ? (
                <>
                  <SavingLoader label="Saving note" />
                  Saving…
                </>
              ) : (
                <>
                  <Save size={15} aria-hidden="true" />
                  Save
                </>
              )}
            </button>
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
        {loadingNote && <PrimaryLoader className="ne-loader" label="Loading note content" />}

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

        {/* Editor area */}
        {!loadingNote && !loadError && (
          <>
            {/* Schema guide */}
            <SchemaGuide />

            {/* JSON error banner */}
            {hasJsonError && contentInput.trim() && (
              <div role="alert" aria-live="polite" className="ne-alert ne-alert--error ne-json-error">
                <strong>JSON Error:</strong> {jsonError}
              </div>
            )}

            {/* Split pane */}
            <div className="ne-split">

              {/* Left: Editor */}
              <section className="ne-pane ne-pane--editor" aria-label="JSON content editor">
                <div className="ne-pane-header">
                  <h2 className="ne-pane-title">JSON Editor</h2>
                  <span className="ne-pane-badge">
                    {hasJsonError && contentInput.trim() ? '⚠ Invalid JSON' : contentInput.trim() ? '✓ Valid JSON' : 'Empty'}
                  </span>
                </div>
                <textarea
                  id="json-editor"
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  placeholder={PLACEHOLDER_JSON}
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="off"
                  className={`ne-editor-textarea${hasJsonError && contentInput.trim() ? ' ne-editor-textarea--error' : ''}`}
                  aria-label="Note JSON content"
                  aria-describedby={hasJsonError ? 'json-error-msg' : undefined}
                />
              </section>

              {/* Right: Preview */}
              <section className="ne-pane ne-pane--preview" aria-label="Live content preview">
                <div className="ne-pane-header">
                  <h2 className="ne-pane-title">Live Preview</h2>
                  <span className="ne-pane-badge ne-pane-badge--preview">
                    {versionType.charAt(0).toUpperCase() + versionType.slice(1)}
                  </span>
                </div>
                <div className="ne-preview-scroll">
                  {parsedPreview ? (
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
          </>
        )}
      </div>
    </div>
  )
}
