import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createTimeEntry } from '#/server/functions/projects'

interface TimerState {
  isRunning: boolean
  projectId: string | null
  projectName: string | null
  taskId: string | null
  taskName: string | null
  description: string
  startedAt: string | null // ISO String
  seconds: number
  startTimer: (
    projectId: string,
    projectName: string,
    taskId: string | null,
    taskName: string | null,
    description: string
  ) => void
  stopTimer: () => Promise<void>
  tick: () => void
  resetTimer: () => void
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      isRunning: false,
      projectId: null,
      projectName: null,
      taskId: null,
      taskName: null,
      description: '',
      startedAt: null,
      seconds: 0,

      startTimer: (projectId, projectName, taskId, taskName, description) => {
        set({
          isRunning: true,
          projectId,
          projectName,
          taskId,
          taskName,
          description,
          startedAt: new Date().toISOString(),
          seconds: 0,
        })
      },

      stopTimer: async () => {
        const { isRunning, projectId, taskId, description, startedAt } = get()
        if (!isRunning || !projectId || !startedAt) return

        const end = new Date()
        const start = new Date(startedAt)
        const durationMinutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000))

        try {
          // Trigger server function to save time entry
          await createTimeEntry({
            data: {
              projectId,
              taskId: taskId || null,
              description: description || 'Time entry logged via live timer',
              startedAt: startedAt,
              endedAt: end.toISOString(),
              durationMinutes,
              isBillable: true,
              hourlyRate: 0, // Hourly rate resolved on server from project defaults
            },
          })
        } catch (err) {
          console.error('Failed to automatically save time entry:', err)
        }

        // Reset state
        set({
          isRunning: false,
          projectId: null,
          projectName: null,
          taskId: null,
          taskName: null,
          description: '',
          startedAt: null,
          seconds: 0,
        })
      },

      tick: () => {
        const { isRunning, startedAt } = get()
        if (!isRunning || !startedAt) return

        const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
        set({ seconds: Math.max(0, elapsed) })
      },

      resetTimer: () => {
        set({
          isRunning: false,
          projectId: null,
          projectName: null,
          taskId: null,
          taskName: null,
          description: '',
          startedAt: null,
          seconds: 0,
        })
      },
    }),
    {
      name: 'vantage-timer-store',
    }
  )
)
