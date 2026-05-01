interface SharedLoaderProps {
  className?: string
  label?: string
}

interface PrimaryLoaderProps extends SharedLoaderProps {
  fullScreen?: boolean
}

function Bars({ size = 'md' }: { size?: 'md' | 'sm' }) {
  const barClass = size === 'sm' ? 'h-3.5 w-1' : 'h-6 w-1.5'

  return (
    <>
      <div className={`${barClass} animate-bar-bounce rounded-full bg-brand-orange`} style={{ animationDelay: '0ms' }} />
      <div className={`${barClass} animate-bar-bounce rounded-full bg-brand-orange`} style={{ animationDelay: '150ms' }} />
      <div className={`${barClass} animate-bar-bounce rounded-full bg-brand-orange`} style={{ animationDelay: '300ms' }} />
    </>
  )
}

export function PrimaryLoader({
  fullScreen = false,
  className = '',
  label = 'Loading content',
}: PrimaryLoaderProps) {
  const wrapperClassName = fullScreen
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm'
    : 'flex min-h-[180px] w-full items-center justify-center'

  return (
    <div className={`${wrapperClassName} ${className}`} role="status" aria-live="polite" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div className="flex items-center gap-1.5 rounded-full border border-orange-100 bg-white/95 px-4 py-3 shadow-sm">
        <Bars />
      </div>
    </div>
  )
}

export function InlineLoader({ className = '', label = 'Loading section' }: SharedLoaderProps) {
  return (
    <div className={`flex items-center justify-center gap-1 text-brand-orange ${className}`} role="status" aria-live="polite" aria-label={label}>
      <span className="sr-only">{label}</span>
      <Bars size="sm" />
    </div>
  )
}

export function SavingLoader({ className = '', label = 'Saving changes' }: SharedLoaderProps) {
  return (
    <div className={`relative h-1.5 w-16 overflow-hidden rounded-full bg-orange-100 ${className}`} role="status" aria-live="polite" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div className="absolute inset-y-0 left-0 w-1/2 animate-progress-loop rounded-full bg-brand-orange" />
    </div>
  )
}

// Default export for backwards compatibility
export default function Loader({
  size,
  fullScreen,
  className,
}: {
  size?: string
  fullScreen?: boolean
  className?: string
}) {
  if (size === 'sm') {
    return <InlineLoader className={className} />
  }
  return <PrimaryLoader fullScreen={fullScreen} className={className} />
}
