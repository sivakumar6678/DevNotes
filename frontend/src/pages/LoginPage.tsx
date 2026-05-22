import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { apiLogin } from '../api/auth'
import { SavingLoader } from '../components/Loader'
import { useAuth } from '../context/AuthContext'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nextErrors: typeof fieldErrors = {}
    const normalizedEmail = email.trim()

    if (!normalizedEmail) {
      nextErrors.email = 'Email is required.'
    } else if (!EMAIL_PATTERN.test(normalizedEmail)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!password) {
      nextErrors.password = 'Password is required.'
    }

    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await apiLogin(normalizedEmail, password)
      login(response.token, response.user)
      navigate(response.user.role === 'super_admin' ? '/admin' : '/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to login. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-brand-border bg-brand-ink px-8 py-10 text-white shadow-brand sm:px-10 sm:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.32),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.18),transparent_28%)]" />
          <div className="relative space-y-8">
            <span className="brand-pill border-orange-300 bg-white/10 text-orange-100">Welcome Back</span>
            <div className="space-y-4">
              <h1 className="max-w-lg font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Sign in to continue building your learning workspace.
              </h1>
              <p className="max-w-xl text-base leading-8 text-slate-200">
                Access your dashboard, manage notes, and keep your content workflow organized in one calm place.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ['Structured', 'Clear paths for technologies, modules, and notes.'],
                ['Fast', 'Jump into the dashboard and update content quickly.'],
                ['Secure', 'Approval-based access with protected admin routes.'],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <p className="text-sm font-medium uppercase tracking-[0.26em] text-orange-100/90">Team Access</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                If your account is pending approval, you can still sign in after an admin approves access from the management panel.
              </p>
            </div>
          </div>
        </section>

        <section className="brand-panel px-6 py-8 sm:px-8 sm:py-10">
          <div className="mx-auto max-w-md space-y-8">
            <div className="space-y-3">
              <p className="brand-label">Account Login</p>
              <h2 className="text-3xl font-semibold tracking-tight text-brand-ink">Login to your account</h2>
              <p className="text-sm leading-7 text-brand-muted">
                Enter your email and password to access your dashboard and continue your work.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-brand-ink">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setFieldErrors((current) => ({ ...current, email: undefined }))
                  }}
                  required
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  placeholder="you@example.com"
                  className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:outline-none"
                />
                {fieldErrors.email ? (
                  <p id="email-error" className="text-xs font-medium text-red-600">
                    {fieldErrors.email}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-brand-ink">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setFieldErrors((current) => ({ ...current, password: undefined }))
                    }}
                    required
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                    placeholder="Enter your password"
                    className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:outline-none"
                  />
                  {password ? (
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-brand-ink focus:outline-none focus:ring-2 focus:ring-orange-200"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  ) : null}
                </div>
                {fieldErrors.password ? (
                  <p id="password-error" className="text-xs font-medium text-red-600">
                    {fieldErrors.password}
                  </p>
                ) : null}
              </div>

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
                {loading ? <SavingLoader className="mr-2 bg-orange-200/50" label="Logging in" /> : null}
                Login
              </button>
            </form>

            <div className="rounded-2xl border border-brand-border bg-brand-orangeSoft/60 px-4 py-4">
              <p className="text-sm text-brand-muted">
                Need an account?{' '}
                <Link to="/signup" className="font-semibold text-brand-orange transition hover:text-orange-700">
                  Create one here
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
