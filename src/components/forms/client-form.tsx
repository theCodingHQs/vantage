import React, { useState } from 'react'
import { Input, Select, Textarea } from '#/components/ui/input'
import { Button } from '#/components/ui/button'
import { createClient } from '#/server/functions/crm'

interface ClientFormProps {
  onSuccess: (client: any) => void
  onCancel: () => void
}

export const ClientForm: React.FC<ClientFormProps> = ({ onSuccess, onCancel }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive' | 'prospect'>('prospect')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    setLoading(true)
    setError(null)
    try {
      const res = await createClient({
        data: {
          name,
          email,
          phone,
          company,
          status,
          address,
          notes,
          tags: [],
          avatarUrl: '',
        },
      })
      onSuccess(res)
    } catch (err: any) {
      setError(err.message || 'Failed to create client. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-xs font-semibold">
          {error}
        </div>
      )}

      <Input
        label="Client Name *"
        type="text"
        placeholder="Jane Doe"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        disabled={loading}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="jane@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <Input
          label="Phone Number"
          type="text"
          placeholder="+1 (555) 019-2834"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Company Name"
          type="text"
          placeholder="Acme Corp"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          disabled={loading}
        />
        <Select
          label="CRM Status"
          options={[
            { value: 'prospect', label: 'Prospect (Lead)' },
            { value: 'active', label: 'Active Client' },
            { value: 'inactive', label: 'Inactive' },
          ]}
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          disabled={loading}
        />
      </div>

      <Input
        label="Billing Address"
        type="text"
        placeholder="123 Creative St, Design District"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        disabled={loading}
      />

      <Textarea
        label="Internal Notes"
        placeholder="Project preferences, billing details, timelines..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        disabled={loading}
      />

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Client'}
        </Button>
      </div>
    </form>
  )
}
