import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Input } from '#/components/ui/input'
import { Button } from '#/components/ui/button'
import { loginUser } from '#/server/functions/auth'
import { ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/_auth/login')({
  component: LoginComponent,
})

function LoginComponent() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('first')
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    setError(null)
    try {
      const res = await loginUser({ data: { email, password } })
      if (res.success && res.user) {
        if (res.user.onboardingCompleted) {
          navigate({ to: '/dashboard' })
        } else {
          navigate({ to: '/onboarding' })
        }
      } else {
        setError(res.error || 'Invalid email or password')
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-text-1">Welcome back</h2>
        <p className="text-xs text-text-2 mt-1.5">Sign in to your freelance operating workspace</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />

        <Button
          type="submit"
          className="w-full flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
          {!loading && <ArrowRight size={14} />}
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-border/60 text-center">
        <p className="text-xs text-text-2">
          New to Vantage?{' '}
          <Link to="/register" className="text-accent hover:underline font-semibold">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
