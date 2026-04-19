import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getTopics } from '../api/api'
import type { Topic } from '../types'

function formatHeading(value: string): string {
  if (!value) return 'Topics'
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function Topics() {
  const navigate = useNavigate()
  const { tech_slug: techSlug = '' } = useParams()
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function renderTopics(items: Topic[], depth = 0) {
    return items.map((topic) => {
      const hasChildren = Array.isArray(topic.children) && topic.children.length > 0
      const paddingClass = depth === 0 ? 'px-6' : 'pl-8 pr-6'

      return (
        <div key={topic.slug} className="space-y-3">
          {hasChildren ? (
            <div
              className={`flex w-full items-center justify-between rounded-[1.5rem] border border-brand-border bg-white ${paddingClass} py-5 text-left shadow-brand`}
            >
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight text-brand-ink">{topic.name}</h2>
                <p className="mt-2 text-sm text-brand-muted">
                  Contains {topic.children!.length} subtopic{topic.children!.length === 1 ? '' : 's'}
                </p>
              </div>
              <span className="text-sm font-semibold text-brand-orange">Module</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate(`/notes/${topic.slug}`)}
              className={`flex w-full items-center justify-between rounded-[1.5rem] border border-brand-border bg-white ${paddingClass} py-5 text-left shadow-brand transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-float`}
            >
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight text-brand-ink">{topic.name}</h2>
                <p className="mt-2 text-sm text-brand-muted">Open note</p>
              </div>
              <span className="text-sm font-semibold text-brand-orange">Read</span>
            </button>
          )}

          {hasChildren ? <div className="space-y-4">{renderTopics(topic.children!, depth + 1)}</div> : null}
        </div>
      )
    })
  }

  useEffect(() => {
    let cancelled = false

    async function loadTopics() {
      try {
        setLoading(true)
        setError('')
        const data = await getTopics(techSlug)
        if (!cancelled) {
          setTopics(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load topics.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    if (techSlug) {
      loadTopics()
    } else {
      setLoading(false)
      setTopics([])
    }

    return () => {
      cancelled = true
    }
  }, [techSlug])

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 sm:px-6">
      <section className="brand-panel p-8">
        <Link to="/technologies" className="text-sm font-semibold text-brand-orange">
          Back to technologies
        </Link>
        <p className="brand-label mt-5">Step 2</p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-brand-ink sm:text-5xl">
          {formatHeading(techSlug)} topics
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-brand-muted">
          Pick a topic to open the note page for this technology.
        </p>
      </section>

      {loading ? <p className="text-sm text-brand-muted">Loading topics...</p> : null}
      {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {!loading && !error ? (
        <section className="space-y-4">
          {topics.length === 0 ? (
            <div className="rounded-[1.75rem] border border-brand-border bg-white p-6 shadow-brand">
              <p className="text-sm text-brand-muted">No topics are available for this technology yet.</p>
            </div>
          ) : (
            <div className="space-y-4">{renderTopics(topics)}</div>
          )}
        </section>
      ) : null}
    </div>
  )
}
