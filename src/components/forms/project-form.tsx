import React, { useState } from 'react'
import { Input, Select, Textarea } from '#/components/ui/input'
import { Button } from '#/components/ui/button'
import { createProject } from '#/server/functions/projects'

interface ProjectFormProps {
  clientsList: { id: string; name: string; company: string | null }[]
  onSuccess: (project: any) => void
  onCancel: () => void
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ clientsList, onSuccess, onCancel }) => {
  const [clientId, setClientId] = useState(clientsList[0]?.id || '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'planning' | 'active' | 'on_hold'>('planning')
  const [type, setType] = useState<'fixed' | 'hourly' | 'retainer'>('fixed')
  const [budget, setBudget] = useState('0')
  const [hourlyRate, setHourlyRate] = useState('50')
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [isBillable, setIsBillable] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !clientId) return

    setLoading(true)
    setError(null)
    try {
      const res = await createProject({
        data: {
          clientId,
          title,
          description,
          status,
          type,
          budget: parseFloat(budget) || 0,
          hourlyRate: parseFloat(hourlyRate) || 0,
          startDate: startDate || null,
          dueDate: dueDate || null,
          isBillable,
        },
      })
      onSuccess(res)
    } catch (err: any) {
      setError(err.message || 'Failed to create project. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const clientOptions = clientsList.map((c) => ({
    value: c.id,
    label: c.company ? `${c.name} (${c.company})` : c.name,
  }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-xs font-semibold">
          {error}
        </div>
      )}

      <Select
        label="Select Client *"
        options={clientOptions}
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
        required
        disabled={loading}
      />

      <Input
        label="Project Title *"
        type="text"
        placeholder="e.g. Website Redesign, Marketing Campaign"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        disabled={loading}
      />

      <Textarea
        label="Project Scope/Description"
        placeholder="Summary of deliverables, constraints, and milestones..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={loading}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Billing Model"
          options={[
            { value: 'fixed', label: 'Fixed Price Contract' },
            { value: 'hourly', label: 'Hourly Rate Billing' },
            { value: 'retainer', label: 'Monthly Retainer' },
          ]}
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          disabled={loading}
        />
        <Select
          label="Initial Status"
          options={[
            { value: 'planning', label: 'Planning (Draft)' },
            { value: 'active', label: 'Active (Ongoing)' },
            { value: 'on_hold', label: 'On Hold' },
          ]}
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {type === 'fixed' || type === 'retainer' ? (
          <Input
            label={type === 'retainer' ? 'Monthly Retainer Budget' : 'Total Project Budget'}
            type="number"
            min="0"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            disabled={loading}
          />
        ) : (
          <Input
            label="Hourly Rate"
            type="number"
            min="0"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            disabled={loading}
          />
        )}

        <div className="flex items-center pt-6">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isBillable}
              onChange={(e) => setIsBillable(e.target.checked)}
              disabled={loading}
              className="rounded border-border bg-surface text-accent focus:ring-accent"
            />
            <span className="text-sm font-medium text-text-2">Billable Project</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          disabled={loading}
        />
        <Input
          label="Due Date / Deadline"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Starting...' : 'Create Project'}
        </Button>
      </div>
    </form>
  )
}
