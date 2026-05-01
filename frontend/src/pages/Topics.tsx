import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getTopics } from '../api/api'
import { PrimaryLoader } from '../components/Loader'
import type { Topic } from '../types'

// ─── Layout tokens ────────────────────────────────────────────────────────────
// Full-width padding — no max-width, content stretches edge to edge
const PAGE_PADDING = 'w-full px-6 sm:px-8 lg:px-12 xl:px-16'

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function formatHeading(value: string): string {
  if (!value) return 'Topics'
  return value.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
}

function countLeaves(topics: Topic[]): number {
  let n = 0
  for (const t of topics) {
    const has = Array.isArray(t.children) && t.children.length > 0
    n += has ? countLeaves(t.children!) : 1
  }
  return n
}

function countDirectChildren(m: Topic): number {
  return Array.isArray(m.children) ? m.children.length : 0
}

function findFirstLeafSlug(topics: Topic[]): string | null {
  for (const t of topics) {
    if (!(Array.isArray(t.children) && t.children.length > 0)) return t.slug
    const found = findFirstLeafSlug(t.children!)
    if (found) return found
  }
  return null
}

function estimateHours(leafCount: number) {
  const min = Math.max(1, Math.round((leafCount * 8) / 60))
  const max = Math.max(2, Math.round((leafCount * 12) / 60))
  return min === max ? `~${min}h` : `${min}–${max}h`
}

// ─── LeafList ─────────────────────────────────────────────────────────────────

function LeafList({ topics, navigate }: { topics: Topic[]; navigate: ReturnType<typeof useNavigate> }) {
  return (
    <ul className="flex flex-col gap-1" role="list">
      {topics.map((leaf) => (
        <li key={leaf.slug}>
          <button
            type="button"
            onClick={() => navigate(`/notes/${leaf.slug}`)}
            className="group/leaf flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-all duration-200 ease-in-out hover:bg-brand-orange/10 hover:border-black hover:shadow-sm"
          >
            <span className="mt-[0.2em] shrink-0 text-[11px] text-brand-border transition-colors group-hover/leaf:text-brand-orange" aria-hidden="true">→</span>
            <span className="text-[0.88rem] font-medium leading-snug text-brand-muted transition-colors group-hover/leaf:text-brand-ink">
              {leaf.name}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

// ─── SubModuleList ────────────────────────────────────────────────────────────

function SubModuleList({ topics, navigate }: { topics: Topic[]; navigate: ReturnType<typeof useNavigate> }) {
  type Node = { type: 'leaves'; items: Topic[] } | { type: 'branch'; item: Topic }
  const nodes: Node[] = []
  let pending: Topic[] = []
  for (const t of topics) {
    const has = Array.isArray(t.children) && t.children.length > 0
    if (has) {
      if (pending.length) { nodes.push({ type: 'leaves', items: pending }); pending = [] }
      nodes.push({ type: 'branch', item: t })
    } else { pending.push(t) }
  }
  if (pending.length) nodes.push({ type: 'leaves', items: pending })

  return (
    <div className="flex flex-col gap-3">
      {nodes.map((node, i) => {
        if (node.type === 'leaves') return <LeafList key={`l-${i}`} topics={node.items} navigate={navigate} />
        const branch = node.item!
        return (
          <div key={branch.slug} className="flex flex-col gap-1.5">
            <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-brand-ink/40">{branch.name}</p>
            <div className="pl-3 border-l-2 border-brand-border/30">
              <SubModuleList topics={branch.children!} navigate={navigate} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── ModuleBlock ──────────────────────────────────────────────────────────────

function ModuleBlock({ module: mod, navigate }: { module: Topic; navigate: ReturnType<typeof useNavigate> }) {
  const count = countDirectChildren(mod)
  return (
    <article className="flex flex-col gap-3.5 rounded-xl border border-brand-border/60 bg-white px-5 py-5 shadow-sm transition-all duration-200 hover:border-brand-orange/30 hover:shadow-md">
      <div className="flex items-center justify-between gap-3 border-b border-brand-border/40 pb-3">
        <h3 className="font-display text-[1.05rem] font-semibold tracking-tight text-brand-ink">{mod.name}</h3>
        {count > 0 && (
          <span className="shrink-0 rounded-full bg-brand-bg px-2 py-0.5 text-[0.7rem] font-medium tabular-nums text-brand-muted border border-brand-border/50">
            {count} {count === 1 ? 'topic' : 'topics'}
          </span>
        )}
      </div>
      <div>
        {Array.isArray(mod.children) && mod.children.length > 0
          ? <SubModuleList topics={mod.children} navigate={navigate} />
          : <p className="text-sm italic text-brand-muted/60">No topics yet.</p>}
      </div>
    </article>
  )
}

// ─── ModulesGrid ──────────────────────────────────────────────────────────────

function ModulesGrid({ topics, navigate }: { topics: Topic[]; navigate: ReturnType<typeof useNavigate> }) {
  const modules: Topic[] = []
  const orphans: Topic[] = []
  for (const t of topics) {
    ; (Array.isArray(t.children) && t.children.length > 0 ? modules : orphans).push(t)
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 items-start">
      {modules.map((m) => <ModuleBlock key={m.slug} module={m} navigate={navigate} />)}
      {orphans.length > 0 && (
        <article className="flex flex-col gap-3.5 rounded-xl border border-brand-border/60 bg-white px-5 py-5 shadow-sm transition-all duration-200 hover:border-brand-orange/50 hover:shadow-md">
          <div className="flex items-center justify-between gap-3 border-b border-brand-border/40 pb-3">
            <h3 className="font-display text-[1.05rem] font-semibold tracking-tight text-brand-ink">General Topics</h3>
            <span className="shrink-0 rounded-full bg-brand-bg px-2 py-0.5 text-[0.7rem] font-medium tabular-nums text-brand-muted border border-brand-border/50">
              {orphans.length} {orphans.length === 1 ? 'topic' : 'topics'}
            </span>
          </div>
          <LeafList topics={orphans} navigate={navigate} />
        </article>
      )}
    </div>
  )
}

// ─── SidebarPanel ─────────────────────────────────────────────────────────────

function SidebarPanel({ techName, leafCount }: { techName: string; leafCount: number }) {
  const timeLabel = estimateHours(leafCount)
  return (
    <aside className="flex flex-col gap-5 lg:sticky lg:top-[7.5rem]" aria-label="Learning path overview">
      {/* Stats */}
      <div className="rounded-xl border border-brand-border/60 bg-white px-5 py-5 shadow-sm">
        <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-brand-muted">Path Overview</p>
        <dl className="flex flex-col gap-2.5">
          {[
            { label: 'Level', value: 'Beginner → Intermediate' },
            { label: 'Est. time', value: timeLabel },
            ...(leafCount > 0 ? [{ label: 'Lessons', value: String(leafCount) }] : []),
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between gap-2 border-b border-brand-border/30 pb-2 last:border-0 last:pb-0">
              <dt className="text-[0.8rem] text-brand-muted/80">{label}</dt>
              <dd className="text-[0.8rem] font-semibold text-brand-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* What you'll learn */}
      <div className="rounded-xl border border-brand-border/60 bg-white px-5 py-5 shadow-sm">
        <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-brand-muted">What you'll learn</p>
        <ul className="flex flex-col gap-3" role="list">
          {[
            `Core concepts & fundamentals of ${techName}`,
            'Practical real-world patterns',
            'Common pitfalls to avoid',
            'Interview tips & best practices',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-[0.82rem] leading-snug text-brand-ink/80">
              <span className="mt-[0.15em] shrink-0 text-brand-orange" aria-hidden="true">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Tip */}
      <div className="rounded-lg bg-brand-orangeSoft/60 p-4 border border-orange-100/80">
        <p className="text-[0.78rem] leading-relaxed text-orange-900/70">
          <span className="font-semibold text-orange-800">Tip:</span>{' '}
          Follow modules top to bottom for the best experience.
        </p>
      </div>
    </aside>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero({
  techName, leafCount, hasContent, firstLeafSlug, navigate,
}: {
  techName: string; leafCount: number; hasContent: boolean
  firstLeafSlug: string | null; navigate: ReturnType<typeof useNavigate>
}) {
  const timeLabel = estimateHours(leafCount)
  return (
    <div
      className="relative w-full"
      style={{
        background: [
          'radial-gradient(ellipse 80% 65% at 5% 20%, rgba(249, 115, 22, 0.25), transparent 60%)',
          'radial-gradient(ellipse 55% 50% at 92% 8%, rgba(250, 204, 21, 0.20), transparent 55%)',
          'linear-gradient(180deg, #fff3e6 0%, #faf8f5 40%, var(--brand-bg) 100%)',
        ].join(', '),
      }}
    >
      {/* Bottom separator — gradient line + soft shadow fade */}
      <div className="absolute inset-x-0 bottom-0 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent 5%, var(--brand-border) 30%, var(--brand-border) 70%, transparent 95%)' }} aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-6 pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(15, 23, 42, 0.08) 100%)' }} aria-hidden="true" />

      <div className={`${PAGE_PADDING} py-10 lg:py-14`}>
        <Link to="/technologies" className="inline-flex items-center gap-1.5 text-[0.78rem] font-semibold uppercase tracking-widest text-brand-muted/70 transition-colors hover:text-brand-orange" aria-label="Back to all technologies">
          <span aria-hidden="true">&larr;</span> All Technologies
        </Link>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-[2.25rem] font-bold tracking-tight text-brand-ink lg:text-[2.75rem] lg:leading-[1.15]">{techName}</h1>
            <p className="mt-3 text-[1rem] leading-relaxed text-brand-muted">
              A structured path from fundamentals to advanced concepts — built for focused, calm learning.
            </p>
            {hasContent && (
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.82rem] text-brand-muted font-medium">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-orangeSoft px-3 py-1 text-brand-orange border border-orange-200/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" aria-hidden="true" />
                  Beginner → Intermediate
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-brand-muted/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  {leafCount} lessons
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-brand-muted/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {timeLabel} estimated
                </span>
              </div>
            )}
          </div>

          {hasContent && firstLeafSlug && (
            <div className="shrink-0">
              <button type="button" onClick={() => navigate(`/notes/${firstLeafSlug}`)} className="brand-button-primary gap-2 px-6 py-3 text-[0.88rem] font-semibold" aria-label={`Start learning ${techName}`}>
                Start with Basics <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Topics() {
  const navigate = useNavigate()
  const { tech_slug: techSlug = '' } = useParams()
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const techName = formatHeading(techSlug)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true); setError('')
        const data = await getTopics(techSlug)
        if (!cancelled) setTopics(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load topics.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (techSlug) load()
    else { setLoading(false); setTopics([]) }
    return () => { cancelled = true }
  }, [techSlug])

  const leafCount = useMemo(() => countLeaves(topics), [topics])
  const firstLeafSlug = useMemo(() => findFirstLeafSlug(topics), [topics])
  const hasContent = !loading && !error && topics.length > 0

  return (
    <div className="flex flex-col">

      {/* ── Full-bleed Hero ── */}
      <Hero techName={techName} leafCount={leafCount} hasContent={hasContent} firstLeafSlug={firstLeafSlug} navigate={navigate} />

      {/* ── Full-width page body ── */}
      <div className={`${PAGE_PADDING} py-10 lg:py-12`}>

        {loading && (
          <PrimaryLoader className="min-h-[280px]" label="Loading topics" />
        )}

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700" role="alert">{error}</p>
        )}

        {!loading && !error && topics.length === 0 && (
          <div className="rounded-2xl border border-brand-border bg-white p-14 text-center shadow-sm">
            <p className="text-lg font-medium text-brand-ink">No curriculum found for this technology yet.</p>
            <p className="mt-2 text-sm text-brand-muted">Check back later for new modules and topics.</p>
          </div>
        )}

        {/* ── Grid layout: 300px sidebar | flexible content ── */}
        {hasContent && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr] lg:gap-10">

            {/* Left sidebar */}
            <SidebarPanel techName={techName} leafCount={leafCount} />

            {/* Right: curriculum */}
            <section className="min-w-0" aria-label={`${techName} curriculum`}>
              <div className="mb-6 border-b border-brand-border/50 pb-4">
                <h2 className="font-display text-2xl font-bold tracking-tight text-brand-ink">Curriculum</h2>
                <p className="mt-1 text-[0.88rem] text-brand-muted/80">
                  Choose a module below to begin. Follow the sequence top to bottom for best results.
                </p>
              </div>
              <ModulesGrid topics={topics} navigate={navigate} />
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
