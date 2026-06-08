import { createFileRoute } from '@tanstack/react-router'
import { getReportsData } from '#/server/functions/dashboard'
import { Card, CardHeader, CardTitle, CardContent } from '#/components/ui/card'
import { Table, TableRow, TableCell } from '#/components/ui/table'
import { Badge } from '#/components/ui/badge'
import { formatCurrency, formatDate } from '#/lib/utils'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { BarChart3, TrendingUp, DollarSign, Clock, AlertTriangle } from 'lucide-react'

export const Route = createFileRoute('/_app/reports')({
  loader: async () => {
    return await getReportsData()
  },
  component: ReportsPage,
})

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#3b82f6', '#94a3b8']

function ReportsPage() {
  const reports = Route.useLoaderData()

  // Prepare aging buckets chart data
  const agingChartData = [
    { name: 'Under 30d', amount: reports.agingReport.under30Days },
    { name: '30-60d', amount: reports.agingReport.between30And60 },
    { name: '60-90d', amount: reports.agingReport.between60And90 },
    { name: 'Over 90d', amount: reports.agingReport.over90Days },
  ]

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-1">Reports & Analytics</h1>
          <p className="text-xs text-text-2">Review business margins, project profitability logs, and outstanding billing age.</p>
        </div>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Expenses category breakdown */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2 border-0">
            <CardTitle className="text-xs font-bold text-text-2 uppercase">Expense Allocation</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex flex-col justify-center items-center">
            {reports.expenseCategoryData.length === 0 ? (
              <p className="text-xs text-text-3">No expenses logged yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reports.expenseCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {reports.expenseCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111118', borderColor: '#2a2a35', borderRadius: '8px' }}
                    itemStyle={{ color: '#f1f5f9', fontSize: '11px' }}
                    formatter={(v) => [`$${parseFloat(v as string).toFixed(2)}`]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={8}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Invoice aging bucket */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 border-0">
            <CardTitle className="text-xs font-bold text-text-2 uppercase">Invoice Aging Report</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                  contentStyle={{ backgroundColor: '#111118', borderColor: '#2a2a35', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px' }}
                  itemStyle={{ color: '#f1f5f9', fontSize: '12px' }}
                  formatter={(v) => [`$${parseFloat(v as string).toFixed(2)}`]}
                />
                <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      {/* Project Profitability Margins Table */}
      <Card>
        <CardHeader className="pb-2 border-0">
          <CardTitle className="text-xs font-bold text-text-2 uppercase">Project Profitability & Margins</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            headers={['Project Title', 'Client', 'Revenue Made', 'Expenses', 'Logged Hours', 'Net Profit', 'Margin']}
            isEmpty={reports.projectProfitability.length === 0}
            emptyMessage="Start projects and receive payments to log profitability metrics."
          >
            {reports.projectProfitability.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-semibold text-text-1">{p.projectTitle}</TableCell>
                <TableCell>{p.clientName}</TableCell>
                <TableCell className="font-semibold text-text-1">{formatCurrency(p.revenue)}</TableCell>
                <TableCell className="text-danger font-semibold">{formatCurrency(p.expenses)}</TableCell>
                <TableCell className="font-mono text-accent">{p.loggedHours}h</TableCell>
                <TableCell className={`font-bold ${p.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatCurrency(p.profit)}
                </TableCell>
                <TableCell>
                  <Badge variant={p.marginPercent >= 20 ? 'success' : p.marginPercent > 0 ? 'primary' : 'danger'}>
                    {p.marginPercent}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        </CardContent>
      </Card>

      {/* Invoice Aging list breakdown */}
      <Card>
        <CardHeader className="pb-2 border-0">
          <CardTitle className="text-xs font-bold text-text-2 uppercase">Outstanding Statement Ages</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            headers={['Invoice Number', 'Client', 'Due Date', 'Days Outstanding', 'Amount Balance']}
            isEmpty={reports.agingReport.items.length === 0}
            emptyMessage="All client balances are currently paid up."
          >
            {reports.agingReport.items.map((item: any, idx: number) => (
              <TableRow key={idx}>
                <TableCell className="font-semibold font-mono text-text-1">{item.invoiceNumber}</TableCell>
                <TableCell>{item.clientName}</TableCell>
                <TableCell>{formatDate(item.dueDate)}</TableCell>
                <TableCell className="font-mono text-accent">{item.daysOutstanding} days past due</TableCell>
                <TableCell className="font-extrabold text-text-1">{formatCurrency(item.total)}</TableCell>
              </TableRow>
            ))}
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
