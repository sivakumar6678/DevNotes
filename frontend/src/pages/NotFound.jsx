import { Link } from 'react-router-dom'

export default function NotFound({ message = 'Page not found.' }) {
  return (
    <div className="brand-panel mx-auto flex max-w-2xl flex-col items-start justify-center gap-6 p-8 text-slate-700">
      <p className="brand-label">Not Found</p>
      <h2 className="font-display text-3xl font-semibold tracking-tight text-brand-ink">{message}</h2>
      <p className="leading-7 text-brand-muted">The content you requested is unavailable or has not been created yet.</p>
      <Link to="/" className="brand-button-primary">
        Back to home
      </Link>
    </div>
  )
}
