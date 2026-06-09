import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from '@tanstack/react-router'
import { useTimerStore } from '#/lib/timerStore'
import { logoutUser } from '#/server/functions/auth'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Clock,
  FileText,
  Receipt,
  FileSpreadsheet,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Play,
  Square,
  Sparkles,
} from 'lucide-react'

export interface SidebarProps {
  user: {
    name: string | null
    email: string
    businessName: string | null
    avatarUrl: string | null
  }
}

export const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const navigate = useNavigate()
  const { isRunning, seconds, projectName, taskName, tick, stopTimer } = useTimerStore()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [timeString, setTimeString] = useState('00:00:00')

  // Tick the timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning) {
      interval = setInterval(() => {
        tick()
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning, tick])

  // Format seconds to HH:MM:SS
  useEffect(() => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    const pad = (n: number) => n.toString().padStart(2, '0')
    setTimeString(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`)
  }, [seconds])

  const menuItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Clients CRM', to: '/clients', icon: Users },
    { label: 'Projects & Tasks', to: '/projects', icon: Briefcase },
    { label: 'Time Tracker', to: '/time', icon: Clock },
    { label: 'Invoices', to: '/invoices', icon: FileText },
    { label: 'Expenses', to: '/expenses', icon: Receipt },
    { label: 'Proposals', to: '/proposals', icon: FileSpreadsheet },
    { label: 'Content Calendar', to: '/content', icon: Calendar },
    { label: 'Reports', to: '/reports', icon: BarChart3 },
    { label: 'Settings', to: '/settings', icon: Settings },
  ]

  const handleLogout = async () => {
    await logoutUser()
    navigate({ to: '/login' })
  }

  return (
    <aside
      className={`sticky top-0 h-screen bg-surface border-r border-border flex flex-col transition-all duration-300 z-30 ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Floating Toggle Button centered on the border */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-5 -right-3 w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-text-2 hover:text-text-1 hover:bg-surface-2 shadow-sm transition-all z-40 md:flex hidden cursor-pointer"
        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Sidebar Header */}
      <div className="flex items-center px-4 py-5 border-b border-border bg-surface-2/20 h-16 overflow-hidden whitespace-nowrap">
        <div className="flex items-center gap-2.5 w-full">
          <div
            className={`transition-all duration-300 flex-shrink-0 ${isCollapsed ? 'mx-auto' : ''}`}
          >
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-lg shadow-sm">
              V
            </div>
          </div>
          <div
            className={`transition-opacity duration-300 overflow-hidden ${
              isCollapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100 w-auto'
            }`}
          >
            <span className="font-semibold text-text-1 tracking-tight text-sm block leading-none">
              Vantage
            </span>
            <span className="text-[9px] text-text-3 font-semibold uppercase tracking-wider block mt-1">
              Freelancer OS
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: 'bg-surface-2 text-text-1 border-l-2 border-accent' }}
              inactiveProps={{
                className:
                  'text-text-2 hover:bg-surface-2/50 hover:text-text-1 border-l-2 border-transparent',
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 font-medium whitespace-nowrap"
            >
              <Icon size={18} className="flex-shrink-0" />
              <span
                className={`transition-opacity duration-300 ${
                  isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Live Timer Widget */}
      {isRunning && (
        <div className="p-3 m-3 bg-surface-2 border border-border rounded-xl flex flex-col gap-2 transition-all duration-300 overflow-hidden whitespace-nowrap">
          <div
            className={`transition-all duration-300 ${
              isCollapsed
                ? 'opacity-0 h-0 pointer-events-none overflow-hidden'
                : 'opacity-100 h-auto'
            }`}
          >
            <div className="flex items-center gap-1 text-[10px] text-accent font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
              Live Timer
            </div>
            <p className="text-xs font-medium text-text-1 mt-1 truncate">{projectName}</p>
            {taskName && <p className="text-[10px] text-text-2 truncate">Task: {taskName}</p>}
          </div>
          <div
            className={`font-mono text-sm font-semibold text-text-1 transition-all duration-300 ${
              isCollapsed ? 'text-[10px] text-center' : ''
            }`}
          >
            {timeString}
          </div>
          <button
            onClick={() => stopTimer()}
            className="w-full bg-danger/10 hover:bg-danger/20 border border-danger/20 text-danger rounded-lg p-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-97 cursor-pointer transition-all duration-300"
            title="Stop Timer"
          >
            <Square size={12} fill="currentColor" className="flex-shrink-0" />
            <span
              className={`transition-opacity duration-300 ${
                isCollapsed ? 'opacity-0 w-0 overflow-hidden pointer-events-none' : 'opacity-100'
              }`}
            >
              Stop Timer
            </span>
          </button>
        </div>
      )}

      {/* User Profile Footer */}
      <div className="border-t border-border p-3 bg-surface-2/10 overflow-hidden whitespace-nowrap">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden w-full">
            <div
              className={`w-8 h-8 rounded-full bg-surface-2 border border-border flex-shrink-0 flex items-center justify-center text-text-1 font-bold text-xs uppercase transition-all duration-300 ${
                isCollapsed ? 'mx-auto' : ''
              }`}
            >
              {user.name ? user.name[0] : user.email[0]}
            </div>
            <div
              className={`transition-opacity duration-300 ${
                isCollapsed ? 'opacity-0 w-0 pointer-events-none overflow-hidden' : 'opacity-100'
              }`}
            >
              <p className="text-xs font-semibold text-text-1 truncate leading-tight">
                {user.name || 'Freelancer'}
              </p>
              <p className="text-[10px] text-text-3 truncate mt-0.5">
                {user.businessName || user.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`p-1.5 hover:bg-surface-2 text-text-2 hover:text-danger rounded-lg transition-all cursor-pointer ${
              isCollapsed
                ? 'opacity-0 w-0 pointer-events-none overflow-hidden absolute'
                : 'opacity-100'
            }`}
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
