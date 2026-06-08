import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getCurrentUser } from '#/server/functions/auth'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    const user = await getCurrentUser()
    if (user) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center items-center p-4 selection:bg-accent/25 relative overflow-hidden">
      {/* Visual Glare Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-success/5 blur-[120px] pointer-events-none" />

      {/* Brand logo */}
      <div className="flex items-center gap-2 mb-8 animate-in fade-in slide-in-from-top duration-300">
        <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-xl shadow-md">
          V
        </div>
        <div>
          <span className="font-semibold text-text-1 tracking-tight text-lg block">Vantage</span>
          <span className="text-[10px] text-text-3 font-semibold uppercase tracking-wider">Freelancer Operating System</span>
        </div>
      </div>

      {/* Main Glass Form Container */}
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-2xl backdrop-blur-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
        <Outlet />
      </div>

      {/* Footer disclaimer */}
      <p className="text-[10px] text-text-3 font-medium mt-6 tracking-wide text-center">
        VANTAGE OS &copy; {new Date().getFullYear()} &middot; SECURED SESSION
      </p>
    </div>
  )
}
