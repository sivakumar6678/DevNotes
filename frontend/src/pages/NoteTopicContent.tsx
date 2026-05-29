import { memo, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { DEFAULT_VERSION } from '../constants'
import VersionTabs from '../components/VersionTabs'
import NoteContent from '../components/NoteContent'
import CompareMode from '../components/CompareMode'
import TableOfContents from '../components/TableOfContents'
import TopicNavigation from '../components/TopicNavigation'
import { InlineLoader } from '../components/Loader'
import { usePageTitle } from '../hooks/usePageTitle'
import { useNote } from '../hooks/useNote'
import { useAdjacentTopics } from '../hooks/useAdjacentTopics'
import NotFound from './NotFound'

/**
 * NoteTopicContent — renders only the note content area.
 *
 * Lives inside <LearnLayout> as an <Outlet /> child. The sidebar is
 * rendered by the parent layout and never remounts when this component
 * changes due to slug navigation.
 */
const NoteTopicContent = memo(function NoteTopicContent() {
  const { slug } = useParams()
  const { note, loading, isTransitioning, error, version, setVersion } = useNote(slug)
  usePageTitle(note?.title)
  const { prev, next } = useAdjacentTopics(slug)

  const [compareMode, setCompareMode] = useState(false)
  const [compareLeft, setCompareLeft] = useState('simple')
  const [compareRight, setCompareRight] = useState(DEFAULT_VERSION)

  // Issue 3: Topic Change Should Automatically Scroll Content To Top
  useEffect(() => {
    if (slug) {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [slug])

  if (error && !note) {
    return (
      <div className="min-w-0">
        <NotFound message="The note you are looking for could not be found." />
      </div>
    )
  }

  if (!note) {
    return (
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white px-6 py-10 shadow-sm">
        <InlineLoader label={loading ? 'Loading note' : 'Preparing note'} />
      </div>
    )
  }

  const availableVersions = note.available_versions || []
  const activeVersion = version && availableVersions.includes(version) ? version : (availableVersions[0] ?? DEFAULT_VERSION)
  const content = note.content ?? {}
  const breadcrumb = note.topic?.name ? `${note.topic.name} › ${note.title}` : note.title

  return (
    <div className="min-w-0 flex flex-col">
      {/* Floating version tabs */}
      <VersionTabs
        selectedVersion={activeVersion}
        availableVersions={availableVersions}
        onSelectVersion={(v) => { setCompareMode(false); setVersion(v) }}
        compareMode={compareMode}
        onToggleCompare={() => setCompareMode((m) => !m)}
      />

      <div className={`gap-6 ${compareMode ? 'flex flex-col' : 'grid lg:grid-cols-[minmax(0,1fr)_220px]'}`}>
        {/* Main content */}
        <div className={`min-w-0 relative transition-opacity duration-200 ${isTransitioning ? 'opacity-70' : 'opacity-100'}`}>
          {(loading || isTransitioning) && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-orange via-amber-400 to-brand-orange animate-pulse rounded-full z-10" />
          )}

          {compareMode ? (
            <>
              {/* Compare header */}
              <div className="mb-4 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3">
                <p className="text-sm font-semibold text-violet-800">
                  Compare Mode — Select a version in each column to compare them side by side
                </p>
              </div>
              <CompareMode
                versions={{ [note.version]: note.content }}
                leftVersion={compareLeft}
                rightVersion={compareRight}
                availableVersions={availableVersions}
                onChangeLeft={setCompareLeft}
                onChangeRight={setCompareRight}
              />
            </>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-sm min-w-0">
              <div className="mx-auto w-full max-w-4xl min-w-0">
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
                </header>

                <div className="pt-8">
                  <NoteContent version={content} />
                </div>

                {/* Sequential topic navigation */}
                <TopicNavigation prev={prev} next={next} />
              </div>
            </div>
          )}
        </div>

        {/* Table of contents — only in normal mode */}
        {!compareMode && <TableOfContents content={content} />}
      </div>
    </div>
  )
})

export default NoteTopicContent
