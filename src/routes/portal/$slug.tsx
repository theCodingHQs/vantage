import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { getPublicPortalData, sendPortalMessage } from '#/server/functions/portals'
import { acceptProposal, declineProposal } from '#/server/functions/proposals'
import { Button } from '#/components/ui/button'
import { Input, Textarea } from '#/components/ui/input'
import { Modal } from '#/components/ui/modal'
import { Badge } from '#/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '#/components/ui/card'
import { Table, TableRow, TableCell } from '#/components/ui/table'
import { formatCurrency, formatDate } from '#/lib/utils'
import { Send, Inbox, Briefcase, Lock } from 'lucide-react'

export const Route = createFileRoute('/portal/$slug')({
  loader: async ({ params }) => {
    return await getPublicPortalData({ data: { slug: params.slug } })
  },
  component: PublicClientPortalPage,
})

function PublicClientPortalPage() {
  const { portal, freelancer, client, activeProjects, activeInvoices, proposals } =
    Route.useLoaderData()
  const router = useRouter()

  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'messages' | 'proposals'>(
    'overview'
  )
  const [messageText, setMessageText] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)

  // Proposal states
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null)
  const [isSignOpen, setIsSignOpen] = useState(false)
  const [signatureText, setSignatureText] = useState('')
  const [proposalActionStatus, setProposalActionStatus] = useState<string | null>(null)

  const handleSendMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim()) return

    setSendingMsg(true)
    try {
      await sendPortalMessage({
        data: {
          portalId: portal.id,
          senderType: 'client',
          content: messageText,
        },
      })
      setMessageText('')
      router.invalidate() // reload chat thread
    } catch (err) {
      console.error(err)
    } finally {
      setSendingMsg(false)
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
      setSelectedProposal(updated)
      setIsSignOpen(false)
      setSignatureText('')
      setProposalActionStatus(
        'Proposal signed and accepted! An active project contract has been initialized.'
      )
      router.invalidate()
    } catch (err) {
      console.error(err)
      setProposalActionStatus('Failed to accept proposal.')
    }
  }

  const handleDeclineProposal = async () => {
    if (!selectedProposal) return
    try {
      const updated = await declineProposal({ data: { id: selectedProposal.id } })
      setSelectedProposal(updated)
      setProposalActionStatus('Proposal declined.')
      router.invalidate()
    } catch (err) {
      console.error(err)
      setProposalActionStatus('Failed to decline proposal.')
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text-1 flex flex-col relative overflow-hidden">
      {/* Glare effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />

      {/* Portal Top Bar */}
      <header className="h-16 border-b border-border bg-surface/40 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-lg">
            V
          </div>
          <div>
            <span className="font-semibold text-text-1 tracking-tight text-sm block">
              {freelancer?.businessName || `${freelancer?.name}'s Workspace`}
            </span>
            <span className="text-[10px] text-text-3 font-semibold uppercase tracking-wider">
              Collaborative Client Portal
            </span>
          </div>
        </div>
        <div>
          <Badge variant="success">Secured Client Session</Badge>
        </div>
      </header>

      {/* Main Content shell */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 md:px-12 py-8 space-y-6">
        {/* Welcome message greeting */}
        <Card className="bg-gradient-to-br from-surface to-surface-2/40 border-accent/20">
          <CardHeader className="pb-1 border-0">
            <CardTitle className="text-xs font-bold text-accent uppercase tracking-wider">
              Greetings {client?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h2 className="text-2xl font-bold text-text-1">Collaboration Hub</h2>
            <p className="text-xs text-text-2 mt-2 leading-relaxed max-w-2xl">
              {portal.customMessage ||
                'Welcome to our client workspace portal. Here you can check project deliverables, invoice status, and communicate directly.'}
            </p>
          </CardContent>
        </Card>

        {/* Tab navigation links */}
        <div className="flex border-b border-border/80 gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 text-xs font-semibold uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-accent text-text-1 font-bold'
                : 'border-transparent text-text-2 hover:text-text-1'
            }`}
          >
            Overview & Tasks
          </button>
          {proposals && proposals.length > 0 && (
            <button
              onClick={() => setActiveTab('proposals')}
              className={`pb-2.5 text-xs font-semibold uppercase border-b-2 transition-all cursor-pointer ${
                activeTab === 'proposals'
                  ? 'border-accent text-text-1 font-bold'
                  : 'border-transparent text-text-2 hover:text-text-1'
              }`}
            >
              Proposals
            </button>
          )}
          {portal.showInvoices && (
            <button
              onClick={() => setActiveTab('invoices')}
              className={`pb-2.5 text-xs font-semibold uppercase border-b-2 transition-all cursor-pointer ${
                activeTab === 'invoices'
                  ? 'border-accent text-text-1 font-bold'
                  : 'border-transparent text-text-2 hover:text-text-1'
              }`}
            >
              Invoices
            </button>
          )}
          {portal.showMessages && (
            <button
              onClick={() => setActiveTab('messages')}
              className={`pb-2.5 text-xs font-semibold uppercase border-b-2 transition-all cursor-pointer ${
                activeTab === 'messages'
                  ? 'border-accent text-text-1 font-bold'
                  : 'border-transparent text-text-2 hover:text-text-1'
              }`}
            >
              Messaging Feed
            </button>
          )}
        </div>

        {/* TAB 1: OVERVIEW & PROJECTS */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {activeProjects.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border/80 rounded-xl bg-surface-2/20">
                <Briefcase className="h-8 w-8 text-text-3 mx-auto mb-2" />
                <p className="text-xs text-text-2">No active projects linked currently.</p>
              </div>
            ) : (
              activeProjects.map((p) => {
                const completedTasks = p.tasks.filter((t: any) => t.status === 'done').length
                const totalTasks = p.tasks.length
                const progressPercent =
                  totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

                return (
                  <Card key={p.id} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-text-1">{p.title}</h3>
                        <p className="text-[10px] text-text-3 mt-0.5">
                          Estimated milestones & tasks board
                        </p>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </div>

                    {/* Progress indicator */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-text-2">Task Milestones Completed</span>
                        <span className="text-text-1 font-bold">
                          {completedTasks} of {totalTasks} ({progressPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-accent h-full rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Tasks checklist */}
                    <div className="space-y-2.5 pt-2">
                      <h4 className="text-[10px] font-bold text-text-3 uppercase tracking-wider">
                        Project Checklist
                      </h4>
                      {p.tasks.length === 0 ? (
                        <p className="text-xs text-text-3 italic">Checklist initializing...</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {p.tasks.map((task: any) => (
                            <div
                              key={task.id}
                              className="p-2.5 bg-surface-2 border border-border rounded-lg flex items-center justify-between"
                            >
                              <span className="text-xs text-text-1 font-medium">{task.title}</span>
                              <Badge variant={task.status === 'done' ? 'success' : 'secondary'}>
                                {task.status === 'done' ? 'Completed' : 'Pending'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        )}

        {/* TAB 2: INVOICES LIST */}
        {activeTab === 'invoices' && portal.showInvoices && (
          <div className="animate-in fade-in duration-200">
            <Table
              headers={['Invoice Number', 'Issue Date', 'Due Date', 'Total', 'Status']}
              isEmpty={activeInvoices.length === 0}
              emptyMessage="No billing invoices found."
            >
              {activeInvoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-semibold text-text-1 font-mono">
                    {inv.invoiceNumber}
                  </TableCell>
                  <TableCell>{formatDate(inv.issueDate)}</TableCell>
                  <TableCell>{formatDate(inv.dueDate)}</TableCell>
                  <TableCell className="font-bold text-text-1">
                    {formatCurrency(inv.total)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={inv.status === 'paid' ? 'success' : 'warning'}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </div>
        )}

        {/* TAB 3: PORTAL MESSAGES FEED */}
        {activeTab === 'messages' && portal.showMessages && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Input Message Form */}
            <Card>
              <CardContent className="pt-5">
                <form onSubmit={handleSendMessageSubmit} className="space-y-4">
                  <Textarea
                    placeholder="Type a message to discuss project deliverables..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    required
                    disabled={sendingMsg}
                    className="min-h-[80px]"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={sendingMsg}
                      className="flex items-center gap-1 text-xs"
                    >
                      <Send size={12} /> Send Message
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Chat list */}
            <div className="space-y-3">
              {portal.messages.length === 0 ? (
                <div className="text-center py-10 text-text-3 text-xs flex flex-col gap-2 items-center">
                  <Inbox size={32} /> No messages. Leave a note above to collaborate.
                </div>
              ) : (
                portal.messages.map((msg: any) => {
                  const isClient = msg.senderType === 'client'
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed border ${
                          isClient
                            ? 'bg-accent/10 border-accent/20 text-text-1 rounded-tr-none'
                            : 'bg-surface-2 border-border text-text-2 rounded-tl-none'
                        }`}
                      >
                        <div className="flex justify-between items-center gap-6 mb-1 text-[9px] font-semibold text-text-3">
                          <span>
                            {isClient ? 'You (Client)' : freelancer?.name || 'Freelancer'}
                          </span>
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="whitespace-pre-line">{msg.content}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PROPOSALS */}
        {activeTab === 'proposals' && proposals && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <Table
              headers={['Proposal Title', 'Valid Until', 'Total Value', 'Status', 'Actions']}
              isEmpty={proposals.length === 0}
              emptyMessage="No proposals have been shared with you yet."
            >
              {proposals.map((p: any) => (
                <TableRow
                  key={p.id}
                  onClick={() => {
                    setSelectedProposal(p)
                    setSignatureText('')
                    setProposalActionStatus(null)
                  }}
                >
                  <TableCell className="font-semibold text-text-1">{p.title}</TableCell>
                  <TableCell>{p.validUntil ? formatDate(p.validUntil) : '—'}</TableCell>
                  <TableCell className="font-bold text-text-1">
                    {formatCurrency(p.totalValue)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        p.status === 'accepted'
                          ? 'success'
                          : p.status === 'sent' || p.status === 'viewed'
                            ? 'primary'
                            : p.status === 'declined'
                              ? 'danger'
                              : 'secondary'
                      }
                    >
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="secondary" className="text-xs">
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </div>
        )}
      </main>

      {/* PROPOSAL PREVIEW DRAWER */}
      <Modal
        isOpen={selectedProposal !== null}
        onClose={() => setSelectedProposal(null)}
        title="Review Project Proposal"
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
                        Sign / Accept Proposal
                      </Button>
                    </>
                  )}
              </div>
            </div>

            {proposalActionStatus && (
              <div className="p-3 bg-success/15 border border-success/35 text-success rounded-lg text-xs font-semibold">
                {proposalActionStatus}
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
                  Prepared by: {freelancer?.name} &middot; {freelancer?.businessName}
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="text-xs font-bold text-text-3 uppercase">1. Executive Summary</h5>
                <p className="text-xs text-text-2 leading-relaxed italic">
                  {selectedProposal.contentJson?.intro ||
                    'We propose to assist you in this contract.'}
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-border/40">
                <h5 className="text-xs font-bold text-text-3 uppercase">
                  2. Scope of Deliverables
                </h5>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-text-2">
                  {(selectedProposal.contentJson?.scope || []).map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
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
            placeholder="e.g. Jane Doe"
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

      {/* Footer banner */}
      <footer className="h-12 border-t border-border bg-surface/20 flex items-center justify-center text-[10px] text-text-3 font-semibold uppercase tracking-wider">
        Powered by Vantage OS &copy; {new Date().getFullYear()}
      </footer>
    </div>
  )
}
