import React, { useState, useEffect } from 'react'
import { Input, Select, Textarea } from '#/components/ui/input'
import { Button } from '#/components/ui/button'
import { useTimerStore } from '#/lib/timerStore'
import { createTimeEntry } from '#/server/functions/projects'
import { Play } from 'lucide-react'

interface TimeFormProps {
  projectsList: {
    project: { id: string; title: string; hourlyRate: string }
    clientName: string
  }[]
  tasksList: { id: string; title: string; projectId: string }[]
  onSuccess: () => void
  onCancel: () => void
}

export const TimeForm: React.FC<TimeFormProps> = ({
  projectsList,
  tasksList,
  onSuccess,
  onCancel,
}) => {
  const startTimer = useTimerStore((state) => state.startTimer)

  const [projectId, setProjectId] = useState(projectsList[0]?.project.id || '')
  const [taskId, setTaskId] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10))
  const [hours, setHours] = useState('1')
  const [minutes, setMinutes] = useState('0')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter tasks based on selected project
  const filteredTasks = tasksList.filter((t) => t.projectId === projectId)

  // Reset task selection when project changes
  useEffect(() => {
    setTaskId(filteredTasks[0]?.id || '')
  }, [projectId])

  const handleManualLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId || !description) return

    setLoading(true)
    setError(null)

    const totalMinutes = (parseInt(hours, 10) || 0) * 60 + (parseInt(minutes, 10) || 0)
    if (totalMinutes <= 0) {
      setError('Duration must be greater than 0 minutes')
      setLoading(false)
      return
    }

    const selectedProj = projectsList.find((p) => p.project.id === projectId)
    const rate = selectedProj ? parseFloat(selectedProj.project.hourlyRate) : 0

    // Construct start & end times based on selected date
    const start = new Date(date)
    start.setHours(9, 0, 0, 0) // default 9am
    const end = new Date(start.getTime() + totalMinutes * 60000)

    try {
      await createTimeEntry({
        data: {
          projectId,
          taskId: taskId || null,
          description,
          startedAt: start.toISOString(),
          endedAt: end.toISOString(),
          durationMinutes: totalMinutes,
          isBillable: true,
          hourlyRate: rate,
        },
      })
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to save time entry. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleStartTimer = () => {
    const proj = projectsList.find((p) => p.project.id === projectId)
    const task = tasksList.find((t) => t.id === taskId)

    if (!proj) return

    startTimer(
      projectId,
      proj.project.title,
      taskId || null,
      task ? task.title : null,
      description || 'Live tracked time'
    )
    onSuccess() // close modal
  }

  const projectOptions = projectsList.map((p) => ({
    value: p.project.id,
    label: `${p.project.title} (${p.clientName})`,
  }))

  const taskOptions = [
    { value: '', label: 'No Specific Task (General Project Work)' },
    ...filteredTasks.map((t) => ({ value: t.id, label: t.title })),
  ]

  return (
    <div className="space-y-6">
      {/* Tab Selectors or Action Header */}
      <div className="flex items-center gap-3 p-3 bg-surface-2 rounded-xl border border-border/80">
        <div className="flex-1">
          <p className="text-xs font-semibold text-text-1">Start Live Tracker</p>
          <p className="text-[10px] text-text-3">
            Persists in your sidebar as you navigate routes.
          </p>
        </div>
        <Button size="sm" onClick={handleStartTimer} className="flex items-center gap-1">
          <Play size={12} fill="currentColor" /> Start Live Timer
        </Button>
      </div>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-border/60"></div>
        <span className="flex-shrink mx-4 text-text-3 text-[10px] font-bold uppercase tracking-wider">
          or log manually
        </span>
        <div className="flex-grow border-t border-border/60"></div>
      </div>

      <form onSubmit={handleManualLog} className="space-y-4">
        {error && (
          <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-xs font-semibold">
            {error}
          </div>
        )}

        <Select
          label="Select Project *"
          options={projectOptions}
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          required
          disabled={loading}
        />

        <Select
          label="Select Task"
          options={taskOptions}
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          disabled={loading}
        />

        <Input
          label="Description of Work *"
          type="text"
          placeholder="e.g. Design review, client feedback integration"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          disabled={loading}
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Log Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={loading}
          />
          <Input
            label="Hours"
            type="number"
            min="0"
            max="24"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            disabled={loading}
          />
          <Input
            label="Minutes"
            type="number"
            min="0"
            max="59"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Logging...' : 'Log Time'}
          </Button>
        </div>
      </form>
    </div>
  )
}
