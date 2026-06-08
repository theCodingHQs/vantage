import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { getExpenses, createExpense } from '#/server/functions/invoicing'
import { getProjects } from '#/server/functions/projects'
import { Button } from '#/components/ui/button'
import { Input, Select, Textarea } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import { Table, TableRow, TableCell } from '#/components/ui/table'
import { Card, CardHeader, CardTitle, CardContent } from '#/components/ui/card'
import { Modal } from '#/components/ui/modal'
import { formatCurrency, formatDate, formatDateYYYYMMDD } from '#/lib/utils'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Plus, Receipt, Download, PiggyBank, Search } from 'lucide-react'

export const Route = createFileRoute('/_app/expenses')({
  loader: async () => {
    const expensesList = await getExpenses()
    const projectsList = await getProjects({ data: { status: 'all' } })
    return { expensesList, projectsList }
  },
  component: ExpensesPage,
})

const CATEGORY_COLORS: Record<string, string> = {
  Software: '#6366f1',
  Travel: '#f59e0b',
  Equipment: '#10b981',
  Contractor: '#ec4899',
  Marketing: '#3b82f6',
  Other: '#94a3b8',
}

function ExpensesPage() {
  const { expensesList, projectsList } = Route.useLoaderData()
  const router = useRouter()

  // State
  const [search, setSearch] = useState('')
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Software')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10))
  const [projectId, setProjectId] = useState('')
  const [isBillable, setIsBillable] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCreateExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !category) return

    setLoading(true)
    try {
      const selectedProj = projectsList.find(p => p.project.id === projectId)
      
      await createExpense({
        data: {
          category,
          amount: parseFloat(amount) || 0,
          date,
          description,
          projectId: projectId || null,
          clientId: selectedProj ? selectedProj.project.clientId : null,
          isBillable,
          receiptUrl: ''
        }
      })
      setIsAddExpenseOpen(false)
      setAmount('')
      setDescription('')
      router.invalidate()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Client-side CSV Exporter
  const handleExportCSV = () => {
    if (expensesList.length === 0) return

    const headers = ['Date', 'Category', 'Description', 'Project', 'Amount', 'Billable', 'Status']
    const rows = expensesList.map(({ expense, projectName }) => [
      formatDateYYYYMMDD(expense.date),
      expense.category,
      `"${expense.description || ''}"`,
      `"${projectName || ''}"`,
      expense.amount,
      expense.isBillable ? 'Yes' : 'No',
      expense.isInvoiced ? 'Invoiced' : 'Pending',
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
      
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `vantage_expenses_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filter list
  const filteredExpenses = expensesList.filter(e => {
    const matchesSearch = e.expense.category.toLowerCase().includes(search.toLowerCase()) || 
                          (e.expense.description && e.expense.description.toLowerCase().includes(search.toLowerCase()))
    return matchesSearch
  })

  // Calculate chart data based on category totals
  const categoryTotals: Record<string, number> = {}
  let totalSpent = 0

  expensesList.forEach(({ expense }) => {
    const amt = parseFloat(expense.amount.toString())
    totalSpent += amt
    categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + amt
  })

  const donutChartData = Object.keys(categoryTotals).map(cat => ({
    name: cat,
    value: categoryTotals[cat]
  }))

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-1">Expenses</h1>
          <p className="text-xs text-text-2">Record business outlays, associate software fees with clients, and download tax statements.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={handleExportCSV} disabled={expensesList.length === 0} className="flex items-center gap-1.5">
            <Download size={14} /> Export CSV
          </Button>
          <Button size="sm" onClick={() => setIsAddExpenseOpen(true)} className="flex items-center gap-1.5">
            <Plus size={14} /> Add Expense
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expenses List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-2.5 text-text-3" />
            <input
              type="text"
              placeholder="Search expenses by category or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-2 border border-border hover:border-border-hover focus:border-accent text-text-1 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <Table
            headers={['Date', 'Category', 'Description', 'Linked Project', 'Billable', 'Amount']}
            isEmpty={filteredExpenses.length === 0}
            emptyMessage="No expenses recorded."
          >
            {filteredExpenses.map(({ expense, projectName }) => (
              <TableRow key={expense.id}>
                <TableCell>{formatDateYYYYMMDD(expense.date)}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[expense.category] || '#94a3b8' }} />
                    {expense.category}
                  </span>
                </TableCell>
                <TableCell className="font-medium text-text-1">{expense.description || '—'}</TableCell>
                <TableCell>{projectName || '—'}</TableCell>
                <TableCell>
                  <Badge variant={expense.isBillable ? 'success' : 'secondary'}>
                    {expense.isBillable ? 'Yes' : 'No'}
                  </Badge>
                </TableCell>
                <TableCell className="font-bold text-text-1">{formatCurrency(expense.amount)}</TableCell>
              </TableRow>
            ))}
          </Table>
        </div>

        {/* Charts & breakdown summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2 border-0">
              <CardTitle className="text-xs font-bold text-text-2 uppercase">Spending Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex flex-col items-center justify-center">
              {donutChartData.length === 0 ? (
                <div className="text-center py-10 text-text-3 text-xs flex flex-col gap-2 items-center">
                  <PiggyBank size={32} /> Add expenses to populate chart
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {donutChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111118', borderColor: '#2a2a35', borderRadius: '8px' }}
                      itemStyle={{ color: '#f1f5f9', fontSize: '11px' }}
                      formatter={(v) => [`$${parseFloat(v as string).toFixed(2)}`]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconSize={8}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Sum details */}
          <Card>
            <CardHeader className="pb-2 border-0">
              <CardTitle className="text-xs font-bold text-text-2 uppercase">Totals Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-text-2">Total Cash Outlay</span>
                <span className="font-extrabold text-text-1 text-sm">{formatCurrency(totalSpent)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-text-2">Billable Outlay</span>
                <span className="font-semibold text-success">{formatCurrency(expensesList.filter(e => e.expense.isBillable).reduce((acc, curr) => acc + parseFloat(curr.expense.amount), 0))}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ADD EXPENSE MODAL */}
      <Modal isOpen={isAddExpenseOpen} onClose={() => setIsAddExpenseOpen(false)} title="Log Business Outlay" type="right">
        <form onSubmit={handleCreateExpenseSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount ($) *"
              type="number"
              min="0"
              placeholder="e.g. 99.99"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={loading}
            />
            <Select
              label="Outlay Category *"
              options={[
                { value: 'Software', label: 'Software/SaaS' },
                { value: 'Travel', label: 'Business Travel' },
                { value: 'Equipment', label: 'Office/Hardware' },
                { value: 'Contractor', label: 'Contractor Fees' },
                { value: 'Marketing', label: 'Advertising' },
                { value: 'Other', label: 'Other/General' },
              ]}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <Input
            label="Outlay Date *"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            disabled={loading}
          />

          <Input
            label="Description / Purpose *"
            placeholder="e.g. Figma professional subscription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            disabled={loading}
          />

          <Select
            label="Associate with Project"
            options={[
              { value: '', label: 'None (General Business Expense)' },
              ...projectsList.map(p => ({ value: p.project.id, label: p.project.title }))
            ]}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            disabled={loading}
          />

          <div className="flex items-center pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isBillable}
                onChange={(e) => setIsBillable(e.target.checked)}
                disabled={loading}
                className="rounded border-border bg-surface text-accent focus:ring-accent"
              />
              <span className="text-sm font-medium text-text-2">Bill this expense back to the client</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setIsAddExpenseOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Expense'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
