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
  Sparkles
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
      className={`fixed top-0 left-0 h-screen bg-surface border-r border-border flex flex-col transition-all duration-300 z-30 ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-border bg-surface-2/20">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-lg shadow-sm">
              V
            </div>
            <div>
              <span className="font-semibold text-text-1 tracking-tight text-sm block">Vantage</span>
              <span className="text-[10px] text-text-2 font-medium">Freelancer OS</span>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold mx-auto">
            V
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-surface-2 rounded text-text-2 hover:text-text-1 transition-colors md:block hidden"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: 'bg-surface-2 text-text-1 border-l-2 border-accent' }}
              inactiveProps={{ className: 'text-text-2 hover:bg-surface-2/50 hover:text-text-1 border-l-2 border-transparent' }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 font-medium"
            >
              <Icon size={18} className="flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Live Timer Widget */}
      {isRunning && (
        <div className={`p-3 m-3 bg-surface-2 border border-border rounded-xl flex flex-col gap-2 ${
          isCollapsed ? 'items-center justify-center' : ''
        }`}>
          {!isCollapsed && (
            <div>
              <div className="flex items-center gap-1 text-[10px] text-accent font-semibold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                Live Timer
              </div>
              <p className="text-xs font-medium text-text-1 mt-1 truncate">{projectName}</p>
              {taskName && <p className="text-[10px] text-text-2 truncate">Task: {taskName}</p>}
            </div>
          )}
          <div className={`font-mono text-sm font-semibold text-text-1 ${isCollapsed ? 'text-[10px]' : ''}`}>
            {timeString}
          </div>
          <button
            onClick={() => stopTimer()}
            className="w-full bg-danger/10 hover:bg-danger/20 border border-danger/20 text-danger rounded-lg p-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-97 cursor-pointer"
            title="Stop Timer"
          >
            <Square size={12} fill="currentColor" />
            {!isCollapsed && <span>Stop Timer</span>}
          </button>
        </div>
      )}

      {/* User Profile Footer */}
      <div className="border-t border-border p-3 bg-surface-2/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-surface-2 border border-border flex-shrink-0 flex items-center justify-center text-text-1 font-bold text-xs uppercase">
              {user.name ? user.name[0] : user.email[0]}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-text-1 truncate leading-tight">
                  {user.name || 'Freelancer'}
                </p>
                <p className="text-[10px] text-text-3 truncate mt-0.5">
                  {user.businessName || user.email}
                </p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 hover:bg-surface-2 text-text-2 hover:text-danger rounded-lg transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
