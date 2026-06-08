import { createFileRoute, redirect } from '@tanstack/react-router'
import { getCurrentUser } from '#/server/functions/auth'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const user = await getCurrentUser()
    if (user) {
      throw redirect({ to: '/dashboard' })
    } else {
      throw redirect({ to: '/login' })
    }
  },
})
