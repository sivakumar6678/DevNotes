interface LoaderProps {
  fullScreen?: boolean
  className?: string
}

export function PrimaryLoader({ fullScreen = false, className = '' }: LoaderProps) {
  const loader = (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      <div className="h-6 w-1.5 animate-bar-bounce rounded-full bg-brand-orange" style={{ animationDelay: '0ms' }}></div>
      <div className="h-6 w-1.5 animate-bar-bounce rounded-full bg-brand-orange" style={{ animationDelay: '150ms' }}></div>
      <div className="h-6 w-1.5 animate-bar-bounce rounded-full bg-brand-orange" style={{ animationDelay: '300ms' }}></div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm dark:bg-slate-900/60">
        {loader}
      </div>
    )
  }

  return loader
}

export function InlineLoader({ className = '' }: Omit<LoaderProps, 'fullScreen'>) {
  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      <div className="h-3.5 w-1 animate-bar-bounce rounded-full bg-current" style={{ animationDelay: '0ms' }}></div>
      <div className="h-3.5 w-1 animate-bar-bounce rounded-full bg-current" style={{ animationDelay: '150ms' }}></div>
      <div className="h-3.5 w-1 animate-bar-bounce rounded-full bg-current" style={{ animationDelay: '300ms' }}></div>
    </div>
  )
}

export function SavingLoader({ className = '' }: Omit<LoaderProps, 'fullScreen'>) {
  return (
    <div className={`relative h-1 w-20 overflow-hidden rounded-full bg-orange-100/50 dark:bg-slate-800 ${className}`}>
      <div className="absolute inset-y-0 left-0 w-1/2 animate-progress-loop rounded-full bg-brand-orange"></div>
    </div>
  )
}

// Default export for backwards compatibility
export default function Loader({ size, fullScreen, className }: { size?: string, fullScreen?: boolean, className?: string }) {
  if (size === 'sm') {
    return <InlineLoader className={className} />
  }
  return <PrimaryLoader fullScreen={fullScreen} className={className} />
}
