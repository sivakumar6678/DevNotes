import { Link } from 'react-router-dom'
import { ArrowRight, Box, Brain, Compass, EyeOff, Scale, SplitSquareHorizontal } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import { useScrollReveal } from '../hooks/useScrollReveal'

const PROBLEMS = [
  {
    title: 'Scattered Knowledge',
    desc: 'You read a tutorial, watch a video, and check documentation. None of them connect. When you need to review the concept later, you have to piece it all together again.',
    icon: SplitSquareHorizontal,
  },
  {
    title: 'One-Size-Fits-All',
    desc: 'Most platforms explain a topic exactly one way. If you are a beginner, it might be too advanced. If you are preparing for an interview, it might be too simple.',
    icon: Scale,
  },
  {
    title: 'Missing Context',
    desc: 'You learn how to write the code, but not why it matters in production, how it scales, or what alternative approaches exist.',
    icon: EyeOff,
  },
]

export default function About() {
  usePageTitle('About')

  const heroReveal = useScrollReveal({ triggerOnce: true })
  const problemReveal = useScrollReveal({ triggerOnce: true, threshold: 0.15 })
  const philosophyReveal = useScrollReveal({ triggerOnce: true, threshold: 0.2 })
  const compareReveal = useScrollReveal({ triggerOnce: true, threshold: 0.2 })
  const visionReveal = useScrollReveal({ triggerOnce: true, threshold: 0.2 })

  return (
    <div className="mx-auto max-w-7xl overflow-hidden px-4 sm:px-6 lg:px-8 pb-20">
      
      {/* ── 1. Hero ── */}
      <section 
        ref={heroReveal.ref}
        className={`hp-section pt-16 pb-24 lg:pt-24 lg:pb-32 text-center max-w-4xl mx-auto ${heroReveal.isVisible ? 'is-visible' : ''}`}
      >
        <p className="brand-label hp-reveal hp-stagger-1">About VelStack</p>
        <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-brand-ink leading-[1.1] hp-reveal hp-stagger-2">
          A calmer, more practical way to study developer concepts.
        </h1>
        <p className="mt-8 text-lg sm:text-xl text-slate-600 leading-relaxed hp-reveal hp-stagger-3 max-w-2xl mx-auto">
          The goal is simple: make learning feel product-grade, approachable for beginners, and still useful for working developers.
        </p>
        
        <div className="mt-12 p-8 rounded-3xl bg-slate-900 text-left relative overflow-hidden hp-reveal hp-stagger-4 mx-auto max-w-3xl shadow-2xl shadow-slate-900/10">
          <div className="absolute top-0 right-0 p-8 text-slate-800 opacity-20 transform translate-x-4 -translate-y-4">
            <Brain className="w-48 h-48" />
          </div>
          <p className="text-xl sm:text-2xl font-display font-medium text-slate-100 leading-relaxed relative z-10">
            "Learning isn't about reading the most tutorials. It's about building mental models that survive when you close the browser."
          </p>
        </div>
      </section>

      {/* ── 2. The Problem ── */}
      <section 
        ref={problemReveal.ref}
        className={`hp-section py-20 border-t border-slate-200/60 ${problemReveal.isVisible ? 'is-visible' : ''}`}
      >
        <div className="text-center max-w-2xl mx-auto mb-16 hp-reveal hp-stagger-1">
          <p className="brand-label text-orange-600">The Problem</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-brand-ink">
            Why traditional learning platforms fail
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {PROBLEMS.map((prob, i) => (
            <div key={prob.title} className={`hp-reveal hp-stagger-${i + 2} p-8 rounded-3xl bg-white border border-slate-200 shadow-sm relative`}>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-6">
                <prob.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-semibold text-brand-ink mb-3">{prob.title}</h3>
              <p className="text-slate-600 leading-relaxed text-sm">{prob.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. VelStack Philosophy ── */}
      <section 
        ref={philosophyReveal.ref}
        className={`hp-section py-24 ${philosophyReveal.isVisible ? 'is-visible' : ''}`}
      >
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="hp-reveal hp-stagger-1">
            <p className="brand-label">The Solution</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-brand-ink mb-6">
              A concept viewed from 6 angles
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              Instead of one explanation for everyone, topics are framed across basic, real-world, production, and interview contexts. 
            </p>
            <p className="text-slate-600 text-lg leading-relaxed">
              That makes the same note useful at different stages of your career. You don't outgrow VelStack—you just change your perspective.
            </p>
          </div>

          <div className="relative h-[400px] w-full flex items-center justify-center hp-reveal hp-stagger-3">
            <div className="absolute inset-0 bg-brand-orangeSoft/40 rounded-full blur-3xl" />
            
            {/* Center Node */}
            <div className="w-24 h-24 rounded-full bg-slate-900 text-white flex flex-col items-center justify-center z-20 shadow-xl border-4 border-white">
              <Box className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Concept</span>
            </div>

            {/* Orbiting Nodes (Static for stable rendering) */}
            <div className="absolute w-full h-full max-w-[320px] max-h-[320px]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-blue-200 text-blue-700 px-4 py-2 rounded-xl shadow-lg font-semibold text-sm">Industry</div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-white border border-purple-200 text-purple-700 px-4 py-2 rounded-xl shadow-lg font-semibold text-sm">Interview</div>
              <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 bg-white border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl shadow-lg font-semibold text-sm">Real World</div>
              <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 bg-white border border-amber-200 text-amber-700 px-4 py-2 rounded-xl shadow-lg font-semibold text-sm">Revision</div>
              <div className="absolute top-[15%] left-[15%] -translate-x-1/2 -translate-y-1/2 bg-white border border-pink-200 text-pink-700 px-4 py-2 rounded-xl shadow-lg font-semibold text-sm">Theory</div>
              <div className="absolute bottom-[15%] right-[15%] translate-x-1/2 translate-y-1/2 bg-white border border-orange-200 text-orange-700 px-4 py-2 rounded-xl shadow-lg font-semibold text-sm">Simple</div>
              
              {/* Dashed connector rings */}
              <div className="absolute inset-0 border border-slate-200 border-dashed rounded-full -z-10" />
              <div className="absolute inset-8 border border-slate-200/50 border-dashed rounded-full -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Multi-Perspective Comparison ── */}
      <section 
        ref={compareReveal.ref}
        className={`hp-section py-20 border-t border-slate-200/60 ${compareReveal.isVisible ? 'is-visible' : ''}`}
      >
        <div className="text-center max-w-2xl mx-auto mb-16 hp-reveal hp-stagger-1">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-brand-ink">
            A shift in approach
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto hp-reveal hp-stagger-2">
          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">✕</span>
              <h3 className="text-xl font-semibold text-slate-700">The Old Way</h3>
            </div>
            <ul className="space-y-4 text-slate-600">
              <li className="flex gap-3"><span className="text-slate-400">•</span> Find a random medium article</li>
              <li className="flex gap-3"><span className="text-slate-400">•</span> Skim through 10 paragraphs of fluff</li>
              <li className="flex gap-3"><span className="text-slate-400">•</span> Hope the author's level matches yours</li>
              <li className="flex gap-3"><span className="text-slate-400">•</span> Forget it in a week</li>
            </ul>
          </div>

          <div className="p-8 rounded-3xl bg-brand-orangeSoft border border-orange-200">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center font-bold text-white">✓</span>
              <h3 className="text-xl font-semibold text-brand-ink">The VelStack Way</h3>
            </div>
            <ul className="space-y-4 text-brand-ink/80">
              <li className="flex gap-3"><span className="text-brand-orange">•</span> Navigate to the exact topic in a logical tree</li>
              <li className="flex gap-3"><span className="text-brand-orange">•</span> Select the version that matches your goal</li>
              <li className="flex gap-3"><span className="text-brand-orange">•</span> Read structured sections (Definition, Best Practices)</li>
              <li className="flex gap-3"><span className="text-brand-orange">•</span> Compare multiple versions side-by-side</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── 5. Vision & CTA ── */}
      <section 
        ref={visionReveal.ref}
        className={`hp-section py-24 ${visionReveal.isVisible ? 'is-visible' : ''}`}
      >
        <div className="bg-slate-900 rounded-[2.5rem] p-10 sm:p-16 text-center max-w-4xl mx-auto relative overflow-hidden hp-reveal hp-stagger-1">
          <div className="absolute inset-0 bg-gradient-to-t from-brand-orange/20 to-transparent opacity-50" />
          
          <Compass className="w-12 h-12 text-orange-400 mx-auto mb-6 relative z-10" />
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-6 relative z-10">
            Built for those who build.
          </h2>
          <p className="text-slate-300 text-lg leading-relaxed max-w-2xl mx-auto mb-10 relative z-10">
            Whether you are a student establishing foundations, a self-taught developer organizing knowledge, or a senior engineer revisiting concepts before system design interviews.
          </p>
          
          <div className="relative z-10">
            <Link to="/technologies" className="inline-flex items-center justify-center rounded-xl bg-brand-orange px-8 py-4 text-base font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:-translate-y-1 hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-500/40">
              Explore the Curriculum <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
