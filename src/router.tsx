import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { AlertTriangle, Home } from 'lucide-react'
import { Button } from './components/ui/button'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: () => (
      <div className="min-h-screen bg-bg flex flex-col justify-center items-center p-4 text-center selection:bg-accent/25 relative overflow-hidden">
        {/* Visual Glare Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-success/5 blur-[120px] pointer-events-none" />

        <div className="max-w-md bg-surface border border-border rounded-2xl p-8 shadow-2xl backdrop-blur-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center mx-auto mb-4 text-accent">
            <span className="text-2xl font-bold font-serif">404</span>
          </div>
          <h1 className="text-xl font-bold text-text-1 mb-2">Page Not Found</h1>
          <p className="text-xs text-text-2 mb-6 leading-relaxed">
            The workspace page you are looking for doesn't exist or has been relocated.
          </p>
          <a href="/">
            <Button className="w-full flex items-center justify-center gap-2">
              <Home size={14} /> Go Home
            </Button>
          </a>
        </div>
      </div>
    ),
    defaultErrorComponent: ({ error }) => (
      <div className="min-h-screen bg-bg flex flex-col justify-center items-center p-4 text-center selection:bg-accent/25 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-danger/5 blur-[120px] pointer-events-none" />

        <div className="max-w-md bg-surface border border-border rounded-2xl p-8 shadow-2xl backdrop-blur-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-danger/10 border border-danger/20 rounded-full flex items-center justify-center mx-auto mb-4 text-danger animate-bounce">
            <AlertTriangle size={28} />
          </div>
          <h1 className="text-xl font-bold text-text-1 mb-2">Workspace Error</h1>
          <p className="text-xs text-text-2 mb-4 leading-relaxed">
            An unexpected error occurred in your Vantage workspace.
          </p>
          <div className="bg-surface-2/40 border border-border rounded-lg p-3 text-left font-mono text-[10px] text-danger max-h-40 overflow-y-auto mb-6">
            {error?.message || 'Unknown Workspace Error'}
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2"
          >
            Reload Workspace
          </Button>
        </div>
      </div>
    ),
  })

  return router
}

export const createRouter = getRouter

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
