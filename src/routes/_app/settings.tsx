import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { getClients } from '#/server/functions/crm'
import { getProjects, getTimeEntries } from '#/server/functions/projects'
import { getInvoices, getExpenses } from '#/server/functions/invoicing'
import { Button } from '#/components/ui/button'
import { Input, Select, Textarea } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '#/components/ui/card'
import {
  User,
  Building2,
  FileText,
  CloudLightning,
  CreditCard,
  Database,
  ArrowRight,
  ShieldAlert,
  Download,
} from 'lucide-react'

export const Route = createFileRoute('/_app/settings')({
  loader: async () => {
    const clients = await getClients({ data: { status: 'all' } })
    const projects = await getProjects({ data: { status: 'all' } })
    const time = await getTimeEntries()
    const invoices = await getInvoices({ data: { status: 'all' } })
    const expenses = await getExpenses()
    return { clients, projects, time, invoices, expenses }
  },
  component: SettingsPage,
})

function SettingsPage() {
  const data = Route.useLoaderData()

  // Tabs State
  const [activeTab, setActiveTab] = useState<
    'profile' | 'business' | 'invoicing' | 'integrations' | 'billing' | 'data'
  >('profile')

  // Profile Form States
  const [name, setName] = useState('Jane Freelancer')
  const [email, setEmail] = useState('jane@creative.com')
  const [password, setPassword] = useState('')

  // Business Form States
  const [businessName, setBusinessName] = useState('Jane Creative Studios')
  const [currency, setCurrency] = useState('USD')
  const [timezone, setTimezone] = useState('UTC')

  // Invoicing defaults States
  const [taxRate, setTaxRate] = useState('10')
  const [hourlyRate, setHourlyRate] = useState('75')
  const [instructions, setInstructions] = useState(
    'Please remit payments to Bank Wire Routing: 123456789 Account: 987654321'
  )

  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    setTimeout(() => {
      setSaving(false)
      setMsg('Settings saved successfully!')
    }, 800)
  }

  // Backup Workspace JSON Downloader
  const handleBackupExport = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      workspace: {
        profile: { name, email, businessName, currency, timezone },
        clients: data.clients,
        projects: data.projects,
        timeEntries: data.time,
        invoices: data.invoices,
        expenses: data.expenses,
      },
    }

    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2))
    const link = document.createElement('a')
    link.setAttribute('href', dataStr)
    link.setAttribute(
      'download',
      `vantage_workspace_backup_${new Date().toISOString().split('T')[0]}.json`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-1">Settings</h1>
          <p className="text-xs text-text-2">
            Configure profile credentials, invoicing preferences, integrations, and backup files.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-1.5 bg-surface-2/10 border border-border/80 p-3 rounded-xl h-fit">
          {[
            { id: 'profile', label: 'User Profile', icon: User },
            { id: 'business', label: 'Business Profile', icon: Building2 },
            { id: 'invoicing', label: 'Invoicing Defaults', icon: FileText },
            { id: 'integrations', label: 'Integrations', icon: CloudLightning },
            { id: 'billing', label: 'Billing & Sub', icon: CreditCard },
            { id: 'data', label: 'Data & Backup', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any)
                  setMsg(null)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-surface-2 text-text-1 border-l-2 border-accent'
                    : 'text-text-2 hover:bg-surface-2/50 hover:text-text-1 border-l-2 border-transparent'
                }`}
              >
                <Icon size={14} className="flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab content panel */}
        <Card className="lg:col-span-3">
          {msg && (
            <div className="mb-6 p-3 bg-success/10 border border-success/20 text-success rounded-lg text-xs font-semibold">
              {msg}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSave} className="space-y-4 animate-in fade-in duration-200">
              <h3 className="text-sm font-semibold text-text-1 border-b border-border/60 pb-2 mb-4">
                User Profile Credentials
              </h3>
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Update Password"
                type="password"
                placeholder="Leave blank to keep current password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="flex justify-end pt-4 border-t border-border">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </form>
          )}

          {/* Business Tab */}
          {activeTab === 'business' && (
            <form onSubmit={handleSave} className="space-y-4 animate-in fade-in duration-200">
              <h3 className="text-sm font-semibold text-text-1 border-b border-border/60 pb-2 mb-4">
                Business Branding
              </h3>
              <Input
                label="Registered Business Name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Display Currency"
                  options={[
                    { value: 'USD', label: 'USD ($)' },
                    { value: 'EUR', label: 'EUR (€)' },
                    { value: 'GBP', label: 'GBP (£)' },
                    { value: 'CAD', label: 'CAD ($)' },
                    { value: 'AUD', label: 'AUD ($)' },
                  ]}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                />
                <Select
                  label="Display Timezone"
                  options={[
                    { value: 'UTC', label: 'UTC' },
                    { value: 'America/New_York', label: 'EST / New York' },
                    { value: 'Europe/London', label: 'GMT / London' },
                    { value: 'Asia/Kolkata', label: 'IST / India' },
                    { value: 'Asia/Tokyo', label: 'JST / Japan' },
                  ]}
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                />
              </div>
              <div className="flex justify-end pt-4 border-t border-border">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Business Settings'}
                </Button>
              </div>
            </form>
          )}

          {/* Invoicing defaults Tab */}
          {activeTab === 'invoicing' && (
            <form onSubmit={handleSave} className="space-y-4 animate-in fade-in duration-200">
              <h3 className="text-sm font-semibold text-text-1 border-b border-border/60 pb-2 mb-4">
                Invoice Generation Defaults
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Default Tax Rate (%)"
                  type="number"
                  min="0"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                />
                <Input
                  label="Default Hourly Rate ($)"
                  type="number"
                  min="0"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                />
              </div>
              <Textarea
                label="Default Payment Terms / Instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex justify-end pt-4 border-t border-border">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Invoicing Defaults'}
                </Button>
              </div>
            </form>
          )}

          {/* Integrations Placeholder */}
          {activeTab === 'integrations' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h3 className="text-sm font-semibold text-text-1 border-b border-border/60 pb-2 mb-4">
                Integrations & Workflows
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    name: 'Stripe Payments',
                    desc: 'Accept direct credit card payments on client invoices.',
                    status: 'Disabled',
                  },
                  {
                    name: 'Google Calendar',
                    desc: 'Auto-schedule proposal review calls.',
                    status: 'Disabled',
                  },
                  {
                    name: 'Zapier Webhooks',
                    desc: 'Trigger automation when invoices are marked paid.',
                    status: 'Disabled',
                  },
                  {
                    name: 'Slack Webhooks',
                    desc: 'Ping a channel when client messages are received.',
                    status: 'Disabled',
                  },
                ].map((integ, idx) => (
                  <div
                    key={idx}
                    className="p-4 border border-border bg-surface-2/20 rounded-xl flex flex-col justify-between h-36"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-text-1">{integ.name}</h4>
                      <p className="text-[10px] text-text-2 mt-1.5 leading-relaxed">{integ.desc}</p>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <Badge variant="secondary">{integ.status}</Badge>
                      <Button size="sm" variant="ghost" className="py-0.5 px-2 text-[10px]">
                        Configure
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Billing Upgrade Info */}
          {activeTab === 'billing' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h3 className="text-sm font-semibold text-text-1 border-b border-border/60 pb-2 mb-4">
                Subscription Billing Details
              </h3>

              <div className="p-6 bg-gradient-to-br from-surface-2 to-surface border border-accent/20 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-text-1">Vantage Solo tier</span>
                    <Badge variant="primary">Active Trial</Badge>
                  </div>
                  <p className="text-xs text-text-2 mt-2 leading-relaxed max-w-sm">
                    You are currently using the Vantage Solo trial. Upgrading locks in unlimited
                    client portals, PDF formatting, and multi-currency billing.
                  </p>
                </div>
                <div className="text-center md:text-right">
                  <span className="text-2xl font-extrabold text-text-1 block">$12.00/mo</span>
                  <Button className="mt-3 text-xs">Upgrade to Pro</Button>
                </div>
              </div>
            </div>
          )}

          {/* Data Backup Tab */}
          {activeTab === 'data' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h3 className="text-sm font-semibold text-text-1 border-b border-border/60 pb-2 mb-4">
                Workspace Backup & Privacy
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card variant="surface-2" className="flex flex-col justify-between h-40">
                  <div>
                    <h4 className="text-xs font-bold text-text-1">Export Workspace Data</h4>
                    <p className="text-[10px] text-text-2 mt-1.5 leading-relaxed">
                      Download a JSON file containing all client CRM details, timesheet logs,
                      projects, tasks, invoice values, and logged cash outlays.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleBackupExport}
                    className="flex items-center gap-1 text-xs w-fit"
                  >
                    <Download size={12} /> Backup JSON
                  </Button>
                </Card>

                <Card
                  variant="surface-2"
                  className="border-danger/30 bg-danger/[0.01] flex flex-col justify-between h-40"
                >
                  <div>
                    <h4 className="text-xs font-bold text-text-1 text-danger">
                      Delete Entire Workspace
                    </h4>
                    <p className="text-[10px] text-text-2 mt-1.5 leading-relaxed">
                      This will permanently clear all records, log entries, and uploaded assets.
                      This action is irreversible.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    className="flex items-center gap-1 text-xs w-fit"
                  >
                    <ShieldAlert size={12} /> Delete Account
                  </Button>
                </Card>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
