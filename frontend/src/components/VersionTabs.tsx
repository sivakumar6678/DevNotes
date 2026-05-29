import { BookOpen, Code2, GitCompareArrows, Lightbulb, RotateCcw, Wifi, Zap, type LucideIcon } from 'lucide-react'

const VERSION_META: Record<string, { label: string; icon: LucideIcon; desc: string }> = {
  simple: {
    label: 'Simple',
    icon: Lightbulb,
    desc: 'Beginner-friendly explanation',
  },
  industry: {
    label: 'Industry',
    icon: Zap,
    desc: 'Production-level context',
  },
  interview: {
    label: 'Interview',
    icon: BookOpen,
    desc: 'Ace your next interview',
  },
  revision: {
    label: 'Revision',
    icon: RotateCcw,
    desc: 'Quick refresher',
  },
  realtime: {
    label: 'Real-time',
    icon: Wifi,
    desc: 'Live & async patterns',
  },
  theory: {
    label: 'Theory',
    icon: Code2,
    desc: 'Deep-dive theory',
  },
}

const VERSION_ORDER = ['simple', 'industry', 'interview', 'revision', 'realtime', 'theory']

interface VersionTabsProps {
  selectedVersion: string
  availableVersions: string[]   // keys that actually exist in the note
  onSelectVersion: (key: string) => void
  compareMode?: boolean
  onToggleCompare?: () => void
}

export default function VersionTabs({
  selectedVersion,
  availableVersions,
  onSelectVersion,
  compareMode,
  onToggleCompare,
}: VersionTabsProps) {
  return (
    <div className="fixed left-0 right-0 top-16 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex max-w-full items-center gap-1.5 overflow-x-auto whitespace-nowrap rounded-full border border-slate-200/80 bg-white/95 px-3 py-2 shadow-[0_4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md">
        {VERSION_ORDER.map((key) => {
          const meta = VERSION_META[key]
          const isActive = key === selectedVersion
          const hasContent = availableVersions.includes(key)

          return (
            <button
              key={key}
              type="button"
              title={hasContent ? meta.desc : `${meta.desc} — not yet available`}
              onClick={() => hasContent && onSelectVersion(key)}
              disabled={!hasContent}
              aria-pressed={isActive}
              className={`group relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all duration-200 focus:outline-none ${
                isActive
                  ? 'bg-brand-orange text-white shadow-sm'
                  : hasContent
                    ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    : 'cursor-not-allowed text-slate-300'
              }`}
            >
              <meta.icon className={`h-3.5 w-3.5 ${isActive ? 'text-white/90' : hasContent ? 'text-slate-400 group-hover:text-slate-600' : 'text-slate-200'}`} />
              {meta.label}
              {!hasContent && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-100 text-[8px] font-bold text-slate-400">
                  ·
                </span>
              )}
            </button>
          )
        })}

        {/* Divider */}
        <div className="mx-1 h-5 w-px bg-slate-200" />

        {/* Compare mode toggle */}
        <button
          type="button"
          onClick={onToggleCompare}
          title="Compare two versions side by side"
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all ${
            compareMode
              ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-200'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <GitCompareArrows className="h-3.5 w-3.5" />
          Compare
        </button>
      </div>
    </div>
  )
}
