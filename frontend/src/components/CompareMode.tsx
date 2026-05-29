import { memo } from 'react'
import NoteContent from './NoteContent'

const VERSION_LABELS: Record<string, string> = {
  simple: 'Simple',
  industry: 'Industry',
  interview: 'Interview',
  revision: 'Revision',
  realtime: 'Real-time',
  theory: 'Theory',
}

interface CompareModeProps {
  versions: Record<string, Record<string, unknown>>
  leftVersion: string
  rightVersion: string
  availableVersions: string[]
  onChangeLeft: (v: string) => void
  onChangeRight: (v: string) => void
}

export default memo(function CompareMode({
  versions,
  leftVersion,
  rightVersion,
  availableVersions,
  onChangeLeft,
  onChangeRight,
}: CompareModeProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {[{ version: leftVersion, onChange: onChangeLeft }, { version: rightVersion, onChange: onChangeRight }].map(
        ({ version, onChange }, i) => (
          <div key={i} className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Column header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                {i === 0 ? 'Version A' : 'Version B'}
              </span>
              <select
                value={version}
                onChange={(e) => onChange(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-sm font-medium text-slate-700 focus:outline-none"
              >
                {availableVersions.map((v) => (
                  <option key={v} value={v}>
                    {VERSION_LABELS[v] ?? v}
                  </option>
                ))}
              </select>
            </div>

            {/* Content */}
            <div className="px-4 py-5 sm:px-5">
              <NoteContent version={versions[version] ?? {}} />
            </div>
          </div>
        ),
      )}
    </div>
  )
})
