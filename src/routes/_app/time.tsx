import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useTimerStore } from '#/lib/timerStore'
import { getProjects, getTimeEntries } from '#/server/functions/projects'
import { Button } from '#/components/ui/button'
import { Input, Select } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import { Table, TableRow, TableCell } from '#/components/ui/table'
import { Card, CardHeader, CardTitle, CardContent } from '#/components/ui/card'
import { TimeForm } from '#/components/forms/time-form'
import { formatCurrency, durationToHours, formatDateYYYYMMDD } from '#/lib/utils'
import { Modal } from '#/components/ui/modal'
import { Play, Square, Download, Clock, Plus } from 'lucide-react'

export const Route = createFileRoute('/_app/time')({
  loader: async () => {
    const projectsList = await getProjects({ data: { status: 'all' } })
    const timeEntries = await getTimeEntries()
    return { projectsList, timeEntries }
  },
  component: TimeTrackerPage,
})

function TimeTrackerPage() {
  const { projectsList, timeEntries } = Route.useLoaderData()
  const router = useRouter()

  // Zustand timer store
  const { isRunning, seconds, projectId, startTimer, stopTimer, tick } = useTimerStore()

  // Local states
  const [descText, setDescText] = useState('')
  const [selectedProjId, setSelectedProjId] = useState(projectsList[0]?.project.id || '')
  const [isManualLogOpen, setIsManualLogOpen] = useState(false)
  const [timeString, setTimeString] = useState('00:00:00')

  // Live timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning) {
      interval = setInterval(() => {
        tick()
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning, tick])

  // Format elapsed seconds
  useEffect(() => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    const pad = (n: number) => n.toString().padStart(2, '0')
    setTimeString(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`)
  }, [seconds])

  const handleToggleTimer = async () => {
    if (isRunning) {
      await stopTimer()
      router.invalidate()
    } else {
      const proj = projectsList.find((p) => p.project.id === selectedProjId)
      if (!proj) return
      startTimer(
        selectedProjId,
        proj.project.title,
        null,
        null,
        descText || 'General hourly support'
      )
      setDescText('')
    }
  }

  // Client-side CSV Exporter
  const handleExportCSV = () => {
    if (timeEntries.length === 0) return

    const headers = [
      'Description',
      'Project',
      'Date',
      'Duration (Minutes)',
      'Hours',
      'Billable',
      'Hourly Rate',
      'Estimated Total',
    ]
    const rows = timeEntries.map(({ entry, projectName }) => {
      const hrs = entry.durationMinutes / 60
      const rate = parseFloat(entry.hourlyRate.toString())
      return [
        `"${entry.description || 'General'}"`,
        `"${projectName}"`,
        formatDateYYYYMMDD(entry.startedAt),
        entry.durationMinutes,
        hrs.toFixed(2),
        entry.isBillable ? 'Yes' : 'No',
        rate,
        (hrs * rate).toFixed(2),
      ]
    })

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `vantage_time_export_${new Date().toISOString().split('T')[0]}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Calculate quick utilization metrics
  let totalMin = 0
  let billableMin = 0
  let totalFinancialVal = 0

  timeEntries.forEach(({ entry }) => {
    totalMin += entry.durationMinutes
    if (entry.isBillable) {
      billableMin += entry.durationMinutes
      totalFinancialVal += (entry.durationMinutes / 60) * parseFloat(entry.hourlyRate.toString())
    }
  })

  const quickProjectsList = projectsList.map((p) => ({
    project: { id: p.project.id, title: p.project.title, hourlyRate: p.project.hourlyRate },
    clientName: p.clientName,
  }))

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-1">Time Tracker</h1>
          <p className="text-xs text-text-2">
            Measure active billable hours, record timesheets, and export CSV logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsManualLogOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus size={14} /> Log Hours Manually
          </Button>
          <Button
            size="sm"
            onClick={handleExportCSV}
            disabled={timeEntries.length === 0}
            className="flex items-center gap-1.5"
          >
            <Download size={14} /> Export CSV
          </Button>
        </div>
      </div>

      {/* Live Tracker Widget Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-gradient-to-br from-surface to-surface-2/40 border-accent/20 relative overflow-hidden">
          {/* Glare design overlay */}
          <div className="absolute right-[-10%] top-[-20%] w-[300px] h-[300px] rounded-full bg-accent/5 blur-3xl pointer-events-none" />

          <CardHeader className="pb-2 border-0">
            <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider">
              <span
                className={`w-2 h-2 rounded-full bg-accent ${isRunning ? 'animate-ping' : ''}`}
              />
              {isRunning ? 'Timer Running' : 'Idle Live Timer'}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Assigned Project"
                    options={projectsList.map((p) => ({
                      value: p.project.id,
                      label: p.project.title,
                    }))}
                    value={isRunning ? projectId || '' : selectedProjId}
                    onChange={(e) => setSelectedProjId(e.target.value)}
                    disabled={isRunning}
                  />
                  <Input
                    label="What are you working on?"
                    placeholder="e.g. Layout styling, bugfixing"
                    value={isRunning ? 'Live tracked details...' : descText}
                    onChange={(e) => setDescText(e.target.value)}
                    disabled={isRunning}
                  />
                </div>
              </div>
              <div className="text-center md:text-right">
                <span className="font-mono text-4xl font-extrabold text-text-1 block tracking-wider">
                  {timeString}
                </span>
                <span className="text-[10px] text-text-3 font-semibold uppercase block mt-1">
                  elapsed time
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleToggleTimer}
                variant={isRunning ? 'danger' : 'primary'}
                className="w-full md:w-auto px-8 flex items-center justify-center gap-2"
                disabled={projectsList.length === 0}
              >
                {isRunning ? (
                  <>
                    <Square size={14} fill="currentColor" /> Stop Live Tracker
                  </>
                ) : (
                  <>
                    <Play size={14} fill="currentColor" /> Start Live Tracker
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Aggregated timesheet stats card */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-2 border-0">
            <CardTitle className="text-xs font-bold text-text-2 uppercase">
              Timesheet Aggregates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border/40">
              <span className="text-xs text-text-2">Total Logged Time</span>
              <span className="text-sm font-bold text-text-1">{durationToHours(totalMin)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/40">
              <span className="text-xs text-text-2">Billable Ratio</span>
              <span className="text-sm font-bold text-accent">
                {totalMin > 0 ? Math.round((billableMin / totalMin) * 100) : 0}% (
                {durationToHours(billableMin)})
              </span>
            </div>
            <div className="flex justify-between items-center py-2 first:pt-0 last:border-b-0">
              <span className="text-xs text-text-2">Accumulated Value</span>
              <span className="text-base font-extrabold text-success">
                {formatCurrency(totalFinancialVal)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Time logs Table */}
      <Card>
        <CardHeader className="border-0 pb-2 flex flex-row justify-between items-center">
          <CardTitle className="text-xs font-bold text-text-2 uppercase">
            Time Logs History
          </CardTitle>
          <Clock size={16} className="text-text-3" />
        </CardHeader>
        <CardContent>
          <Table
            headers={[
              'Description',
              'Project',
              'Date',
              'Duration',
              'Billable',
              'Hourly Rate',
              'Effective Value',
            ]}
            isEmpty={timeEntries.length === 0}
            emptyMessage="No time logs found. Start the timer to record hours."
          >
            {timeEntries.map(({ entry, projectName }) => {
              const durationHours = entry.durationMinutes / 60
              const rate = parseFloat(entry.hourlyRate.toString())
              return (
                <TableRow key={entry.id}>
                  <TableCell className="font-semibold text-text-1">
                    {entry.description || 'General support'}
                  </TableCell>
                  <TableCell>{projectName}</TableCell>
                  <TableCell>{formatDateYYYYMMDD(entry.startedAt)}</TableCell>
                  <TableCell className="font-mono text-accent">
                    {durationToHours(entry.durationMinutes)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={entry.isBillable ? 'success' : 'secondary'}>
                      {entry.isBillable ? 'Billable' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(entry.hourlyRate)}/hr</TableCell>
                  <TableCell className="font-bold text-success">
                    {entry.isBillable ? formatCurrency(durationHours * rate) : '$0.00'}
                  </TableCell>
                </TableRow>
              )
            })}
          </Table>
        </CardContent>
      </Card>

      {/* MANUAL HOURS LOG MODAL */}
      <Modal
        isOpen={isManualLogOpen}
        onClose={() => setIsManualLogOpen(false)}
        title="Log Hours Manually"
        type="right"
      >
        {projectsList.length === 0 ? (
          <div className="py-8 text-center text-text-3 text-xs">
            Create a project before logging hours.
          </div>
        ) : (
          <TimeForm
            projectsList={quickProjectsList}
            tasksList={[]}
            onSuccess={() => {
              setIsManualLogOpen(false)
              router.invalidate()
            }}
            onCancel={() => setIsManualLogOpen(false)}
          />
        )}
      </Modal>
    </div>
  )
}
