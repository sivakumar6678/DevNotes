interface VersionTabsProps {
  selectedVersion?: string;
  onSelectVersion?: (key: string) => void;
}

const versions = [
  { key: 'simple', label: 'Simple', enabled: true },
  { key: 'industry', label: 'Industry', enabled: true },
  { key: 'interview', label: 'Interview', enabled: false },
  { key: 'revision', label: 'Revision', enabled: false },
  { key: 'real_time', label: 'Real-time', enabled: false },
  { key: 'theory', label: 'Theory', enabled: false },
]

export default function VersionTabs({ selectedVersion = 'industry', onSelectVersion }: VersionTabsProps) {
  return (
    <div className="fixed left-0 right-0 top-16 z-50 flex justify-center px-4">
      <div className="flex max-w-full items-center gap-2 overflow-x-auto whitespace-nowrap rounded-full border border-slate-200 bg-white/90 px-4 py-2 shadow-lg backdrop-blur-md">
        {versions.map((version) => {
          const isActive = version.key === selectedVersion
          return (
            <button
              key={version.key}
              type="button"
              onClick={() => {
                if (version.enabled) {
                  onSelectVersion?.(version.key)
                }
              }}
              disabled={!version.enabled}
              aria-pressed={isActive}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-200 ${
                isActive
                  ? 'bg-brand-orange text-white shadow-sm'
                  : version.enabled
                    ? 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-brand-ink'
                    : 'cursor-not-allowed bg-transparent text-slate-400 opacity-70'
              }`}
            >
              {version.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
