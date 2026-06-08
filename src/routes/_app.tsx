import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getCurrentUser } from '#/server/functions/auth'
import { PageShell } from '#/components/layout/pageshell'

export const Route = createFileRoute('/_app')({
  beforeLoad: async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw redirect({ to: '/login' })
    }
    return {
      user,
    }
  },
  component: AppLayout,
})

function AppLayout() {
  const { user } = Route.useRouteContext()

  return (
    <PageShell user={user}>
      <Outlet />
    </PageShell>
  )
}
