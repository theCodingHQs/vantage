'use server'

import { createServerFn } from '@tanstack/react-start'

// Helper: Get start/end dates for months
function getMonthRange(offset: number) {
  const date = new Date()
  date.setMonth(date.getMonth() - offset)
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

// 1. Get Dashboard Metrics and Charts
export const getDashboardData = createServerFn({ method: 'GET' }).handler(async () => {
  const { requireAuth } = await import('#/server/auth')
  const auth = await requireAuth()
  const userId = auth.user.id

  const { getRedisClient } = await import('#/server/redis')
  const cacheKey = `dashboard:${userId}`
  let cached: string | null = null
  try {
    const redis = getRedisClient()
    cached = await redis.get(cacheKey)
  } catch (err) {
    console.warn('⚠️ Dashboard cache get failed. Falling back to DB queries.', err)
  }

  if (cached) {
    try {
      return JSON.parse(cached)
    } catch {}
  }

  const { db } = await import('#/server/db')
  const { eq, and, gte, lte, or, inArray, desc, sql, lt } = await import('drizzle-orm')
  const { invoices, projects, tasks, timeEntries, clients } = await import('#/server/db/schema')

  const now = new Date()
  const thisMonth = getMonthRange(0)
  const lastMonth = getMonthRange(1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  // a. Revenue queries
  const getPaidRevenue = async (start?: Date, end?: Date) => {
    const conditions = [eq(invoices.userId, userId), eq(invoices.status, 'paid')]
    if (start) conditions.push(gte(invoices.paidAt, start))
    if (end) conditions.push(lte(invoices.paidAt, end))

    const [res] = await db
      .select({ value: sql<string>`sum(coalesce(${invoices.total}, 0))` })
      .from(invoices)
      .where(and(...conditions))
    return parseFloat(res?.value || '0')
  }

  const revenueThisMonth = await getPaidRevenue(thisMonth.start, thisMonth.end)
  const revenueLastMonth = await getPaidRevenue(lastMonth.start, lastMonth.end)
  const revenueYTD = await getPaidRevenue(startOfYear, now)

  // Calculate percent change
  const revenueChangePercent =
    revenueLastMonth > 0
      ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
      : 0

  // b. Outstanding Invoices
  const outstandingInvoicesRes = await db
    .select({
      total: sql<string>`sum(coalesce(${invoices.total}, 0))`,
      count: sql<number>`count(*)::int`,
    })
    .from(invoices)
    .where(
      and(eq(invoices.userId, userId), inArray(invoices.status, ['sent', 'viewed', 'overdue']))
    )

  const outstandingTotal = parseFloat(outstandingInvoicesRes[0]?.total || '0')
  const outstandingCount = outstandingInvoicesRes[0]?.count || 0

  // Overdue Invoices
  const overdueInvoicesRes = await db
    .select({
      total: sql<string>`sum(coalesce(${invoices.total}, 0))`,
      count: sql<number>`count(*)::int`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.userId, userId),
        or(
          eq(invoices.status, 'overdue'),
          and(eq(invoices.status, 'sent'), lt(invoices.dueDate, now))
        )
      )
    )

  const overdueTotal = parseFloat(overdueInvoicesRes[0]?.total || '0')
  const overdueCount = overdueInvoicesRes[0]?.count || 0

  // c. Active Projects
  const [activeProjectsCountRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.status, 'active')))
  const activeProjectsCount = activeProjectsCountRes?.count || 0

  // d. Tasks due this week
  const startOfWeek = new Date(now)
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(now)
  endOfWeek.setDate(now.getDate() + 7)
  endOfWeek.setHours(23, 59, 59, 999)

  const tasksDueThisWeek = await db
    .select({
      task: tasks,
      projectTitle: projects.title,
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(
        eq(tasks.userId, userId),
        gte(tasks.dueDate, startOfWeek),
        lte(tasks.dueDate, endOfWeek),
        or(eq(tasks.status, 'todo'), eq(tasks.status, 'in_progress'))
      )
    )
    .orderBy(tasks.dueDate)
    .limit(5)

  // e. Revenue chart (last 6 months)
  const revenueChartData: { month: string; amount: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const range = getMonthRange(i)
    const amt = await getPaidRevenue(range.start, range.end)
    const monthLabel = range.start.toLocaleString('default', { month: 'short' })
    revenueChartData.push({ month: monthLabel, amount: amt })
  }

  // f. Top clients by revenue
  const topClients = await db
    .select({
      id: clients.id,
      name: clients.name,
      company: clients.company,
      avatarUrl: clients.avatarUrl,
      revenue: clients.totalRevenue,
    })
    .from(clients)
    .where(eq(clients.userId, userId))
    .orderBy(desc(clients.totalRevenue))
    .limit(5)

  // g. Utilization rate
  const entriesThisMonth = await db
    .select({
      duration: timeEntries.durationMinutes,
      isBillable: timeEntries.isBillable,
    })
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.userId, userId),
        gte(timeEntries.startedAt, thisMonth.start),
        lte(timeEntries.startedAt, thisMonth.end)
      )
    )

  let totalMinutes = 0
  let billableMinutes = 0
  entriesThisMonth.forEach((entry) => {
    totalMinutes += entry.duration
    if (entry.isBillable) {
      billableMinutes += entry.duration
    }
  })

  const utilizationRate = totalMinutes > 0 ? Math.round((billableMinutes / totalMinutes) * 100) : 0

  // h. Recent Activity Feed
  const recentClients = await db.query.clients.findMany({
    where: eq(clients.userId, userId),
    orderBy: [desc(clients.createdAt)],
    limit: 3,
  })
  const recentProjects = await db.query.projects.findMany({
    where: eq(projects.userId, userId),
    orderBy: [desc(projects.createdAt)],
    limit: 3,
  })
  const recentInvoices = await db.query.invoices.findMany({
    where: eq(invoices.userId, userId),
    orderBy: [desc(invoices.createdAt)],
    limit: 3,
  })

  const activityFeed: {
    id: string
    type: string
    title: string
    description: string
    date: Date
  }[] = []

  recentClients.forEach((c) => {
    activityFeed.push({
      id: `client-${c.id}`,
      type: 'client',
      title: 'New Client Added',
      description: `${c.name} (${c.company || 'Individual'}) was added.`,
      date: c.createdAt,
    })
  })
  recentProjects.forEach((p) => {
    activityFeed.push({
      id: `project-${p.id}`,
      type: 'project',
      title: 'New Project Created',
      description: `Project "${p.title}" was started.`,
      date: p.createdAt,
    })
  })
  recentInvoices.forEach((i) => {
    activityFeed.push({
      id: `invoice-${i.id}`,
      type: 'invoice',
      title: `Invoice ${i.invoiceNumber} Created`,
      description: `Status is currently ${i.status}. Total: $${i.total}`,
      date: i.createdAt,
    })
  })

  activityFeed.sort((a, b) => b.date.getTime() - a.date.getTime())
  const trimmedActivity = activityFeed.slice(0, 10)

  const data = {
    revenueThisMonth,
    revenueLastMonth,
    revenueChangePercent,
    revenueYTD,
    outstandingTotal,
    outstandingCount,
    overdueTotal,
    overdueCount,
    activeProjectsCount,
    tasksDueThisWeek,
    revenueChartData,
    topClients,
    utilizationRate,
    activityFeed: trimmedActivity,
  }

  // Cache in Redis for 5 minutes
  try {
    const redis = getRedisClient()
    await redis.set(cacheKey, JSON.stringify(data), 'EX', 300)
  } catch (err) {
    console.warn('⚠️ Dashboard cache set failed.', err)
  }

  return data
})

// 2. Clear Dashboard Cache helper
export async function invalidateDashboardCache(userId: string) {
  try {
    const { getRedisClient } = await import('#/server/redis')
    const redis = getRedisClient()
    await redis.del(`dashboard:${userId}`)
  } catch (err) {
    console.warn('⚠️ Dashboard cache delete failed.', err)
  }
}

// 3. Get Full Reports Analytics
export const getReportsData = createServerFn({ method: 'GET' }).handler(async () => {
  const { requireAuth } = await import('#/server/auth')
  const auth = await requireAuth()
  const userId = auth.user.id

  const { db } = await import('#/server/db')
  const { eq, and, inArray, sql } = await import('drizzle-orm')
  const { expenses, projects, invoices } = await import('#/server/db/schema')

  // a. Category breakdown of expenses
  const expensesRes = await db
    .select({
      category: expenses.category,
      total: sql<string>`sum(coalesce(${expenses.amount}, 0))`,
    })
    .from(expenses)
    .where(eq(expenses.userId, userId))
    .groupBy(expenses.category)

  const expenseCategoryData = expensesRes.map((exp) => ({
    name: exp.category,
    value: parseFloat(exp.total),
  }))

  // b. Project profitability report
  const projectsList = await db.query.projects.findMany({
    where: eq(projects.userId, userId),
    with: {
      client: true,
      timeEntries: true,
    },
  })

  const projectProfitability = await Promise.all(
    projectsList.map(async (p) => {
      // time value
      let timeValue = 0
      let totalMinutes = 0
      p.timeEntries.forEach((entry) => {
        totalMinutes += entry.durationMinutes
        if (entry.isBillable) {
          timeValue += (entry.durationMinutes / 60) * parseFloat(entry.hourlyRate.toString())
        }
      })

      // expenses
      const [expRes] = await db
        .select({ total: sql<string>`sum(coalesce(${expenses.amount}, 0))` })
        .from(expenses)
        .where(and(eq(expenses.projectId, p.id), eq(expenses.userId, userId)))

      const totalExpenses = parseFloat(expRes?.total || '0')

      // budget vs total time value + expenses
      // const budget = parseFloat(p.budget.toString())
      const totalCost = totalExpenses // internal contractor cost (can expand, simplified here to expenses)

      // Revenue made (paid invoices on this project)
      const [invRes] = await db
        .select({ total: sql<string>`sum(coalesce(${invoices.total}, 0))` })
        .from(invoices)
        .where(
          and(
            eq(invoices.projectId, p.id),
            eq(invoices.userId, userId),
            eq(invoices.status, 'paid')
          )
        )

      const revenue = parseFloat(invRes?.total || '0')
      const profit = revenue - totalCost

      return {
        id: p.id,
        projectTitle: p.title,
        clientName: p.client.name,
        revenue,
        expenses: totalExpenses,
        loggedHours: Math.round((totalMinutes / 60) * 10) / 10,
        profit,
        marginPercent: revenue > 0 ? Math.round((profit / revenue) * 100) : 0,
      }
    })
  )

  // c. Invoices aging report
  const outstandingInvoices = await db.query.invoices.findMany({
    where: and(
      eq(invoices.userId, userId),
      inArray(invoices.status, ['sent', 'viewed', 'overdue'])
    ),
    with: {
      client: true,
    },
  })

  const now = new Date()
  const agingReport = {
    under30Days: 0,
    between30And60: 0,
    between60And90: 0,
    over90Days: 0,
    items: [] as any[],
  }

  outstandingInvoices.forEach((inv) => {
    const diffTime = Math.abs(now.getTime() - inv.dueDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const total = parseFloat(inv.total.toString())

    const item = {
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.client.name,
      dueDate: inv.dueDate,
      total,
      daysOutstanding: diffDays,
    }

    agingReport.items.push(item)

    if (diffDays <= 30) {
      agingReport.under30Days += total
    } else if (diffDays <= 60) {
      agingReport.between30And60 += total
    } else if (diffDays <= 90) {
      agingReport.between60And90 += total
    } else {
      agingReport.over90Days += total
    }
  })

  return {
    expenseCategoryData,
    projectProfitability,
    agingReport,
  }
})
