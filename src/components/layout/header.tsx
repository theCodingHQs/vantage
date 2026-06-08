import React from 'react'
import ThemeToggle from '../ThemeToggle'

export interface HeaderProps {
  breadcrumbs: string[]
  action?: React.ReactNode
}

export const Header: React.FC<HeaderProps> = ({ breadcrumbs, action }) => {
  return (
    <header className="h-16 border-b border-border bg-surface/30 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-medium text-text-2">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span className="text-text-3">/</span>}
            <span className={idx === breadcrumbs.length - 1 ? 'text-text-1 font-semibold' : ''}>
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Action Block & Theme Toggle */}
      <div className="flex items-center gap-4">
        {action && <div className="flex items-center gap-3">{action}</div>}
        <ThemeToggle />
      </div>
    </header>
  )
}
