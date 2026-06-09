import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import {
  getInvoices,
  getInvoiceDetail,
  createInvoice,
  recordInvoicePayment,
  updateInvoiceStatus,
} from '#/server/functions/invoicing'
import { getClients } from '#/server/functions/crm'
import { getProjects } from '#/server/functions/projects'
import { sendInvoiceEmail } from '#/server/email'
import { Button } from '#/components/ui/button'
import { Input, Select, Textarea } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import { Table, TableRow, TableCell } from '#/components/ui/table'
import { Card, CardHeader, CardTitle, CardContent } from '#/components/ui/card'
import { Modal } from '#/components/ui/modal'
import { formatCurrency, formatDate } from '#/lib/utils'
import { Plus, Search, FileText, Send, CheckCircle2, Copy, FileCode, Printer } from 'lucide-react'

export const Route = createFileRoute('/_app/invoices')({
  loader: async () => {
    const invoicesList = await getInvoices({ data: { status: 'all' } })
    const clientsList = await getClients({ data: { status: 'all' } })
    const projectsList = await getProjects({ data: { status: 'all' } })
    return { invoicesList, clientsList, projectsList }
  },
  component: InvoicesPage,
})

function InvoicesPage() {
  const { invoicesList, clientsList, projectsList } = Route.useLoaderData()
  const router = useRouter()

  // State
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null)

  // Invoice Builder States
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [clientId, setClientId] = useState(clientsList[0]?.id || '')
  const [projectId, setProjectId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().substring(6)}`)
  const [issueDate, setIssueDate] = useState(new Date().toISOString().substring(0, 10))
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
  )
  const [taxRate, setTaxRate] = useState('0')
  const [discountAmount, setDiscountAmount] = useState('0')
  const [notes, setNotes] = useState('Thank you for your business!')

  // Builder Items State
  const [items, setItems] = useState<
    {
      description: string
      quantity: string
      unitPrice: string
      type: 'service' | 'time' | 'expense' | 'product'
    }[]
  >([{ description: 'Consulting services', quantity: '10', unitPrice: '50', type: 'service' }])

  // Payment Marker State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer')
  const [paymentNotes, setPaymentNotes] = useState('')

  // Email state
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailStatus, setEmailStatus] = useState<string | null>(null)

  const handleAddItem = () => {
    setItems([
      ...items,
      { description: 'New Service', quantity: '1', unitPrice: '100', type: 'service' },
    ])
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index))
  }

  const handleUpdateItem = (index: number, field: string, value: string) => {
    setItems(items.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)))
  }

  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId || !invoiceNumber || items.length === 0) return

    try {
      await createInvoice({
        data: {
          clientId,
          projectId: projectId || null,
          invoiceNumber,
          issueDate,
          dueDate,
          taxRate: parseFloat(taxRate) || 0,
          discountAmount: parseFloat(discountAmount) || 0,
          currency: 'USD',
          notes,
          items: items.map((item) => ({
            description: item.description,
            quantity: parseFloat(item.quantity) || 1,
            unitPrice: parseFloat(item.unitPrice) || 0,
            type: item.type,
          })),
        },
      })
      setIsBuilderOpen(false)
      // reset items
      setItems([
        { description: 'Consulting services', quantity: '10', unitPrice: '50', type: 'service' },
      ])
      router.invalidate()
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkPaid = async () => {
    if (!selectedInvoice) return
    try {
      const updated = await recordInvoicePayment({
        data: {
          id: selectedInvoice.id,
          paymentMethod,
          notes: paymentNotes,
        },
      })
      setSelectedInvoice({ ...selectedInvoice, ...updated })
      setIsPaymentModalOpen(false)
      router.invalidate()
    } catch (err) {
      console.error(err)
    }
  }

  const handleSendInvoiceEmail = async () => {
    if (!selectedInvoice) return
    setSendingEmail(true)
    setEmailStatus(null)
    try {
      const emailRes = await sendInvoiceEmail({
        data: {
          toEmail: selectedInvoice.client.email || 'billing@client.com',
          invoiceNum: selectedInvoice.invoiceNumber,
          total: formatCurrency(selectedInvoice.total),
          clientName: selectedInvoice.client.name,
          portalUrl: `${window.location.origin}/portal/${selectedInvoice.id}`, // client portal link
        },
      })

      if (emailRes.success) {
        setEmailStatus('Invoice sent successfully to client email!')
        // Update invoice status to 'sent'
        if (selectedInvoice.status === 'draft') {
          const updated = await updateInvoiceStatus({
            data: { id: selectedInvoice.id, status: 'sent' },
          })
          setSelectedInvoice({ ...selectedInvoice, ...updated })
        }
      }
    } catch (err) {
      setEmailStatus('Failed to send email.')
    } finally {
      setSendingEmail(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // Filter invoices
  const filteredInvoices = invoicesList.filter((i) => {
    const matchesSearch =
      i.invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      i.clientName.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || i.invoice.status === filterStatus
    return matchesSearch && matchesStatus
  })

  // Live total calculation for builder
  let builderSubtotal = 0
  items.forEach((item) => {
    builderSubtotal += (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)
  })
  const builderTax =
    (builderSubtotal - (parseFloat(discountAmount) || 0)) * ((parseFloat(taxRate) || 0) / 100)
  const builderTotal = builderSubtotal - (parseFloat(discountAmount) || 0) + builderTax

  return (
    <div className="space-y-6 print:bg-white print:text-black print:p-0">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-1">Invoices</h1>
          <p className="text-xs text-text-2">
            Generate premium, branded PDF receipts and track outstanding income.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsBuilderOpen(true)}
          className="flex items-center gap-1"
        >
          <Plus size={14} /> New Invoice
        </Button>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-surface-2/10 border border-border/60 p-4 rounded-xl print:hidden">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-2.5 text-text-3" />
          <input
            type="text"
            placeholder="Search by invoice number or client name..."
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
              { value: 'paid', label: 'Paid' },
              { value: 'overdue', label: 'Overdue' },
            ]}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          />
        </div>
      </div>

      {/* INVOICE LIST TABLE */}
      <div className="print:hidden">
        <Table
          headers={['Invoice Number', 'Client', 'Issue Date', 'Due Date', 'Total Amount', 'Status']}
          isEmpty={filteredInvoices.length === 0}
          emptyMessage="No invoices found."
        >
          {filteredInvoices.map((inv) => (
            <TableRow
              key={inv.invoice.id}
              onClick={async () => {
                const detail = await getInvoiceDetail({ data: { id: inv.invoice.id } })
                setSelectedInvoice(detail)
                setEmailStatus(null)
              }}
            >
              <TableCell className="font-semibold text-text-1 font-mono">
                {inv.invoice.invoiceNumber}
              </TableCell>
              <TableCell>{inv.clientName}</TableCell>
              <TableCell>{formatDate(inv.invoice.issueDate)}</TableCell>
              <TableCell>{formatDate(inv.invoice.dueDate)}</TableCell>
              <TableCell className="font-bold text-text-1">
                {formatCurrency(inv.invoice.total)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    inv.invoice.status === 'paid'
                      ? 'success'
                      : inv.invoice.status === 'sent'
                        ? 'primary'
                        : inv.invoice.status === 'overdue'
                          ? 'danger'
                          : 'secondary'
                  }
                >
                  {inv.invoice.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </div>

      {/* CREATE INVOICE BUILDER SIDE MODAL */}
      <Modal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        title="Generate Professional Invoice"
        type="right"
      >
        {clientsList.length === 0 ? (
          <div className="py-8 text-center text-text-3 text-xs">
            Add a CRM client before building invoices.
          </div>
        ) : (
          <form onSubmit={handleCreateInvoiceSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Bill To Client *"
                options={clientsList.map((c) => ({ value: c.id, label: c.name }))}
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
              />
              <Input
                label="Invoice Number *"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Issue Date"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
              />
              <Input
                label="Due Date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>

            {/* Line items checklist */}
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-xs font-bold text-text-2 uppercase">Line Items</span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleAddItem}
                  className="py-1 text-xs"
                >
                  + Add Item
                </Button>
              </div>

              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-surface-2 rounded-lg border border-border space-y-3 relative"
                >
                  <Input
                    label="Description"
                    value={item.description}
                    onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                    required
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      label="Qty/Hours"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                      required
                    />
                    <Input
                      label="Unit Price"
                      type="number"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => handleUpdateItem(idx, 'unitPrice', e.target.value)}
                      required
                    />
                    <div className="flex items-end justify-between gap-2">
                      <div className="flex-1 font-mono text-xs text-text-2 font-bold mb-3">
                        Total:{' '}
                        {formatCurrency(
                          (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)
                        )}
                      </div>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemoveItem(idx)}
                          className="py-1 text-xs"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
              <Input
                label="Tax Rate (%)"
                type="number"
                min="0"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
              <Input
                label="Discount Amount ($)"
                type="number"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
              />
            </div>

            <div className="p-3 bg-surface-2 border border-border rounded-lg flex items-center justify-between font-bold text-sm">
              <span className="text-text-2">Total Due:</span>
              <span className="text-success text-base">{formatCurrency(builderTotal)}</span>
            </div>

            <Textarea
              label="Invoice Terms / Payment Instructions"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="ghost" onClick={() => setIsBuilderOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Invoice</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* DETAIL DRAWER / PREVIEW MODAL */}
      <Modal
        isOpen={selectedInvoice !== null}
        onClose={() => setSelectedInvoice(null)}
        title="Invoice Details"
        type="right"
      >
        {selectedInvoice && (
          <div className="space-y-6 print:space-y-8">
            {/* Header controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-surface-2 border border-border rounded-xl print:hidden">
              <div className="flex items-center gap-1.5">
                <Badge variant={selectedInvoice.status === 'paid' ? 'success' : 'warning'}>
                  {selectedInvoice.status}
                </Badge>
                <span className="text-xs font-mono font-bold">{selectedInvoice.invoiceNumber}</span>
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handlePrint}
                  className="p-1.5"
                  title="Print/Save PDF"
                >
                  <Printer size={16} />
                </Button>
                {selectedInvoice.status !== 'paid' && (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="flex items-center gap-1 text-xs"
                    >
                      <CheckCircle2 size={12} /> Mark Paid
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSendInvoiceEmail}
                      disabled={sendingEmail}
                      className="flex items-center gap-1 text-xs"
                    >
                      <Send size={12} /> {sendingEmail ? 'Sending...' : 'Send Invoice'}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {emailStatus && (
              <div className="p-3 bg-success/15 border border-success/35 text-success rounded-lg text-xs font-semibold print:hidden">
                {emailStatus}
              </div>
            )}

            {/* Premium printable invoice details */}
            <div className="p-6 border border-border bg-surface rounded-xl space-y-6 text-sm text-text-2 print:border-0 print:p-0 print:text-black">
              {/* Logo & brand */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-lg mb-2 print:bg-black">
                    V
                  </div>
                  <h3 className="text-base font-bold text-text-1 print:text-black">
                    Vantage Invoice
                  </h3>
                  <p className="text-[10px] text-text-3 font-semibold print:text-gray-500">
                    FREELANCE CONTRACTOR BILLING
                  </p>
                </div>
                <div className="text-right">
                  <h4 className="text-base font-mono font-bold text-text-1 print:text-black">
                    {selectedInvoice.invoiceNumber}
                  </h4>
                  <p className="text-xs">Issue Date: {formatDate(selectedInvoice.issueDate)}</p>
                  <p className="text-xs font-semibold text-danger">
                    Due Date: {formatDate(selectedInvoice.dueDate)}
                  </p>
                </div>
              </div>

              {/* Client Billing Info */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border/60">
                <div>
                  <span className="text-[10px] text-text-3 font-bold uppercase tracking-wider block">
                    Billed To:
                  </span>
                  <p className="text-text-1 font-semibold mt-1 print:text-black">
                    {selectedInvoice.client.name}
                  </p>
                  <p className="text-xs">{selectedInvoice.client.company}</p>
                  <p className="text-xs mt-0.5">
                    {selectedInvoice.client.address || 'No address provided'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-text-3 font-bold uppercase tracking-wider block">
                    Payment Instructions:
                  </span>
                  <p className="text-xs mt-1 italic">
                    {selectedInvoice.notes || 'Pay via bank transfer or credit card portal link.'}
                  </p>
                </div>
              </div>

              {/* Line items list */}
              <div className="pt-4 border-t border-border/60">
                <Table headers={['Description', 'Quantity', 'Unit Price', 'Amount']}>
                  {selectedInvoice.items.map((item: any) => (
                    <tr key={item.id} className="border-b border-border/40">
                      <TableCell className="font-medium text-text-1 print:text-black">
                        {item.description}
                      </TableCell>
                      <TableCell>{parseFloat(item.quantity)}</TableCell>
                      <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="font-semibold text-text-1 text-right print:text-black">
                        {formatCurrency(item.amount)}
                      </TableCell>
                    </tr>
                  ))}
                </Table>
              </div>

              {/* Invoice Breakdown totals */}
              <div className="flex justify-end pt-4">
                <div className="w-64 space-y-2 text-right">
                  <div className="flex justify-between text-xs">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-text-1 print:text-black">
                      {formatCurrency(selectedInvoice.subtotal)}
                    </span>
                  </div>
                  {parseFloat(selectedInvoice.discountAmount) > 0 && (
                    <div className="flex justify-between text-xs text-danger">
                      <span>Discount:</span>
                      <span>-{formatCurrency(selectedInvoice.discountAmount)}</span>
                    </div>
                  )}
                  {parseFloat(selectedInvoice.taxAmount) > 0 && (
                    <div className="flex justify-between text-xs">
                      <span>Tax ({selectedInvoice.taxRate}%):</span>
                      <span>{formatCurrency(selectedInvoice.taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border/60 pt-2 text-sm font-bold">
                    <span className="text-text-2">Total Amount Due:</span>
                    <span className="text-success text-base">
                      {formatCurrency(selectedInvoice.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* RECORD PAYMENT MODAL */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Invoice Payment"
        type="center"
      >
        <div className="space-y-4">
          <p className="text-xs text-text-2">
            Record a client payment manually. This will update the status to paid and log the
            client's revenue.
          </p>
          <Select
            label="Payment Gateway / Method"
            options={[
              { value: 'Bank Transfer', label: 'Direct Bank Wire' },
              { value: 'Cash', label: 'Cash Payment' },
              { value: 'Stripe', label: 'Stripe Credit Card' },
              { value: 'PayPal', label: 'PayPal Account' },
            ]}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          <Textarea
            label="Internal Payment Notes"
            placeholder="e.g. Transaction number, cheque ID..."
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkPaid}>Mark Paid</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
