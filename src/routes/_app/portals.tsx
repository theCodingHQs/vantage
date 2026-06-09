import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { getPortals, savePortalSettings } from '#/server/functions/portals'
import { getClients } from '#/server/functions/crm'
import { Button } from '#/components/ui/button'
import { Input, Select, Textarea } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import { Table, TableRow, TableCell } from '#/components/ui/table'
import { Card, CardHeader, CardTitle, CardContent } from '#/components/ui/card'
import { Modal } from '#/components/ui/modal'
import { Copy, Plus, Settings2, Globe, Link2 } from 'lucide-react'

export const Route = createFileRoute('/_app/portals')({
  loader: async () => {
    const portalsList = await getPortals()
    const clientsList = await getClients({ data: { status: 'all' } })
    return { portalsList, clientsList }
  },
  component: PortalsSettingsPage,
})

function PortalsSettingsPage() {
  const { portalsList, clientsList } = Route.useLoaderData()
  const router = useRouter()

  // State
  const [selectedPortal, setSelectedPortal] = useState<any | null>(null)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [clientId, setClientId] = useState(clientsList[0]?.id || '')
  const [slug, setSlug] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [showProjects, setShowProjects] = useState(true)
  const [showInvoices, setShowInvoices] = useState(true)
  const [showFiles, setShowFiles] = useState(true)
  const [showMessages, setShowMessages] = useState(true)
  const [customMessage, setCustomMessage] = useState(
    'Welcome to our collaborative portal! Here you can track all milestone deliverables.'
  )
  const [loading, setLoading] = useState(false)
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null)

  const handleOpenConfig = (portal: any) => {
    setSelectedPortal(portal)
    setClientId(portal.clientId)
    setSlug(portal.slug)
    setIsActive(portal.isActive)
    setShowProjects(portal.showProjects)
    setShowInvoices(portal.showInvoices)
    setShowFiles(portal.showFiles)
    setShowMessages(portal.showMessages)
    setCustomMessage(portal.customMessage || '')
    setIsConfigOpen(true)
  }

  const handleOpenNewPortal = () => {
    setSelectedPortal(null)
    setClientId(clientsList[0]?.id || '')
    setSlug(`portal-${Date.now().toString().substring(8)}`)
    setIsActive(true)
    setShowProjects(true)
    setShowInvoices(true)
    setShowFiles(true)
    setShowMessages(true)
    setCustomMessage('Welcome to our collaborative portal!')
    setIsConfigOpen(true)
  }

  const handleSavePortalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slug || !clientId) return

    setLoading(true)
    try {
      await savePortalSettings({
        data: {
          clientId,
          slug: slug
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9-]/g, '-'),
          isActive,
          showProjects,
          showInvoices,
          showFiles,
          showMessages,
          customMessage,
          password: '',
        },
      })
      setIsConfigOpen(false)
      router.invalidate()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = (portalSlug: string) => {
    const link = `${window.location.origin}/portal/${portalSlug}`
    navigator.clipboard.writeText(link)
    setCopiedStatus(portalSlug)
    setTimeout(() => setCopiedStatus(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-1">Client Portals</h1>
          <p className="text-xs text-text-2">
            Generate client-specific secure links to share task lists, project progress, and
            invoices.
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleOpenNewPortal}
          disabled={clientsList.length === 0}
          className="flex items-center gap-1"
        >
          <Plus size={14} /> Configure Portal
        </Button>
      </div>

      {/* PORTALS LIST */}
      <Table
        headers={['Client', 'Custom Slug URL', 'Shared Components', 'Status', 'Actions']}
        isEmpty={portalsList.length === 0}
        emptyMessage="No portals configured yet. Configure one to invite clients."
      >
        {portalsList.map(({ portal, clientName, clientCompany }) => (
          <TableRow key={portal.id}>
            <TableCell className="font-semibold text-text-1">
              <div>
                <p>{clientName}</p>
                <p className="text-[10px] text-text-3 font-normal">
                  {clientCompany || 'Individual'}
                </p>
              </div>
            </TableCell>
            <TableCell className="font-mono text-xs text-accent">
              <span className="flex items-center gap-1">
                <Globe size={12} /> /portal/{portal.slug}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1.5">
                {portal.showProjects && <Badge variant="secondary">Projects</Badge>}
                {portal.showInvoices && <Badge variant="secondary">Invoices</Badge>}
                {portal.showFiles && <Badge variant="secondary">Files</Badge>}
                {portal.showMessages && <Badge variant="secondary">Messages</Badge>}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={portal.isActive ? 'success' : 'secondary'}>
                {portal.isActive ? 'Active' : 'Disabled'}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopyLink(portal.slug)}
                  className="py-1 text-xs"
                >
                  {copiedStatus === portal.slug ? 'Copied!' : 'Copy Link'}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleOpenConfig(portal)}
                  className="py-1 text-xs flex items-center gap-1"
                >
                  <Settings2 size={12} /> Configure
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </Table>

      {/* CONFIGURATION DRAWER */}
      <Modal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        title="Configure Client Portal Settings"
        type="right"
      >
        <form onSubmit={handleSavePortalSubmit} className="space-y-6">
          <Select
            label="Associate with CRM Client *"
            options={clientsList.map((c) => ({ value: c.id, label: c.name }))}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
            disabled={selectedPortal !== null || loading}
          />

          <Input
            label="Unique Portal URL Slug *"
            placeholder="e.g. clientname-portal"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            disabled={loading}
          />

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-text-2 uppercase">
              Shared Elements
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showProjects}
                  onChange={(e) => setShowProjects(e.target.checked)}
                  disabled={loading}
                  className="rounded border-border bg-surface text-accent focus:ring-accent"
                />
                <span className="text-xs font-semibold text-text-2">Share Active Projects</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showInvoices}
                  onChange={(e) => setShowInvoices(e.target.checked)}
                  disabled={loading}
                  className="rounded border-border bg-surface text-accent focus:ring-accent"
                />
                <span className="text-xs font-semibold text-text-2">
                  Share Billing Invoice History
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showFiles}
                  onChange={(e) => setShowFiles(e.target.checked)}
                  disabled={loading}
                  className="rounded border-border bg-surface text-accent focus:ring-accent"
                />
                <span className="text-xs font-semibold text-text-2">Share Files & Docs</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showMessages}
                  onChange={(e) => setShowMessages(e.target.checked)}
                  disabled={loading}
                  className="rounded border-border bg-surface text-accent focus:ring-accent"
                />
                <span className="text-xs font-semibold text-text-2">
                  Enable Async Messaging Thread
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={loading}
                className="rounded border-border bg-surface text-accent focus:ring-accent"
              />
              <span className="text-xs font-semibold text-text-2">Portal Active & Accessible</span>
            </label>
          </div>

          <Textarea
            label="Branded Greeting Message"
            placeholder="Custom welcome banner greeting for client portal..."
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            disabled={loading}
            className="min-h-[100px]"
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsConfigOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              Save Configurations
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
