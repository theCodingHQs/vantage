import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg active:scale-97 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
    
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
    }

    const variantStyles = {
      primary: 'bg-accent hover:bg-accent-hover text-white shadow-sm border border-accent',
      secondary: 'bg-surface-2 hover:bg-surface border border-border hover:border-border-hover text-text-1',
      danger: 'bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20',
      success: 'bg-success/10 hover:bg-success/20 text-success border border-success/20',
      ghost: 'bg-transparent hover:bg-surface-2 text-text-2 hover:text-text-1',
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
