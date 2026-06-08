import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { getClients, createClient, updateClient, getDeals, createDeal, updateDealStatus } from '#/server/functions/crm'
import { getProjects } from '#/server/functions/projects'
import { getInvoices } from '#/server/functions/invoicing'
import { Button } from '#/components/ui/button'
import { Input, Select, Textarea } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import { Table, TableRow, TableCell } from '#/components/ui/table'
import { Modal } from '#/components/ui/modal'
import { ClientForm } from '#/components/forms/client-form'
import { formatCurrency, formatDate } from '#/lib/utils'
import { 
  Plus, 
  Search, 
  KanbanSquare, 
  ListFilter, 
  Grid, 
  Briefcase, 
  FileText, 
  File, 
  Calendar, 
  Clock, 
  ArrowRight,
  TrendingUp
} from 'lucide-react'
import { z } from 'zod'

export const Route = createFileRoute('/_app/clients')({
  loader: async () => {
    const clientsList = await getClients({ data: { status: 'all' } })
    const dealsList = await getDeals()
    const projectsList = await getProjects({ data: { status: 'all' } })
    const invoicesList = await getInvoices({ data: { status: 'all' } })
    return { clientsList, dealsList, projectsList, invoicesList }
  },
  component: ClientsPage,
})

function ClientsPage() {
  const { clientsList, dealsList, projectsList, invoicesList } = Route.useLoaderData()
  const router = useRouter()

  // State
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isAddClientOpen, setIsAddClientOpen] = useState(false)
  const [isAddDealOpen, setIsAddDealOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any | null>(null)
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'projects' | 'invoices' | 'notes'>('overview')
  
  // Deal Form State
  const [dealTitle, setDealTitle] = useState('')
  const [dealValue, setDealValue] = useState('')
  const [dealClient, setDealClient] = useState(clientsList[0]?.id || '')

  // Note State
  const [notesText, setNotesText] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  // Drag and Drop State
  const [draggingDealId, setDraggingDealId] = useState<string | null>(null)
  const [processingDealId, setProcessingDealId] = useState<string | null>(null)
  const [processingTargetStatus, setProcessingTargetStatus] = useState<'lead' | 'proposal' | 'negotiation' | 'won' | 'lost' | null>(null)

  const handleCreateClientSuccess = () => {
    setIsAddClientOpen(false)
    router.invalidate()
  }

  const handleCreateDealSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dealTitle || !dealClient) return

    try {
      await createDeal({
        data: {
          title: dealTitle,
          clientId: dealClient,
          value: parseFloat(dealValue) || 0,
          currency: 'USD',
          status: 'lead',
          probability: 50,
          expectedCloseDate: null,
          notes: '',
          lostReason: ''
        }
      })
      setIsAddDealOpen(false)
      setDealTitle('')
      setDealValue('')
      router.invalidate()
    } catch (err) {
      console.error(err)
    }
  }

  // Notes update handler
  const handleSaveNotes = async () => {
    if (!selectedClient) return
    setSavingNotes(true)
    try {
      const updated = await updateClient({
        data: {
          id: selectedClient.id,
          data: {
            name: selectedClient.name,
            email: selectedClient.email || '',
            phone: selectedClient.phone || '',
            company: selectedClient.company || '',
            website: selectedClient.website || '',
            avatarUrl: selectedClient.avatarUrl || '',
            status: selectedClient.status,
            address: selectedClient.address || '',
            notes: notesText,
            tags: [],
          }
        }
      })
      setSelectedClient(updated)
      router.invalidate()
    } catch (err) {
      console.error(err)
    } finally {
      setSavingNotes(false)
    }
  }

  // Filter clients
  const filteredClients = clientsList.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          (c.company && c.company.toLowerCase().includes(search.toLowerCase())) ||
                          (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus
    return matchesSearch && matchesStatus
  })

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingDealId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: 'lead' | 'proposal' | 'negotiation' | 'won' | 'lost') => {
    e.preventDefault()
    if (!draggingDealId) return

    const dealId = draggingDealId
    setProcessingDealId(dealId)
    setProcessingTargetStatus(targetStatus)
    setDraggingDealId(null)

    try {
      await updateDealStatus({
        data: {
          id: dealId,
          status: targetStatus,
          lostReason: targetStatus === 'lost' ? 'Declined by client during negotiation' : undefined
        }
      })
      router.invalidate()
    } catch (err) {
      console.error(err)
    } finally {
      setProcessingDealId(null)
      setProcessingTargetStatus(null)
    }
  }

  // Group deals by status
  const columns: { id: 'lead' | 'proposal' | 'negotiation' | 'won' | 'lost'; title: string }[] = [
    { id: 'lead', title: 'Leads' },
    { id: 'proposal', title: 'Proposal Sent' },
    { id: 'negotiation', title: 'Negotiation' },
    { id: 'won', title: 'Won (Project)' },
    { id: 'lost', title: 'Lost' },
  ]

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-1">Client CRM</h1>
          <p className="text-xs text-text-2">Manage customer details, notes, and deal pipelines.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle list vs pipeline */}
          <div className="flex bg-surface border border-border p-1 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'list' ? 'bg-surface-2 text-text-1' : 'text-text-2 hover:text-text-1'
              }`}
            >
              <ListFilter size={14} /> Contacts
            </button>
            <button
              onClick={() => setViewMode('pipeline')}
              className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'pipeline' ? 'bg-surface-2 text-text-1' : 'text-text-2 hover:text-text-1'
              }`}
            >
              <KanbanSquare size={14} /> Sales Pipeline
            </button>
          </div>

          <Button size="sm" onClick={() => setIsAddClientOpen(true)} className="flex items-center gap-1">
            <Plus size={14} /> Add Client
          </Button>
          {viewMode === 'pipeline' && (
            <Button size="sm" variant="secondary" onClick={() => setIsAddDealOpen(true)} className="flex items-center gap-1">
              <Plus size={14} /> New Deal
            </Button>
          )}
        </div>
      </div>

      {/* FILTER CONTROLS FOR LIST VIEW */}
      {viewMode === 'list' && (
        <div className="flex flex-col md:flex-row items-center gap-4 bg-surface-2/10 border border-border/60 p-4 rounded-xl">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-2.5 text-text-3" />
            <input
              type="text"
              placeholder="Search clients by name, company, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-2 border border-border hover:border-border-hover focus:border-accent text-text-1 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'prospect', label: 'Prospect' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* CONTACT LIST VIEW */}
      {viewMode === 'list' && (
        <Table
          headers={['Client Name', 'Company', 'Status', 'Total Revenue', 'Last Contact', 'Created At']}
          isEmpty={filteredClients.length === 0}
          emptyMessage="No CRM contacts match your search."
        >
          {filteredClients.map((client) => (
            <TableRow
              key={client.id}
              onClick={() => {
                setSelectedClient(client)
                setNotesText(client.notes || '')
                setActiveDetailTab('overview')
              }}
            >
              <TableCell className="font-semibold text-text-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center text-[10px] text-accent font-bold uppercase">
                    {client.name[0]}
                  </div>
                  <div>
                    <p>{client.name}</p>
                    <p className="text-[10px] text-text-3 font-normal">{client.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{client.company || '—'}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    client.status === 'active'
                      ? 'success'
                      : client.status === 'prospect'
                      ? 'primary'
                      : 'secondary'
                  }
                >
                  {client.status}
                </Badge>
              </TableCell>
              <TableCell className="text-success font-bold">{formatCurrency(client.totalRevenue)}</TableCell>
              <TableCell>{client.lastContactAt ? formatDate(client.lastContactAt) : 'Never'}</TableCell>
              <TableCell>{formatDate(client.createdAt)}</TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      {/* SALES PIPELINE KANBAN VIEW */}
      {viewMode === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 h-[70vh] overflow-hidden">
          {columns.map((col) => {
            const columnDeals = dealsList.map(d => {
              if (d.deal.id === processingDealId && processingTargetStatus) {
                return {
                  ...d,
                  deal: {
                    ...d.deal,
                    status: processingTargetStatus
                  }
                }
              }
              return d
            }).filter(d => d.deal.status === col.id)
            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                className="bg-surface border border-border/80 rounded-xl p-3 flex flex-col h-full overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3">
                  <h3 className="text-xs font-bold text-text-2 uppercase tracking-wide">{col.title}</h3>
                  <Badge variant="secondary">{columnDeals.length}</Badge>
                </div>

                <div className="flex-1 space-y-3 min-h-[400px]">
                  {columnDeals.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-text-3 text-[10px] text-center border-2 border-dashed border-border/40 rounded-lg py-12">
                      Drag here
                    </div>
                  ) : (
                    columnDeals.map(({ deal, clientName, clientCompany }) => {
                      const isProcessing = deal.id === processingDealId
                      return (
                        <div
                          key={deal.id}
                          draggable={!isProcessing}
                          onDragStart={(e) => handleDragStart(e, deal.id)}
                          className={`p-3 bg-surface-2 border rounded-lg transition-all space-y-2 group relative overflow-hidden ${
                            isProcessing
                              ? 'border-accent/40 opacity-70 cursor-not-allowed select-none'
                              : 'border-border hover:border-accent/30 cursor-grab active:cursor-grabbing hover:translate-y-[-1px]'
                          }`}
                        >
                          {isProcessing && (
                            <div className="absolute inset-0 bg-surface-2/60 backdrop-blur-[0.5px] flex items-center justify-center gap-1.5 text-[10px] text-accent font-semibold animate-pulse">
                              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-accent border-t-transparent" />
                              <span>Updating...</span>
                            </div>
                          )}
                          <h4 className="text-xs font-semibold text-text-1 group-hover:text-accent transition-colors">{deal.title}</h4>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-text-2">{clientName}</span>
                            <span className="text-xs font-bold text-success">{formatCurrency(deal.value)}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 text-[9px] text-text-3 border-t border-border/40">
                            <span>Prob: {deal.probability}%</span>
                            <span className="flex items-center gap-0.5 text-accent"><TrendingUp size={10} /> Active</span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ADD CLIENT MODAL */}
      <Modal isOpen={isAddClientOpen} onClose={() => setIsAddClientOpen(false)} title="Add New Client Profile" type="right">
        <ClientForm onSuccess={handleCreateClientSuccess} onCancel={() => setIsAddClientOpen(false)} />
      </Modal>

      {/* ADD DEAL MODAL */}
      <Modal isOpen={isAddDealOpen} onClose={() => setIsAddDealOpen(false)} title="New Pipeline Deal" type="center">
        <form onSubmit={handleCreateDealSubmit} className="space-y-4">
          <Input
            label="Deal Title / Opportunity *"
            placeholder="e.g. Website Redesign Contract"
            value={dealTitle}
            onChange={(e) => setDealTitle(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Associated Client *"
              options={clientsList.map(c => ({ value: c.id, label: c.name }))}
              value={dealClient}
              onChange={(e) => setDealClient(e.target.value)}
              required
            />
            <Input
              label="Deal Value ($) *"
              type="number"
              min="0"
              placeholder="e.g. 5000"
              value={dealValue}
              onChange={(e) => setDealValue(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setIsAddDealOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Deal
            </Button>
          </div>
        </form>
      </Modal>

      {/* CLIENT DETAILS DRAWER SIDE PANEL */}
      <Modal
        isOpen={selectedClient !== null}
        onClose={() => setSelectedClient(null)}
        title={selectedClient?.name || 'Client Profile Details'}
        type="right"
      >
        {selectedClient && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center gap-4 bg-surface-2/40 p-4 border border-border rounded-xl">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent text-lg font-bold uppercase">
                {selectedClient.name[0]}
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-text-1">{selectedClient.name}</h4>
                <p className="text-xs text-text-2">{selectedClient.company || 'No company registered'}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge variant={selectedClient.status === 'active' ? 'success' : 'primary'}>
                    {selectedClient.status}
                  </Badge>
                  <span className="text-[10px] text-text-3 font-semibold uppercase">{selectedClient.email}</span>
                </div>
              </div>
            </div>

            {/* Financial indicators */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border border-border bg-surface-2/10 rounded-xl">
                <span className="text-[10px] text-text-3 font-bold uppercase block">Total Billing</span>
                <span className="text-lg font-bold text-success mt-1 block">{formatCurrency(selectedClient.totalRevenue)}</span>
              </div>
              <div className="p-3 border border-border bg-surface-2/10 rounded-xl">
                <span className="text-[10px] text-text-3 font-bold uppercase block">Projects Count</span>
                <span className="text-lg font-bold text-text-1 mt-1 block">{selectedClient.totalProjects} contracts</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-border/80 gap-4">
              {['overview', 'projects', 'invoices', 'notes'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveDetailTab(tab as any)}
                  className={`pb-2 text-xs font-semibold capitalize border-b-2 transition-all cursor-pointer ${
                    activeDetailTab === tab
                      ? 'border-accent text-text-1 font-bold'
                      : 'border-transparent text-text-2 hover:text-text-1'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content 1: Overview */}
            {activeDetailTab === 'overview' && (
              <div className="space-y-4 text-sm animate-in fade-in duration-200">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-text-3 uppercase">Contact Information</h4>
                  <p className="text-text-1"><strong>Phone:</strong> {selectedClient.phone || 'N/A'}</p>
                  <p className="text-text-1"><strong>Website:</strong> {selectedClient.website || 'N/A'}</p>
                  <p className="text-text-1"><strong>Address:</strong> {selectedClient.address || 'N/A'}</p>
                </div>
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <h4 className="text-xs font-bold text-text-3 uppercase">Profile Bio / Summary</h4>
                  <p className="text-text-2 text-xs leading-relaxed italic">
                    {selectedClient.notes || 'No notes added yet. Use the notes tab to save details.'}
                  </p>
                </div>
              </div>
            )}

            {/* Tab content 2: Projects */}
            {activeDetailTab === 'projects' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <h4 className="text-xs font-bold text-text-3 uppercase">Linked Contracts</h4>
                {projectsList.filter(p => p.project.clientId === selectedClient.id).length === 0 ? (
                  <p className="text-xs text-text-3">No projects found for this client.</p>
                ) : (
                  projectsList.filter(p => p.project.clientId === selectedClient.id).map(p => (
                    <div key={p.project.id} className="p-3 border border-border bg-surface-2/20 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-text-1">{p.project.title}</p>
                        <p className="text-[10px] text-text-3 mt-0.5">Model: {p.project.type} &middot; Status: {p.project.status}</p>
                      </div>
                      <Badge variant={p.project.status === 'active' ? 'success' : 'secondary'}>
                        {p.project.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab content 3: Invoices */}
            {activeDetailTab === 'invoices' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <h4 className="text-xs font-bold text-text-3 uppercase">Billing Statements</h4>
                {invoicesList.filter(i => i.invoice.clientId === selectedClient.id).length === 0 ? (
                  <p className="text-xs text-text-3">No invoices found for this client.</p>
                ) : (
                  invoicesList.filter(i => i.invoice.clientId === selectedClient.id).map(i => (
                    <div key={i.invoice.id} className="p-3 border border-border bg-surface-2/20 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-text-1">Invoice {i.invoice.invoiceNumber}</p>
                        <p className="text-[10px] text-text-3 mt-0.5">Due: {formatDate(i.invoice.dueDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-success">{formatCurrency(i.invoice.total)}</p>
                        <Badge variant={i.invoice.status === 'paid' ? 'success' : 'warning'} className="mt-1">
                          {i.invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab content 4: Notes */}
            {activeDetailTab === 'notes' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <Textarea
                  label="Edit Client Summary & Notes"
                  placeholder="Record custom preferences, business models, client requirements here..."
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  className="min-h-[200px]"
                  disabled={savingNotes}
                />
                <div className="flex justify-end">
                  <Button onClick={handleSaveNotes} disabled={savingNotes}>
                    {savingNotes ? 'Saving...' : 'Save Notes'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
