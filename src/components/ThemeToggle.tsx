import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

type ThemeMode = 'light' | 'dark' | 'auto'

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'auto'
  }

  const stored = window.localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark' || stored === 'auto') {
    return stored
  }

  return 'auto'
}

function applyThemeMode(mode: ThemeMode) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved = mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode

  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(resolved)

  if (mode === 'auto') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', mode)
  }

  document.documentElement.style.colorScheme = resolved
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('auto')

  useEffect(() => {
    const initialMode = getInitialMode()
    setMode(initialMode)
    applyThemeMode(initialMode)
  }, [])

  useEffect(() => {
    if (mode !== 'auto') {
      return
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyThemeMode('auto')

    media.addEventListener('change', onChange)
    return () => {
      media.removeEventListener('change', onChange)
    }
  }, [mode])

  function updateMode(newMode: ThemeMode) {
    setMode(newMode)
    applyThemeMode(newMode)
    window.localStorage.setItem('theme', newMode)
  }

  return (
    <div className="relative flex items-center bg-surface-2/40 dark:bg-surface-2/20 border border-border/60 rounded-full p-0.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-sm h-8 w-[92px]">
      {/* Sliding background capsule */}
      <div
        className="absolute top-0.5 bottom-0.5 rounded-full bg-surface dark:bg-surface-2 shadow-[0_1.5px_4px_rgba(0,0,0,0.12)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          width: '28px',
          left: mode === 'light' ? '2px' : mode === 'auto' ? '30px' : '58px',
        }}
      />

      {/* Light Button */}
      <button
        type="button"
        onClick={() => updateMode('light')}
        className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-200"
        title="Light Mode"
        aria-label="Switch to Light Mode"
      >
        <Sun
          size={14}
          className={`transition-all duration-300 ${mode === 'light' ? 'text-accent scale-110 rotate-12' : 'text-text-2 scale-100 opacity-60 hover:opacity-100'}`}
        />
      </button>

      {/* Auto / System Button */}
      <button
        type="button"
        onClick={() => updateMode('auto')}
        className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-200"
        title="System Preference"
        aria-label="Switch to System Preference"
      >
        <Monitor
          size={14}
          className={`transition-all duration-300 ${mode === 'auto' ? 'text-accent scale-110' : 'text-text-2 scale-100 opacity-60 hover:opacity-100'}`}
        />
      </button>

      {/* Dark Button */}
      <button
        type="button"
        onClick={() => updateMode('dark')}
        className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-200"
        title="Dark Mode"
        aria-label="Switch to Dark Mode"
      >
        <Moon
          size={14}
          className={`transition-all duration-300 ${mode === 'dark' ? 'text-accent scale-110 -rotate-12' : 'text-text-2 scale-100 opacity-60 hover:opacity-100'}`}
        />
      </button>
    </div>
  )
}
