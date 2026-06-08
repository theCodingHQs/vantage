import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-xs font-medium text-text-2 mb-1.5">{label}</label>}
        <input
          ref={ref}
          className={`w-full bg-surface-2 border border-border hover:border-border-hover focus:border-accent text-text-1 rounded-lg px-3 py-2 text-sm transition-all focus:outline-none focus:ring-1 focus:ring-accent placeholder-text-3 disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? 'border-danger focus:ring-danger focus:border-danger' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-danger mt-1">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-xs font-medium text-text-2 mb-1.5">{label}</label>}
        <textarea
          ref={ref}
          className={`w-full bg-surface-2 border border-border hover:border-border-hover focus:border-accent text-text-1 rounded-lg px-3 py-2 text-sm transition-all focus:outline-none focus:ring-1 focus:ring-accent placeholder-text-3 min-h-[80px] disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? 'border-danger focus:ring-danger focus:border-danger' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-danger mt-1">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-xs font-medium text-text-2 mb-1.5">{label}</label>}
        <select
          ref={ref}
          className={`w-full bg-surface-2 border border-border hover:border-border-hover focus:border-accent text-text-1 rounded-lg px-3 py-2 text-sm transition-all focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? 'border-danger focus:ring-danger focus:border-danger' : ''
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface-2">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-danger mt-1">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
