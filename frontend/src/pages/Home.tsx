import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowRight, BookOpen, Briefcase, Clock, Code2, FileText, 
  Layers, Lightbulb, Target, Workflow, Rocket, 
  Zap
} from 'lucide-react'
import { getTechnologies } from '../api/api'
import { PrimaryLoader } from '../components/Loader'
import { usePageTitle } from '../hooks/usePageTitle'
import { useScrollReveal } from '../hooks/useScrollReveal'
import type { Technology } from '../types'

const VERSIONS = [
  { id: 'industry', label: 'Industry', icon: Briefcase, desc: 'How it works in production', hue: 'blue' },
  { id: 'interview', label: 'Interview', icon: Target, desc: 'What interviewers expect', hue: 'purple' },
  { id: 'realworld', label: 'Real World', icon: Zap, desc: 'Practical applications', hue: 'emerald' },
  { id: 'revision', label: 'Revision', icon: Clock, desc: 'Quick refresher format', hue: 'amber' },
  { id: 'theory', label: 'Theory', icon: BookOpen, desc: 'Deep academic concepts', hue: 'pink' },
  { id: 'simple', label: 'Simple', icon: FileText, desc: 'Core idea in plain language', hue: 'orange' },
]

const JOURNEY = [
  { step: '01', title: 'Learn', icon: BookOpen, desc: 'Start with the simple or theory versions to build a strong foundation.' },
  { step: '02', title: 'Understand', icon: Lightbulb, desc: 'Compare concepts side-by-side to grasp the deeper mechanics.' },
  { step: '03', title: 'Build', icon: Code2, desc: 'Switch to the real-world version for practical implementation details.' },
  { step: '04', title: 'Prepare', icon: Target, desc: 'Review the interview version before technical screens.' },
  { step: '05', title: 'Grow', icon: Rocket, desc: 'Master the industry version to understand scale and architecture.' },
]

export default function Home() {
  usePageTitle()
  const [technologies, setTechnologies] = useState<Technology[]>([])
  const [loading, setLoading] = useState(true)

  const heroReveal = useScrollReveal({ triggerOnce: true })
  const methodReveal = useScrollReveal({ triggerOnce: true, threshold: 0.2 })
  const versionReveal = useScrollReveal({ triggerOnce: true, threshold: 0.15 })
  const curriculumReveal = useScrollReveal({ triggerOnce: true, threshold: 0.15 })
  const journeyReveal = useScrollReveal({ triggerOnce: true, threshold: 0.2 })

  useEffect(() => {
    let cancelled = false
    async function loadTechnologies() {
      try {
        const data = await getTechnologies()
        if (!cancelled) setTechnologies(data)
      } catch (err) {
        console.error(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadTechnologies()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="mx-auto max-w-7xl overflow-hidden px-4 sm:px-6 lg:px-8 pb-20">
      
      {/* ── 1. Hero Section ── */}
      <section 
        ref={heroReveal.ref}
        className={`hp-section pt-16 pb-24 lg:pt-24 lg:pb-32 grid gap-12 lg:grid-cols-[1fr_0.85fr] items-center ${heroReveal.isVisible ? 'is-visible' : ''}`}
      >
        <div className="space-y-8 max-w-2xl">
          <div className="inline-flex items-center rounded-full border border-orange-200 bg-brand-orangeSoft px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700 hp-reveal hp-stagger-1">
            Learning OS
          </div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-brand-ink leading-[1.1] hp-reveal hp-stagger-2">
            Deep understanding,<br />
            <span className="text-brand-muted">not shallow tutorials.</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed hp-reveal hp-stagger-3 max-w-xl">
            A concept can be learned from many angles. VelStack structures developer knowledge across multiple perspectives—from simple theory to production-ready industry practices.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2 hp-reveal hp-stagger-4">
            <Link to="/technologies" className="brand-button-primary text-base px-6 py-3.5">
              Browse Curriculum <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link to="/about" className="brand-button-secondary text-base px-6 py-3.5">
              How it works
            </Link>
          </div>
        </div>

        {/* Hero Visual - Floating Cards */}
        <div className="relative h-[400px] w-full hidden lg:block hp-reveal-right hp-stagger-3">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-orangeSoft/50 to-transparent rounded-[3rem] -z-10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
            <div className="grid grid-cols-2 gap-4 hp-float">
              {VERSIONS.slice(0,4).map((v, i) => (
                <div key={v.id} className={`version-${v.id} rounded-2xl p-5 bg-white shadow-xl shadow-[var(--v-hue)]/5 border border-[var(--v-border)] flex items-start gap-4 transition-transform hover:-translate-y-1 relative`}>
                  {i === 0 && <div className="version-pulse-ring" />}
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--v-soft)] text-[var(--v-text)] shrink-0">
                    <v.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-brand-ink">{v.label}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Learning Methodology ── */}
      <section 
        ref={methodReveal.ref}
        className={`hp-section py-20 border-t border-slate-200/60 ${methodReveal.isVisible ? 'is-visible' : ''}`}
      >
        <div className="text-center max-w-2xl mx-auto mb-16 hp-reveal hp-stagger-1">
          <p className="brand-label">Methodology</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-brand-ink">
            How VelStack Structures Learning
          </h2>
          <p className="mt-4 text-slate-600 text-lg">
            A strict hierarchy that organizes knowledge logically, eliminating the chaos of scattered notes.
          </p>
        </div>

        <div className="flex flex-col items-center max-w-md mx-auto hp-reveal hp-stagger-2">
          {/* Technology */}
          <div className="method-tier w-full bg-slate-900 text-white rounded-2xl p-5 flex items-center justify-between border border-slate-800 z-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <p className="font-semibold">Technology</p>
                <p className="text-xs text-slate-400">The root language or tool</p>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold bg-white/5 px-2 py-1 rounded">Level 1</span>
          </div>

          <div className="method-connector"><div className="method-connector-dot"/><div className="method-connector-dot"/><div className="method-connector-dot"/></div>

          {/* Module */}
          <div className="method-tier w-11/12 bg-white rounded-2xl p-5 flex items-center justify-between border border-slate-200 shadow-sm z-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Workflow className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Module</p>
                <p className="text-xs text-slate-500">Major conceptual grouping</p>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded">Level 2</span>
          </div>

          <div className="method-connector"><div className="method-connector-dot"/><div className="method-connector-dot"/><div className="method-connector-dot"/></div>

          {/* Topic */}
          <div className="method-tier w-5/6 bg-white rounded-2xl p-5 flex items-center justify-between border border-slate-200 shadow-sm z-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Topic</p>
                <p className="text-xs text-slate-500">Specific concept to learn</p>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded">Level 3</span>
          </div>

          <div className="method-connector"><div className="method-connector-dot"/><div className="method-connector-dot"/><div className="method-connector-dot"/></div>

          {/* Versions */}
          <div className="method-tier w-full bg-brand-orangeSoft rounded-2xl p-6 border border-orange-200 z-10">
            <div className="flex flex-col items-center text-center">
              <Layers className="w-6 h-6 text-orange-500 mb-2" />
              <p className="font-semibold text-orange-900">Multiple Learning Versions</p>
              <p className="text-xs text-orange-700/80 mt-1">One topic, viewed from 6 different angles.</p>
              <div className="flex gap-2 mt-4 justify-center flex-wrap">
                {VERSIONS.map(v => (
                  <span key={v.id} className="text-[10px] font-bold uppercase tracking-wider bg-white/60 text-orange-800 px-2 py-1 rounded-md border border-orange-200/50">
                    {v.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Version Showcase ── */}
      <section 
        ref={versionReveal.ref}
        className={`hp-section py-20 border-t border-slate-200/60 ${versionReveal.isVisible ? 'is-visible' : ''}`}
      >
        <div className="mb-12 hp-reveal hp-stagger-1">
          <p className="brand-label">The Perspectives</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-brand-ink max-w-2xl">
            Choose the depth you need today
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {VERSIONS.map((v, i) => (
            <div 
              key={v.id} 
              className={`version-${v.id} hp-reveal hp-stagger-${Math.min(i + 2, 6)} group relative bg-white border border-slate-200 hover:border-[var(--v-border)] rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-[var(--v-hue)]/5`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--v-soft)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />
              
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-[var(--v-soft)] text-slate-500 group-hover:text-[var(--v-text)] flex items-center justify-center transition-colors mb-6">
                  <v.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl font-semibold text-brand-ink mb-2 group-hover:text-[var(--v-text)] transition-colors">
                  {v.label}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {v.desc}. Structured specifically for this context so you don't waste time sifting through irrelevant details.
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Curriculum Showcase ── */}
      <section 
        ref={curriculumReveal.ref}
        className={`hp-section py-20 border-t border-slate-200/60 ${curriculumReveal.isVisible ? 'is-visible' : ''}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 hp-reveal hp-stagger-1">
          <div>
            <p className="brand-label">Live Curriculum</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-brand-ink">
              Explore the foundations
            </h2>
          </div>
          <Link to="/technologies" className="inline-flex items-center text-sm font-semibold text-brand-orange hover:text-orange-700 transition">
            View full curriculum <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <PrimaryLoader className="min-h-[200px]" />
        ) : technologies.length === 0 ? (
          <div className="text-center p-12 border border-slate-200 border-dashed rounded-3xl bg-slate-50 hp-reveal hp-stagger-2">
            <p className="text-slate-500 font-medium">Curriculum is currently empty.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {technologies.map((tech, i) => (
              <Link 
                key={tech.slug} 
                to={`/topics/${tech.slug}`}
                className={`hp-reveal hp-stagger-${Math.min(i + 2, 6)} block group bg-white border border-slate-200 rounded-3xl p-6 transition-all hover:border-orange-200 hover:shadow-lg hover:-translate-y-1`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                    <Code2 className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-brand-orange transition-colors -translate-x-2 group-hover:translate-x-0" />
                </div>
                <h3 className="font-display text-xl font-semibold text-brand-ink mb-2">
                  {tech.name}
                </h3>
                <p className="text-slate-500 text-sm line-clamp-2">
                  {tech.description || 'Comprehensive structured notes and modules.'}
                </p>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-4">
                   <div className="flex -space-x-2">
                     <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white" />
                     <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white" />
                     <div className="w-6 h-6 rounded-full bg-slate-300 border-2 border-white" />
                   </div>
                   <span className="text-xs font-medium text-slate-400">Structured paths</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── 5. Developer Journey ── */}
      <section 
        ref={journeyReveal.ref}
        className={`hp-section py-20 border-t border-slate-200/60 ${journeyReveal.isVisible ? 'is-visible' : ''}`}
      >
        <div className="text-center max-w-2xl mx-auto mb-16 hp-reveal hp-stagger-1">
          <p className="brand-label">The Journey</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-brand-ink">
            Grow alongside the platform
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-5 relative">
          {JOURNEY.map((item, i) => (
            <div key={item.step} className={`journey-step hp-reveal hp-stagger-${i + 2} flex flex-col items-start`}>
              <div className="w-full flex items-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center relative z-10 shadow-sm group-hover:border-orange-200 group-hover:bg-brand-orangeSoft transition-colors">
                  <item.icon className="w-6 h-6 text-slate-400 group-hover:text-brand-orange transition-colors" />
                </div>
              </div>
              <div className="pr-4">
                <span className="text-xs font-bold text-slate-400 block mb-1">Step {item.step}</span>
                <h3 className="font-display text-lg font-semibold text-brand-ink mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-20 pt-10 border-t border-brand-border">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-orange-200 bg-brand-orangeSoft">
              <span className="absolute h-5 w-[2px] rounded-full bg-brand-orange" />
              <span className="absolute top-1.5 h-0 w-0 border-x-[5px] border-b-[6px] border-x-transparent border-b-brand-orange" />
            </span>
            <div>
              <p className="font-display text-sm font-semibold text-brand-ink">VelStack</p>
              <p className="text-xs text-brand-muted">Structured learning for developers</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-6 text-sm font-medium text-brand-muted">
            <Link to="/technologies" className="hover:text-brand-ink transition">Technologies</Link>
            <Link to="/about" className="hover:text-brand-ink transition">About</Link>
            <Link to="/login" className="hover:text-brand-ink transition">Login</Link>
          </nav>
          <p className="text-xs text-brand-muted">© {new Date().getFullYear()} VelStack.</p>
        </div>
      </footer>

    </div>
  )
}
