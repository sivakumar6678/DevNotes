import { useParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TableOfContents from '../components/TableOfContents'
import VersionTabs from '../components/VersionTabs'
import NoteContent from '../components/NoteContent'
import { useNote } from '../hooks/useNote'
import NotFound from './NotFound'

export default function NotePage() {
  const { slug } = useParams()
  const { note, loading, error, version, setVersion } = useNote(slug)

  if (loading) {
    return <div className="px-4 py-12 text-sm text-brand-muted">Loading note...</div>
  }

  if (error || !note) {
    return <NotFound message="The note you are looking for could not be found." />
  }

  const content = note.versions?.[version] || {}
  const breadcrumb = note.topic ? `${note.topic} / ${note.title}` : note.title

  return (
    <div className="space-y-6">
      <div className="w-full">
        <VersionTabs selectedVersion={version} onSelectVersion={setVersion} />
      </div>

      <div className="mt-[80px] grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)_240px]">
        <Sidebar />

        <div className="min-w-0">
          <div className="brand-panel px-6 py-6">
            <div className="mx-auto max-w-3xl">
              <header className="border-b border-slate-200 pb-6">
                <div className="mb-5 h-1 w-24 rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-200" />
                <p className="brand-label">{breadcrumb}</p>
                <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-brand-ink sm:text-5xl">
                  {note.title}
                </h1>
                <p className="mt-4 text-lg leading-8 text-brand-muted">
                  Read the same concept through multiple layers so the explanation matches where you are right now.
                </p>
              </header>

              <div className="pt-6">
                <NoteContent version={content} />
              </div>
            </div>
          </div>
        </div>

        <TableOfContents content={content} />
      </div>
    </div>
  )
}
