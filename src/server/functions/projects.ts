'use server'

import { createServerFn } from '@tanstack/react-start'
import { projectSchema, taskSchema, timeEntrySchema } from '#/lib/validations'
import { z } from 'zod'

// 1. Get Projects
export const getProjects = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      status: z.string().optional(),
      clientId: z.string().uuid().optional(),
    })
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('#/server/auth')
    const auth = await requireAuth()
    const userId = auth.user.id

    const { db } = await import('#/server/db')
    const { eq, and, desc } = await import('drizzle-orm')
    const { projects, clients } = await import('#/server/db/schema')

    const conditions = [eq(projects.userId, userId)]

    if (data.status && data.status !== 'all') {
      conditions.push(eq(projects.status, data.status as any))
    }
    if (data.clientId) {
      conditions.push(eq(projects.clientId, data.clientId))
    }

    const list = await db
      .select({
        project: projects,
        clientName: clients.name,
        clientCompany: clients.company,
      })
      .from(projects)
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(...conditions))
      .orderBy(desc(projects.createdAt))

    return list
  })

// 2. Get Project Detail
export const getProjectDetail = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('#/server/auth')
    const auth = await requireAuth()
    const userId = auth.user.id

    const { db } = await import('#/server/db')
    const { eq, and, desc } = await import('drizzle-orm')
    const { projects, tasks, timeEntries } = await import('#/server/db/schema')

    const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, data.id), eq(projects.userId, userId)),
      with: {
        client: true,
        tasks: {
          orderBy: [desc(tasks.dueDate), desc(tasks.createdAt)],
        },
        timeEntries: {
          orderBy: [desc(timeEntries.startedAt)],
        },
      },
    })

    if (!project) {
      throw new Error('Project not found')
    }

    // Calculate budget utilization
    // total time entries * hourly rate + billable expenses
    let loggedMinutes = 0
    let timeValue = 0
    project.timeEntries.forEach((entry) => {
      loggedMinutes += entry.durationMinutes
      if (entry.isBillable) {
        timeValue += (entry.durationMinutes / 60) * parseFloat(entry.hourlyRate.toString())
      }
    })

    return {
      ...project,
      metrics: {
        loggedMinutes,
        timeValue,
        budgetUsedPercent:
          parseFloat(project.budget.toString()) > 0
            ? Math.min(100, Math.round((timeValue / parseFloat(project.budget.toString())) * 100))
            : 0,
      },
    }
  })

// 3. Create Project
export const createProject = createServerFn({ method: 'POST' })
  .validator(projectSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('#/server/auth')
    const auth = await requireAuth()
    const userId = auth.user.id

    const { db } = await import('#/server/db')
    const { eq, sql } = await import('drizzle-orm')
    const { projects, clients } = await import('#/server/db/schema')

    const [newProject] = await db
      .insert(projects)
      .values({
        ...data,
        userId,
        budget: data.budget.toString(),
        hourlyRate: data.hourlyRate.toString(),
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      })
      .returning()

    // Update client projects counter
    await db
      .update(clients)
      .set({ totalProjects: sql`${clients.totalProjects} + 1` })
      .where(eq(clients.id, data.clientId))

    return newProject
  })

// 4. Update Project Status
export const updateProjectStatus = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      id: z.string().uuid(),
      status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']),
    })
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('#/server/auth')
    const auth = await requireAuth()
    const userId = auth.user.id

    const { db } = await import('#/server/db')
    const { eq, and } = await import('drizzle-orm')
    const { projects } = await import('#/server/db/schema')

    const completedAt = data.status === 'completed' ? new Date() : null

    const [updated] = await db
      .update(projects)
      .set({
        status: data.status,
        completedAt,
        updatedAt: new Date(),
      })
      .where(and(eq(projects.id, data.id), eq(projects.userId, userId)))
      .returning()

    return updated
  })

// 5. Create Task
export const createTask = createServerFn({ method: 'POST' })
  .validator(taskSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('#/server/auth')
    const auth = await requireAuth()
    const userId = auth.user.id

    const { db } = await import('#/server/db')
    const { tasks } = await import('#/server/db/schema')

    const [newTask] = await db
      .insert(tasks)
      .values({
        ...data,
        userId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        estimatedHours: data.estimatedHours ? data.estimatedHours.toString() : null,
        actualHours: '0',
      })
      .returning()

    return newTask
  })

// 6. Update Task Status
export const updateTaskStatus = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      id: z.string().uuid(),
      status: z.enum(['todo', 'in_progress', 'review', 'done']),
    })
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('#/server/auth')
    const auth = await requireAuth()
    const userId = auth.user.id

    const { db } = await import('#/server/db')
    const { eq, and } = await import('drizzle-orm')
    const { tasks } = await import('#/server/db/schema')

    const completedAt = data.status === 'done' ? new Date() : null

    const [updated] = await db
      .update(tasks)
      .set({
        status: data.status,
        completedAt,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, data.id), eq(tasks.userId, userId)))
      .returning()

    return updated
  })

// 7. Create Time Entry
export const createTimeEntry = createServerFn({ method: 'POST' })
  .validator(timeEntrySchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('#/server/auth')
    const auth = await requireAuth()
    const userId = auth.user.id

    const { db } = await import('#/server/db')
    const { eq, sql } = await import('drizzle-orm')
    const { timeEntries, tasks, projects } = await import('#/server/db/schema')

    // Resolve project defaults on the server if the client passed 0 for hourly rate
    let rate = data.hourlyRate
    if (rate === 0) {
      const [project] = await db
        .select({ hourlyRate: projects.hourlyRate })
        .from(projects)
        .where(eq(projects.id, data.projectId))
      if (project) {
        rate = parseFloat(project.hourlyRate.toString())
      }
    }

    const [newEntry] = await db
      .insert(timeEntries)
      .values({
        ...data,
        userId,
        startedAt: new Date(data.startedAt),
        endedAt: data.endedAt ? new Date(data.endedAt) : null,
        hourlyRate: rate.toString(),
        isInvoiced: false,
      })
      .returning()

    // If linked to a task, accumulate task actual hours
    if (data.taskId) {
      const hours = data.durationMinutes / 60
      await db
        .update(tasks)
        .set({ actualHours: sql`COALESCE(actual_hours, 0) + ${hours}` })
        .where(eq(tasks.id, data.taskId))
    }

    return newEntry
  })

// 8. Fetch Time Entries
export const getTimeEntries = createServerFn({ method: 'GET' }).handler(async () => {
  const { requireAuth } = await import('#/server/auth')
  const auth = await requireAuth()
  const userId = auth.user.id

  const { db } = await import('#/server/db')
  const { eq, desc } = await import('drizzle-orm')
  const { timeEntries, projects, tasks } = await import('#/server/db/schema')

  const entries = await db
    .select({
      entry: timeEntries,
      projectName: projects.title,
      taskName: tasks.title,
    })
    .from(timeEntries)
    .innerJoin(projects, eq(timeEntries.projectId, projects.id))
    .leftJoin(tasks, eq(timeEntries.taskId, tasks.id))
    .where(eq(timeEntries.userId, userId))
    .orderBy(desc(timeEntries.startedAt))

  return entries
})
