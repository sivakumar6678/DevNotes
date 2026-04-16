import { Link } from 'react-router-dom'
import { featureHighlights, popularTopics, recentNotes } from '../data/docsData'

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl space-y-16 px-6 lg:px-8">
      <section className="brand-panel brand-grid overflow-hidden py-16">
        <div className="grid gap-10 px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-10">
          <div className="space-y-6">
            <p className="brand-label">VelStack Learning Platform</p>
            <h1 className="max-w-3xl font-display text-5xl font-semibold tracking-tight text-brand-ink sm:text-6xl">
              Structured notes that feel like a real developer product
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-brand-muted">
              Learn HTML, CSS, JavaScript, and MySQL through a layered path: basic, real-world, production, and interview. Built for readability, repetition, and practical growth.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="brand-pill">Basic to interview-ready</span>
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-brand-goldSoft px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-800">
                Focused on clarity
              </span>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link to="/technologies" className="brand-button-primary">
                Start Learning
              </Link>
              <Link to="/categories" className="brand-button-secondary">
                Browse Categories
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.75rem] bg-brand-ink p-6 text-white shadow-float">
              <p className="text-sm uppercase tracking-[0.26em] text-slate-300">Layered learning</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {['Basic', 'Real-world', 'Production', 'Interview'].map((item, index) => (
                  <span
                    key={item}
                    className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                      index === 3 ? 'bg-brand-orange text-white' : 'bg-white/10 text-slate-100'
                    }`}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-amber-200 bg-[linear-gradient(135deg,_#fff7ed,_#fefce8)] p-6">
              <p className="text-sm uppercase tracking-[0.26em] text-amber-700">Brand Promise</p>
              <p className="mt-3 text-base leading-relaxed text-slate-700">
                Calm docs experience, strong developer readability, and just enough identity to feel like a serious startup platform.
              </p>
              <div className="mt-5 h-px bg-gradient-to-r from-amber-300 via-orange-300 to-transparent" />
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Orange drives action. Gold marks progression. Slate protects readability.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5 py-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="brand-label">Core topics</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-brand-ink">
              Start from the foundations that matter most
            </h2>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {popularTopics.map((topic) => (
            <article
              key={topic.name}
              className="group rounded-[1.75rem] border border-brand-border bg-white p-5 shadow-brand transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-float"
            >
              <div className={`h-2 w-20 rounded-full ${topic.accent}`} />
              <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-brand-ink">{topic.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-brand-muted">{topic.description}</p>
              <div className="mt-5 inline-flex items-center text-sm font-semibold text-brand-orange">
                Explore topic
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 py-16 lg:grid-cols-3">
        {featureHighlights.map((feature) => (
          <article key={feature.title} className="rounded-[1.75rem] border border-brand-border bg-white/85 p-6 shadow-brand backdrop-blur-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-600">Why it works</p>
            <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-brand-ink">{feature.title}</h3>
            <p className="mt-3 leading-relaxed text-brand-muted">{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="space-y-5 py-16">
        <div>
          <p className="brand-label">Recent notes</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-brand-ink">
            Fresh reading paths for focused study
          </h2>
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          {recentNotes.map((note) => (
            <article
              key={note.slug}
              className="rounded-[1.75rem] border border-brand-border bg-white p-6 shadow-brand transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-float"
            >
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-orange-600">{note.topic}</p>
                  <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-brand-ink">{note.title}</h3>
                </div>
                <p className="leading-relaxed text-brand-muted">{note.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-orange-200 bg-brand-orangeSoft px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-orange-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <Link to={`/notes/${note.slug}`} className="brand-button-primary mt-6">
                Open note
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
