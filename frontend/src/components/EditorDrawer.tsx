import { useEffect, useMemo, useState } from 'react'
import type { CurriculumNode, TopicNoteData } from '../types'

interface EditorDrawerProps {
  node: CurriculumNode
  isOpen: boolean
  loading: boolean
  error: string
  noteData: TopicNoteData | null
  onClose: () => void
  onSave: (versionType: string, content: object) => Promise<void>
  saving: boolean
  saveStatus: string
}

const versionOptions = ['simple', 'industry', 'interview', 'professional']

function getNodeType(node: CurriculumNode) {
  return node.type ?? node.level
}

export default function EditorDrawer({
  node,
  isOpen,
  loading,
  error,
  noteData,
  onClose,
  onSave,
  saving,
  saveStatus,
}: EditorDrawerProps) {
  const nodeType = getNodeType(node)
  const [versionType, setVersionType] = useState('industry')
  const [contentInput, setContentInput] = useState('')
  const [localError, setLocalError] = useState('')

  const activeContent = useMemo(() => {
    return noteData?.versions?.[versionType]
  }, [noteData, versionType])

  useEffect(() => {
    if (!isOpen) {
      setLocalError('')
      return
    }

    setVersionType('industry')
    setLocalError('')
    setContentInput(activeContent ? JSON.stringify(activeContent, null, 2) : '')
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setContentInput(activeContent ? JSON.stringify(activeContent, null, 2) : '')
  }, [activeContent, isOpen, versionType])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLocalError('')

    try {
      const parsed = JSON.parse(contentInput)
      await onSave(versionType, parsed)
    } catch (err) {
      setLocalError(err instanceof SyntaxError ? 'Enter valid JSON before saving.' : 'Unable to save content.')
    }
  }

  return (
    <div className={`fixed inset-0 z-40 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-slate-950/30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-[520px] transform bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Editor</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">{node.name}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {nodeType === 'topic' ? 'Edit note content for this topic.' : 'Only topic leaves can store content.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
            {localError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {localError}
              </div>
            ) : null}
            {saveStatus ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {saveStatus}
              </div>
            ) : null}

            <div className="mt-6 space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <label className="block text-sm font-semibold text-slate-700">Version</label>
                <select
                  value={versionType}
                  onChange={(event) => setVersionType(event.target.value)}
                  className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
                >
                  {versionOptions.map((version) => (
                    <option key={version} value={version}>
                      {version}
                    </option>
                  ))}
                </select>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block text-sm font-semibold text-slate-700">JSON content</label>
                <textarea
                  value={contentInput}
                  onChange={(event) => setContentInput(event.target.value)}
                  rows={18}
                  placeholder='{"definition":"...","examples":[]}'
                  className="block w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 font-mono text-sm leading-6 text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={saving || loading}
                  className="inline-flex w-full items-center justify-center rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving || loading ? 'Saving...' : 'Save content'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
