import { useState } from 'react'
import { Link } from 'react-router-dom'
import { signup } from '../api/auth'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMessage('')
    try {
      const response = await signup(name, email, password)
      setSuccessMessage(response.message || 'Account created. Awaiting approval.')
      setName('')
      setEmail('')
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign up. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="grid gap-8 lg:grid-cols-[0.98fr_1.02fr]">
        <section className="brand-panel px-6 py-8 sm:px-8 sm:py-10">
          <div className="mx-auto max-w-md space-y-8">
            <div className="space-y-3">
              <p className="brand-label">New Account</p>
              <h1 className="text-3xl font-semibold tracking-tight text-brand-ink">Create your account</h1>
              <p className="text-sm leading-7 text-brand-muted">
                Join the workspace, request access, and get approved before logging in to protected areas.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-brand-ink">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Your name"
                  className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-brand-ink">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-brand-ink">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Choose a strong password"
                  className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:outline-none"
                />
              </div>

              {successMessage ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {successMessage}
                </div>
              ) : null}
              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-brand-orange px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Signing up...' : 'Create Account'}
              </button>
            </form>

            <div className="rounded-2xl border border-brand-border bg-white px-4 py-4">
              <p className="text-sm text-brand-muted">
                Already registered?{' '}
                <Link to="/login" className="font-semibold text-brand-orange transition hover:text-orange-700">
                  Login instead
                </Link>
              </p>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[2rem] border border-brand-border bg-gradient-to-br from-white via-orange-50 to-amber-50 px-8 py-10 shadow-brand sm:px-10 sm:py-12">
          <div className="absolute -right-20 top-0 h-56 w-56 rounded-full bg-orange-200/30 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="relative space-y-8">
            <span className="brand-pill">Approval Based Access</span>
            <div className="space-y-4">
              <h2 className="max-w-lg font-display text-4xl font-semibold tracking-tight text-brand-ink sm:text-5xl">
                Request access with a cleaner and more confident first impression.
              </h2>
              <p className="max-w-xl text-base leading-8 text-brand-muted">
                Your signup request goes into approval flow, so admins can review new accounts before granting access to the workspace.
              </p>
            </div>

            <div className="grid gap-4">
              {[
                ['1. Create account', 'Submit your name, email, and password in a simple guided form.'],
                ['2. Wait for approval', 'An admin reviews your request from the user management dashboard.'],
                ['3. Start working', 'Once approved, you can log in and continue with your role-based access.'],
              ].map(([title, description]) => (
                <div key={title} className="rounded-[1.5rem] border border-orange-100 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
                  <p className="text-sm font-semibold text-brand-ink">{title}</p>
                  <p className="mt-2 text-sm leading-7 text-brand-muted">{description}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] bg-brand-ink px-5 py-6 text-white shadow-sm">
                <p className="text-sm uppercase tracking-[0.24em] text-orange-200">Secure Flow</p>
                <p className="mt-3 text-sm leading-7 text-slate-200">
                  Approval-first onboarding keeps admin tools protected while still letting new users register easily.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-brand-border bg-white px-5 py-6 shadow-sm">
                <p className="text-sm uppercase tracking-[0.24em] text-brand-muted">Clean Experience</p>
                <p className="mt-3 text-sm leading-7 text-brand-muted">
                  Better spacing, stronger typography, and clearer feedback make the auth flow feel more polished.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
