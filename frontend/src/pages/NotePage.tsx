import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TableOfContents from '../components/TableOfContents'
import VersionTabs from '../components/VersionTabs'
import NoteContent from '../components/NoteContent'
import CompareMode from '../components/CompareMode'
import { useNote } from '../hooks/useNote'
import NotFound from './NotFound'

const VERSION_ORDER = ['simple', 'industry', 'interview', 'revision', 'realtime', 'theory']

export default function NotePage() {
  const { slug } = useParams()
  const { note, loading, error, version, setVersion } = useNote(slug)

  const [compareMode, setCompareMode] = useState(false)
  const [compareLeft, setCompareLeft] = useState('simple')
  const [compareRight, setCompareRight] = useState('industry')

  if (loading) {
    return (
      <div className="mt-[80px] grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)_220px]">
        <div className="hidden lg:block" />
        <div className="space-y-4 px-2 py-6">
          <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
          <div className="h-10 w-3/4 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
          <div className="h-4 w-5/6 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-6 h-48 animate-pulse rounded-2xl bg-slate-100" />
        </div>
        <div className="hidden lg:block" />
      </div>
    )
  }

  if (error || !note) {
    return <NotFound message="The note you are looking for could not be found." />
  }

  const availableVersions = VERSION_ORDER.filter((v) => note.versions?.[v] != null)
  const activeVersion = version && availableVersions.includes(version) ? version : (availableVersions[0] ?? 'simple')
  const content = note.versions?.[activeVersion] ?? {}
  const breadcrumb = note.topic ? `${note.topic} › ${note.title}` : note.title

  return (
    <div className="space-y-0">
      {/* Floating version tabs */}
      <VersionTabs
        selectedVersion={activeVersion}
        availableVersions={availableVersions}
        onSelectVersion={(v) => { setCompareMode(false); setVersion(v) }}
        compareMode={compareMode}
        onToggleCompare={() => setCompareMode((m) => !m)}
      />

      <div className={`mt-[72px] gap-6 ${compareMode ? 'flex flex-col px-4 lg:px-6' : 'grid lg:grid-cols-[260px_minmax(0,1fr)_220px]'}`}>
        {/* Sidebar — hidden in compare mode on mobile */}
        {!compareMode && <Sidebar />}

        {/* Main content */}
        <div className="min-w-0">
          {compareMode ? (
            <>
              {/* Compare header */}
              <div className="mb-4 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3">
                <p className="text-sm font-semibold text-violet-800">
                  Compare Mode — Select a version in each column to compare them side by side
                </p>
              </div>
              <CompareMode
                versions={note.versions ?? {}}
                leftVersion={compareLeft}
                rightVersion={compareRight}
                availableVersions={availableVersions}
                onChangeLeft={setCompareLeft}
                onChangeRight={setCompareRight}
              />
            </>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-sm">
              <div className="mx-auto max-w-3xl">
                {/* Article header */}
                <header className="border-b border-slate-100 pb-6">
                  <div className="mb-4 h-1 w-20 rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-200" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    {breadcrumb}
                  </p>
                  <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                    {note.title}
                  </h1>
                  <p className="mt-4 text-base leading-8 text-slate-500">
                    Read the same concept through multiple layers — pick the view that matches where you are right now.
                  </p>

                  {/* Available versions pill row */}
                  {availableVersions.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {availableVersions.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setVersion(v)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                            v === activeVersion
                              ? 'bg-brand-orange text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {v.charAt(0).toUpperCase() + v.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </header>

                <div className="pt-6">
                  <NoteContent version={content} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table of contents — only in normal mode */}
        {!compareMode && <TableOfContents content={content} />}
      </div>
    </div>
  )
}
