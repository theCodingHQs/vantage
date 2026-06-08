import React from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { useLocation } from '@tanstack/react-router'

export interface PageShellProps {
  user: {
    name: string | null
    email: string
    businessName: string | null
    avatarUrl: string | null
  }
  action?: React.ReactNode
  children: React.ReactNode
}

export const PageShell: React.FC<PageShellProps> = ({
  user,
  action,
  children,
}) => {
  const location = useLocation()
  
  // Auto-generate breadcrumbs from path (e.g. /projects/new -> ["Workspace", "Projects", "New"])
  const segments = location.pathname.split('/').filter(Boolean)
  const breadcrumbs = ['Workspace']
  
  segments.forEach(seg => {
    // Format segment name
    const label = seg
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
    breadcrumbs.push(label)
  })

  return (
    <div className="min-h-screen bg-bg text-text-1">
      {/* Collapsible Sidebar */}
      <Sidebar user={user} />

      {/* Main Layout Area */}
      <div className="pl-16 md:pl-60 transition-all duration-300 min-h-screen flex flex-col">
        {/* Sticky Header with auto breadcrumbs */}
        <Header breadcrumbs={breadcrumbs} action={action} />

        {/* Core Route Content */}
        <main className="flex-1 px-6 py-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
