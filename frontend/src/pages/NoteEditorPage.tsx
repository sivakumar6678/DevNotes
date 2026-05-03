import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp, Save, Globe, EyeOff, Info } from 'lucide-react'
import { PrimaryLoader, SavingLoader } from '../components/Loader'
import NoteContent from '../components/NoteContent'
import { fetchNoteByTopic, createVersion, updateTopic } from '../api/curriculum'
import type { TopicNoteData } from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

export const AVAILABLE_VERSIONS = [
  { id: 'simple', label: 'Simple' },
  { id: 'industry', label: 'Industry' },
  { id: 'interview', label: 'Interview' },
  { id: 'revision', label: 'Revision' },
  { id: 'realtime', label: 'Realtime' },
  { id: 'theory', label: 'Theory' },
  { id: 'real-world', label: 'Real World' }
] as const

type VersionOption = string

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

const DEFAULT_PROMPT = `Convert the following content into a JSON object matching this schema.

Return ONLY valid JSON, no markdown formatting.

Keys available:
definition (string), problem_it_solves (string), detailed_explanation (string), core_concepts (Array<{name, explanation}>), how_it_works (string), syntax (string | Array<{title, language, code}>), code_example (string | Array<{title, language, code}>), practical_example (Array<{title, description, code, explanation, language}>), real_world_example (Array<{title, description}>), common_mistakes (string[]), best_practices (string[]), interview_notes (Array<{question, answer}>).`

function InstructionsPanel() {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'upload' | 'schema' | 'prompt'>('upload')
  const [promptContent, setPromptContent] = useState(DEFAULT_PROMPT)

  return (
    <section className="ne-instructions-panel">
      <button 
        type="button" 
        className="ne-instructions-header w-full flex justify-between"
        onClick={() => setOpen(!open)}
      >
        <span className="flex items-center gap-2"><Info size={16} /> Instructions & Configuration</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <>
          <div className="ne-instructions-tabs">
            <button 
              className={`ne-tab-btn ${activeTab === 'upload' ? 'ne-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >How to Upload</button>
            <button 
              className={`ne-tab-btn ${activeTab === 'schema' ? 'ne-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('schema')}
            >JSON Schema</button>
            <button 
              className={`ne-tab-btn ${activeTab === 'prompt' ? 'ne-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('prompt')}
            >AI Prompt</button>
          </div>

          <div className="ne-instructions-body">
            {activeTab === 'upload' && (
              <div>
                <p><strong>1. Gather content:</strong> Find raw content or documentation for the topic.</p>
                <p><strong>2. Select version:</strong> Choose the appropriate version from the dropdown above.</p>
                <p><strong>3. Convert to JSON:</strong> Use the provided AI prompt to convert your raw content into the required JSON structure.</p>
                <p><strong>4. Test and Save:</strong> Paste the JSON into the editor, toggle the Preview to verify, and save your changes.</p>
              </div>
            )}
            
            {activeTab === 'schema' && (
              <div>
                <p>Your JSON content may contain any combination of these top-level keys. All fields are optional.</p>
                <table className="ne-schema-table mt-4 w-full text-left border-collapse">
                  <tbody>
                    {SCHEMA_FIELDS.map((f) => (
                      <tr key={f.key}>
                        <td className="py-2 pr-4 border-b border-slate-100"><code className="ne-code-pill font-semibold text-orange-600">{f.key}</code></td>
                        <td className="py-2 pr-4 border-b border-slate-100 text-xs text-purple-600 whitespace-nowrap">{f.type}</td>
                        <td className="py-2 border-b border-slate-100 text-xs text-slate-600">{f.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'prompt' && (
              <div className="flex flex-col gap-2">
                <p>Edit the instructions below to customize how the AI models your content. Copy and paste this prompt along with your raw content into ChatGPT or Claude.</p>
                <textarea 
                  className="ne-prompt-textarea"
                  value={promptContent}
                  onChange={(e) => setPromptContent(e.target.value)}
                  spellCheck={false}
                />
              </div>
            )}
          </div>
        </>
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

          {/* Right: version selector + save + publish */}
          <div className="ne-header-right">
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
              {noteData?.topic?.is_published ? <EyeOff size={15} /> : <Globe size={15} />}
              {noteData?.topic?.is_published ? 'Unpublish' : 'Publish'}
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

        {/* Main Content */}
        {!loadingNote && !loadError && (
          <div className="ne-vertical-layout">
            <InstructionsPanel />

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

            {viewMode === 'editor' ? (
              <section className="ne-pane ne-pane--editor" aria-label="JSON content editor">
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
            ) : (
              <section className="ne-pane ne-pane--preview" aria-label="Live content preview">
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
            )}
          </div>
        )}
      </div>
    </div>
  )
}
