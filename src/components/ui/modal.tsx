import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  type?: 'center' | 'right' // center modal vs side drawer
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  type = 'center',
}) => {
  // Listen for Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeWidths = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  // Centered Modal
  if (type === 'center') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-bg/85 backdrop-blur-sm" onClick={onClose} />

        {/* Container */}
        <div
          className={`relative w-full bg-surface border border-border rounded-xl shadow-2xl overflow-hidden transition-all transform animate-in zoom-in-95 duration-200 ${sizeWidths[size]}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-2/40">
            <h3 className="font-semibold text-text-1 text-base">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 text-text-2 hover:text-text-1 hover:bg-surface-2 rounded-lg transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 overflow-y-auto max-h-[80vh]">{children}</div>
        </div>
      </div>
    )
  }

  // Side Drawer (Slides in from right)
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-bg/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg h-full bg-surface border-l border-border shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-surface-2/40">
          <h3 className="font-semibold text-text-1 text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-text-2 hover:text-text-1 hover:bg-surface-2 rounded-lg transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-surface">{children}</div>
      </div>
    </div>
  )
}
