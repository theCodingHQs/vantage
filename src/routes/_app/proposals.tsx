import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import {
  getProposals,
  getProposalDetail,
  createProposal,
  recordProposalView,
  acceptProposal,
  declineProposal,
} from '#/server/functions/proposals'
import { getClients } from '#/server/functions/crm'
import { sendProposalEmail } from '#/server/email'
import { Button } from '#/components/ui/button'
import { Input, Select, Textarea } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import { Table, TableRow, TableCell } from '#/components/ui/table'
import { Card, CardHeader, CardTitle, CardContent } from '#/components/ui/card'
import { Modal } from '#/components/ui/modal'
import { formatCurrency, formatDate } from '#/lib/utils'
import {
  Plus,
  Search,
  FileText,
  Send,
  CheckCircle2,
  Copy,
  FileSpreadsheet,
  Lock,
} from 'lucide-react'

export const Route = createFileRoute('/_app/proposals')({
  loader: async () => {
    const proposalsList = await getProposals()
    const clientsList = await getClients({ data: { status: 'all' } })
    return { proposalsList, clientsList }
  },
  component: ProposalsPage,
})

function ProposalsPage() {
  const { proposalsList, clientsList } = Route.useLoaderData()
  const router = useRouter()

  // State
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null)
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)

  // Builder States
  const [clientId, setClientId] = useState(clientsList[0]?.id || '')
  const [title, setTitle] = useState('')
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
  )
  const [totalValue, setTotalValue] = useState('1000')
  const [introText, setIntroText] = useState(
    'We are excited to propose our services for your next milestone...'
  )
  const [scopeText, setScopeText] = useState(
    '1. Design mockups\n2. React development\n3. SEO optimization'
  )

  // E-Signature States
  const [isSignOpen, setIsSignOpen] = useState(false)
  const [signatureText, setSignatureText] = useState('')

  // Email status
  const [emailStatus, setEmailStatus] = useState<string | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)

  const handleCreateProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId || !title) return

    try {
      await createProposal({
        data: {
          clientId,
          title,
          validUntil,
          totalValue: parseFloat(totalValue) || 0,
          contentJson: {
            intro: introText,
            scope: scopeText.split('\n'),
          },
        },
      })
      setIsBuilderOpen(false)
      setTitle('')
      router.invalidate()
    } catch (err) {
      console.error(err)
    }
  }

  const handleSendProposal = async () => {
    if (!selectedProposal) return
    const activePortal = selectedProposal.client.portals?.[0]
    if (!activePortal) {
      setEmailStatus(
        'No Client Portal configured for this client yet. Configure one in Client Portals first.'
      )
      return
    }
    setSendingEmail(true)
    setEmailStatus(null)
    try {
      const portalUrl = `${window.location.origin}/portal/${activePortal.slug}`
      const emailRes = await sendProposalEmail({
        data: {
          toEmail: selectedProposal.client.email || 'client@company.com',
          proposalTitle: selectedProposal.title,
          clientName: selectedProposal.client.name,
          proposalUrl: portalUrl,
        },
      })

      if (emailRes.success) {
        setEmailStatus('Proposal sent successfully to client email!')
        // Mark proposal status as sent
        if (selectedProposal.status === 'draft') {
          const updated = await recordProposalView({ data: { id: selectedProposal.id } })
          setSelectedProposal({ ...selectedProposal, ...updated })
        }
      }
    } catch (err) {
      setEmailStatus('Failed to send proposal email.')
    } finally {
      setSendingEmail(false)
    }
  }

  const handleAcceptProposal = async () => {
    if (!selectedProposal || !signatureText) return
    try {
      const updated = await acceptProposal({
        data: {
          id: selectedProposal.id,
          signatureText,
        },
      })
      setSelectedProposal({ ...selectedProposal, ...updated })
      setIsSignOpen(false)
      setSignatureText('')
      router.invalidate()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeclineProposal = async () => {
    if (!selectedProposal) return
    try {
      const updated = await declineProposal({ data: { id: selectedProposal.id } })
      setSelectedProposal({ ...selectedProposal, ...updated })
      router.invalidate()
    } catch (err) {
      console.error(err)
    }
  }

  const handleCopyLink = () => {
    if (!selectedProposal) return
    const activePortal = selectedProposal.client.portals?.[0]
    if (!activePortal) {
      setEmailStatus(
        'No Client Portal configured for this client yet. Go to Client Portals to configure one first.'
      )
      return
    }
    const url = `${window.location.origin}/portal/${activePortal.slug}`
    navigator.clipboard.writeText(url)
    setEmailStatus('Copied Client Portal proposal link to clipboard!')
  }

  // Filter list
  const filteredProposals = proposalsList.filter((p) => {
    const matchesSearch =
      p.proposal.title.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || p.proposal.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-1">Proposals</h1>
          <p className="text-xs text-text-2">
            Build rich design proposals, track client views, and log e-signatures.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsBuilderOpen(true)}
          className="flex items-center gap-1"
        >
          <Plus size={14} /> New Proposal
        </Button>
      </div>

      {/* FILTER CONTROLS */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-surface-2/10 border border-border/60 p-4 rounded-xl">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-2.5 text-text-3" />
          <input
            type="text"
            placeholder="Search by proposal title or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-2 border border-border hover:border-border-hover focus:border-accent text-text-1 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div className="w-full md:w-48">
          <Select
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'draft', label: 'Draft' },
              { value: 'sent', label: 'Sent' },
              { value: 'viewed', label: 'Viewed' },
              { value: 'accepted', label: 'Accepted' },
              { value: 'declined', label: 'Declined' },
            ]}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          />
        </div>
      </div>

      {/* LIST TABLE */}
      <Table
        headers={['Proposal Title', 'Client', 'Valid Until', 'Total Value', 'Status']}
        isEmpty={filteredProposals.length === 0}
        emptyMessage="No proposals found."
      >
        {filteredProposals.map((p) => (
          <TableRow
            key={p.proposal.id}
            onClick={async () => {
              const detail = await getProposalDetail({ data: { id: p.proposal.id } })
              setSelectedProposal(detail)
              setEmailStatus(null)
            }}
          >
            <TableCell className="font-semibold text-text-1">{p.proposal.title}</TableCell>
            <TableCell>{p.clientName}</TableCell>
            <TableCell>{p.proposal.validUntil ? formatDate(p.proposal.validUntil) : '—'}</TableCell>
            <TableCell className="font-bold text-text-1">
              {formatCurrency(p.proposal.totalValue)}
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  p.proposal.status === 'accepted'
                    ? 'success'
                    : p.proposal.status === 'sent' || p.proposal.status === 'viewed'
                      ? 'primary'
                      : p.proposal.status === 'declined'
                        ? 'danger'
                        : 'secondary'
                }
              >
                {p.proposal.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </Table>

      {/* RICH PROPOSAL BUILDER MODAL */}
      <Modal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        title="Generate Project Proposal"
        type="right"
      >
        {clientsList.length === 0 ? (
          <div className="py-8 text-center text-text-3 text-xs">
            Add a CRM client before building proposals.
          </div>
        ) : (
          <form onSubmit={handleCreateProposalSubmit} className="space-y-4">
            <Select
              label="Select Client Target *"
              options={clientsList.map((c) => ({ value: c.id, label: c.name }))}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            />
            <Input
              label="Proposal Title *"
              placeholder="e.g. UX Optimization Campaign"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Offer Valid Until"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
              <Input
                label="Estimated Deal Value ($)"
                type="number"
                min="0"
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                required
              />
            </div>

            <Textarea
              label="Introductory / Executive Summary"
              placeholder="Briefly review the objectives of the client and how you plan to tackle them..."
              value={introText}
              onChange={(e) => setIntroText(e.target.value)}
              className="min-h-[100px]"
            />

            <Textarea
              label="Scope of Deliverables (One item per line)"
              placeholder="e.g. Design review\nReact coding\nDeployment checks"
              value={scopeText}
              onChange={(e) => setScopeText(e.target.value)}
              className="min-h-[120px]"
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="ghost" onClick={() => setIsBuilderOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Proposal</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* PROPOSAL PREVIEW DRAWER */}
      <Modal
        isOpen={selectedProposal !== null}
        onClose={() => setSelectedProposal(null)}
        title="Proposal Checkout"
        type="right"
      >
        {selectedProposal && (
          <div className="space-y-6">
            {/* Action Header controls */}
            <div className="flex items-center justify-between p-3 bg-surface-2 border border-border rounded-xl">
              <div className="flex items-center gap-1.5">
                <Badge variant={selectedProposal.status === 'accepted' ? 'success' : 'primary'}>
                  {selectedProposal.status}
                </Badge>
                <span className="text-xs text-text-3 font-semibold uppercase">
                  {formatCurrency(selectedProposal.totalValue)}
                </span>
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyLink}
                  title="Copy Sharing Link"
                >
                  <Copy size={16} />
                </Button>
                {selectedProposal.status !== 'accepted' &&
                  selectedProposal.status !== 'declined' && (
                    <>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={handleDeclineProposal}
                        className="text-xs"
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setIsSignOpen(true)}
                        className="text-xs"
                      >
                        Sign / Accept
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSendProposal}
                        disabled={sendingEmail}
                        className="flex items-center gap-1 text-xs"
                      >
                        <Send size={12} /> {sendingEmail ? 'Sending...' : 'Send'}
                      </Button>
                    </>
                  )}
              </div>
            </div>

            {emailStatus && (
              <div className="p-3 bg-success/15 border border-success/35 text-success rounded-lg text-xs font-semibold">
                {emailStatus}
              </div>
            )}

            {/* Proposal visual container */}
            <div className="p-6 border border-border bg-surface rounded-xl space-y-6 text-sm text-text-2">
              <div className="border-b border-border/60 pb-4">
                <span className="text-[10px] text-text-3 font-bold uppercase tracking-wider block">
                  Project Proposal
                </span>
                <h3 className="text-base font-extrabold text-text-1 mt-1">
                  {selectedProposal.title}
                </h3>
                <p className="text-xs text-text-3 mt-1">
                  Prepared for: {selectedProposal.client.name} &middot;{' '}
                  {selectedProposal.client.company}
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="text-xs font-bold text-text-3 uppercase">1. Executive Summary</h5>
                <p className="text-xs text-text-2 leading-relaxed italic">
                  {(selectedProposal.contentJson as any)?.intro ||
                    'We propose to assist you in this contract.'}
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-border/40">
                <h5 className="text-xs font-bold text-text-3 uppercase">
                  2. Scope of Deliverables
                </h5>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-text-2">
                  {((selectedProposal.contentJson as any)?.scope || []).map(
                    (item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    )
                  )}
                </ul>
              </div>

              <div className="space-y-2 pt-3 border-t border-border/40 flex justify-between items-center text-xs">
                <div>
                  <h5 className="text-xs font-bold text-text-3 uppercase">3. Valuation Summary</h5>
                  <p className="text-xs text-text-2 mt-1">
                    Total estimated fixed budget for work scope.
                  </p>
                </div>
                <span className="text-base font-extrabold text-success">
                  {formatCurrency(selectedProposal.totalValue)}
                </span>
              </div>

              {/* Signature display block */}
              {selectedProposal.status === 'accepted' && (
                <div className="p-4 border border-success/30 bg-success/[0.02] rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-success font-bold uppercase tracking-wider block">
                      Electronically Signed
                    </span>
                    <p className="font-mono text-text-1 font-semibold mt-1">
                      By: {selectedProposal.signatureUrl}
                    </p>
                    <p className="text-[9px] text-text-3 mt-0.5">
                      Timestamp: {formatDate(selectedProposal.respondedAt)}
                    </p>
                  </div>
                  <Lock size={20} className="text-success" />
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* SIGNATURE CAPTURE MODAL */}
      <Modal
        isOpen={isSignOpen}
        onClose={() => setIsSignOpen(false)}
        title="Sign Proposal & Accept Contract"
        type="center"
      >
        <div className="space-y-4">
          <p className="text-xs text-text-2">
            Type your full name below to electronically authorize this proposal. Upon submission,
            this will lock the contract and initialize a project dashboard.
          </p>
          <Input
            label="Type Your Signature Name *"
            placeholder="e.g. John Miller"
            value={signatureText}
            onChange={(e) => setSignatureText(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button variant="ghost" onClick={() => setIsSignOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAcceptProposal} disabled={!signatureText}>
              Authorize & Sign
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
