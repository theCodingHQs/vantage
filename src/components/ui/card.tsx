import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'surface' | 'surface-2'
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'surface',
  className = '',
  ...props
}) => {
  const bgStyles =
    variant === 'surface-2' ? 'bg-surface-2 border-border/80' : 'bg-surface border-border'

  return (
    <div
      className={`border rounded-xl p-5 shadow-sm transition-all duration-200 ${bgStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`border-b border-border/50 pb-4 mb-4 ${className}`}>{children}</div>
}

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <h4 className={`text-sm font-semibold text-text-2 uppercase tracking-wider ${className}`}>
      {children}
    </h4>
  )
}

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`${className}`}>{children}</div>
}
