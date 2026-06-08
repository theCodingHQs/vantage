import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { getDashboardData } from '#/server/functions/dashboard'
import { getClients } from '#/server/functions/crm'
import { getProjects } from '#/server/functions/projects'
import { Card, CardHeader, CardTitle, CardContent } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Modal } from '#/components/ui/modal'
import { ClientForm } from '#/components/forms/client-form'
import { ProjectForm } from '#/components/forms/project-form'
import { TimeForm } from '#/components/forms/time-form'
import { formatCurrency, formatDate, formatRelativeTime } from '#/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  DollarSign,
  Briefcase,
  AlertCircle,
  Plus,
  Users,
  Clock,
  FileText,
  Calendar,
} from 'lucide-react'

export const Route = createFileRoute('/_app/dashboard')({
  loader: async () => {
    // Fetch dashboard data
    const dashboard = await getDashboardData()
    // Fetch clients and projects for form selections
    const clientsList = await getClients({ data: { status: 'all' } })
    const projectsList = await getProjects({ data: { status: 'all' } })
    
    return { dashboard, clientsList, projectsList }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { dashboard, clientsList, projectsList } = Route.useLoaderData()
  const router = useRouter()
  
  // Modal states
  const [isClientOpen, setIsClientOpen] = useState(false)
  const [isProjectOpen, setIsProjectOpen] = useState(false)
  const [isTimeOpen, setIsTimeOpen] = useState(false)

  const handleSuccess = () => {
    setIsClientOpen(false)
    setIsProjectOpen(false)
    setIsTimeOpen(false)
    router.invalidate() // reload route data
  }

  // Quick projects/tasks mock lists for TimeForm
  const quickProjectsList = projectsList.map(p => ({
    project: { id: p.project.id, title: p.project.title, hourlyRate: p.project.hourlyRate },
    clientName: p.clientName
  }))

  const quickTasksList: any[] = [] // empty initial tasks or mock

  return (
    <div className="space-y-6">
      {/* Upper header action area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-1">Business Dashboard</h1>
          <p className="text-xs text-text-2">Welcome back! Here is a glance at your financial health.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setIsClientOpen(true)} className="flex items-center gap-1">
            <Plus size={14} /> Add Client
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setIsProjectOpen(true)} className="flex items-center gap-1">
            <Plus size={14} /> New Project
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setIsTimeOpen(true)} className="flex items-center gap-1">
            <Clock size={14} /> Log Time
          </Button>
          <Link to="/invoices">
            <Button size="sm" className="flex items-center gap-1">
              <Plus size={14} /> Create Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Revenue this month */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 mb-0 border-0">
            <CardTitle className="text-xs font-semibold text-text-2 uppercase">Revenue This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboard.revenueThisMonth)}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-xs font-semibold flex items-center gap-0.5 ${
                dashboard.revenueChangePercent >= 0 ? 'text-success' : 'text-danger'
              }`}>
                <TrendingUp size={12} className={dashboard.revenueChangePercent < 0 ? 'rotate-180' : ''} />
                {dashboard.revenueChangePercent >= 0 ? '+' : ''}{dashboard.revenueChangePercent}%
              </span>
              <span className="text-[10px] text-text-3">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Outstanding invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 mb-0 border-0">
            <CardTitle className="text-xs font-semibold text-text-2 uppercase">Outstanding Invoices</CardTitle>
            <FileText className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboard.outstandingTotal)}</div>
            <p className="text-[10px] text-text-2 mt-1">{dashboard.outstandingCount} invoices awaiting client payment</p>
          </CardContent>
        </Card>

        {/* Metric 3: Active projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 mb-0 border-0">
            <CardTitle className="text-xs font-semibold text-text-2 uppercase">Active Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.activeProjectsCount}</div>
            <p className="text-[10px] text-text-2 mt-1">Ongoing active client contracts</p>
          </CardContent>
        </Card>

        {/* Metric 4: Overdue Alerts */}
        <Card className={dashboard.overdueTotal > 0 ? 'border-danger/30 bg-danger/[0.02]' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 mb-0 border-0">
            <CardTitle className="text-xs font-semibold text-text-2 uppercase">Overdue Income</CardTitle>
            <AlertCircle className={`h-4 w-4 ${dashboard.overdueTotal > 0 ? 'text-danger' : 'text-text-3'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-1">{formatCurrency(dashboard.overdueTotal)}</div>
            {dashboard.overdueTotal > 0 ? (
              <p className="text-[10px] text-danger font-medium mt-1">{dashboard.overdueCount} invoices past due! Send follow-up.</p>
            ) : (
              <p className="text-[10px] text-text-3 mt-1">Excellent. No overdue client balances.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 border-0">
            <CardTitle className="text-xs font-bold text-text-2 uppercase">Revenue Performance (6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard.revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                  contentStyle={{ backgroundColor: '#111118', borderColor: '#2a2a35', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px' }}
                  itemStyle={{ color: '#f1f5f9', fontSize: '12px' }}
                  formatter={(v) => [`$${parseFloat(v as string).toFixed(2)}`, 'Paid Revenue']}
                />
                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Utilization Ring & Top clients */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2 border-0">
              <CardTitle className="text-xs font-bold text-text-2 uppercase">Billable Utilization</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* SVG Progress Circle */}
                <svg className="absolute w-full h-full -rotate-90">
                  <circle cx="64" cy="64" r="50" className="stroke-border" strokeWidth="10" fill="transparent" />
                  <circle
                    cx="64"
                    cy="64"
                    r="50"
                    className="stroke-accent transition-all duration-500"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={314}
                    strokeDashoffset={314 - (314 * dashboard.utilizationRate) / 100}
                  />
                </svg>
                <div className="text-center">
                  <span className="text-3xl font-extrabold text-text-1">{dashboard.utilizationRate}%</span>
                  <span className="block text-[9px] text-text-3 font-semibold uppercase mt-0.5">Billable Time</span>
                </div>
              </div>
              <p className="text-[10px] text-text-2 mt-4 text-center leading-relaxed px-4">
                Percentage of total logged hours categorized as billable client work this month.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activities and Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Feed */}
        <Card>
          <CardHeader className="border-0 pb-2">
            <CardTitle className="text-xs font-bold text-text-2 uppercase">Recent Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.activityFeed.length === 0 ? (
              <div className="text-center py-8 text-text-3 text-xs">No recent actions recorded.</div>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {dashboard.activityFeed.map((activity: any, idx: number) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {idx !== dashboard.activityFeed.length - 1 && (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-border" aria-hidden="true" />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-surface-2 border border-border flex items-center justify-center text-accent">
                              {activity.type === 'client' && <Users size={14} />}
                              {activity.type === 'project' && <Briefcase size={14} />}
                              {activity.type === 'invoice' && <FileText size={14} />}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-xs text-text-1 font-semibold">{activity.title}</p>
                              <p className="text-[10px] text-text-2 mt-0.5">{activity.description}</p>
                            </div>
                            <div className="text-right text-[9px] text-text-3 font-medium whitespace-nowrap">
                              {formatRelativeTime(activity.date)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines / Top Clients */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-0 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold text-text-2 uppercase">Top Clients by Revenue</CardTitle>
              <Users size={14} className="text-text-3" />
            </CardHeader>
            <CardContent className="divide-y divide-border/60">
              {dashboard.topClients.length === 0 ? (
                <div className="text-center py-8 text-text-3 text-xs">Add clients in CRM to track rankings.</div>
              ) : (
                dashboard.topClients.map((client: any) => (
                  <div key={client.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xs font-bold uppercase">
                        {client.name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-text-1">{client.name}</p>
                        <p className="text-[10px] text-text-3">{client.company || 'Individual'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-success">{formatCurrency(client.revenue)}</p>
                      <p className="text-[9px] text-text-3 uppercase tracking-wider font-semibold">Total Revenue</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Forms Drawer Modals */}
      <Modal isOpen={isClientOpen} onClose={() => setIsClientOpen(false)} title="Add New CRM Client" type="right">
        <ClientForm onSuccess={handleSuccess} onCancel={() => setIsClientOpen(false)} />
      </Modal>

      <Modal isOpen={isProjectOpen} onClose={() => setIsProjectOpen(false)} title="Start New Project Contract" type="right">
        {clientsList.length === 0 ? (
          <div className="py-8 text-center space-y-4">
            <p className="text-sm text-text-2">You need to add a client in CRM before creating a project.</p>
            <Button size="sm" onClick={() => { setIsClientOpen(true); setIsProjectOpen(false); }}>
              Add Client First
            </Button>
          </div>
        ) : (
          <ProjectForm clientsList={clientsList} onSuccess={handleSuccess} onCancel={() => setIsProjectOpen(false)} />
        )}
      </Modal>

      <Modal isOpen={isTimeOpen} onClose={() => setIsTimeOpen(false)} title="Log Billable Time" type="right">
        {projectsList.length === 0 ? (
          <div className="py-8 text-center space-y-4">
            <p className="text-sm text-text-2">You need to start a project contract before logging time.</p>
            <Button size="sm" onClick={() => { setIsProjectOpen(true); setIsTimeOpen(false); }}>
              Create Project First
            </Button>
          </div>
        ) : (
          <TimeForm
            projectsList={quickProjectsList}
            tasksList={quickTasksList}
            onSuccess={handleSuccess}
            onCancel={() => setIsTimeOpen(false)}
          />
        )}
      </Modal>
    </div>
  )
}
