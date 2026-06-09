'use server'

import { createServerFn } from '@tanstack/react-start'
import { clientSchema, dealSchema } from '#/lib/validations'
import { z } from 'zod'

// 1. Get Clients List
export const getClients = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      search: z.string().optional(),
      status: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('#/server/auth')
    const auth = await requireAuth()
    const userId = auth.user.id

    const { db } = await import('#/server/db')
    const { eq, and, desc, or, ilike } = await import('drizzle-orm')
    const { clients } = await import('#/server/db/schema')

    const conditions = [eq(clients.userId, userId)]

    if (data.status && data.status !== 'all') {
      conditions.push(eq(clients.status, data.status as any))
    }

    if (data.search) {
      conditions.push(
        or(
          ilike(clients.name, `%${data.search}%`),
          ilike(clients.company, `%${data.search}%`),
          ilike(clients.email, `%${data.search}%`)
        ) as any
      )
    }

    const list = await db
      .select()
      .from(clients)
      .where(and(...conditions))
      .orderBy(desc(clients.createdAt))

    return list
  })

// 2. Get Client Detail
export const getClientDetail = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('#/server/auth')
    const auth = await requireAuth()
    const userId = auth.user.id

    const { db } = await import('#/server/db')
    const { eq, and, desc } = await import('drizzle-orm')
    const { clients, projects, invoices } = await import('#/server/db/schema')

    const client = await db.query.clients.findFirst({
      where: and(eq(clients.id, data.id), eq(clients.userId, userId)),
      with: {
        contacts: true,
        projects: {
          orderBy: [desc(projects.createdAt)],
        },
        invoices: {
          orderBy: [desc(invoices.createdAt)],
        },
      },
    })

    if (!client) {
      throw new Error('Client not found')
    }

    return client
  })

// 3. Create Client
export const createClient = createServerFn({ method: 'POST' })
  .validator(clientSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('#/server/auth')
    const auth = await requireAuth()
    const userId = auth.user.id

    const { db } = await import('#/server/db')
    const { clients } = await import('#/server/db/schema')

    const [newClient] = await db
      .insert(clients)
      .values({
        ...data,
        userId,
        tags: JSON.stringify(data.tags),
        totalRevenue: '0',
        totalProjects: 0,
      })
      .returning()

    return newClient
  })

// 4. Update Client
export const updateClient = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      id: z.string().uuid(),
      data: clientSchema,
    })
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('#/server/auth')
    const auth = await requireAuth()
    const userId = auth.user.id

    const { db } = await import('#/server/db')
    const { eq, and } = await import('drizzle-orm')
    const { clients } = await import('#/server/db/schema')

    const [updated] = await db
      .update(clients)
      .set({
        ...data.data,
        tags: JSON.stringify(data.data.tags),
        updatedAt: new Date(),
      })
      .where(and(eq(clients.id, data.id), eq(clients.userId, userId)))
      .returning()

    return updated
  })

// 5. Get Deals (Pipeline Kanban)
export const getDeals = createServerFn({ method: 'GET' }).handler(async () => {
  const { requireAuth } = await import('#/server/auth')
  const auth = await requireAuth()
  const userId = auth.user.id

  const { db } = await import('#/server/db')
  const { eq, desc } = await import('drizzle-orm')
  const { deals, clients } = await import('#/server/db/schema')

  const list = await db
    .select({
      deal: deals,
      clientName: clients.name,
      clientCompany: clients.company,
      clientAvatar: clients.avatarUrl,
    })
    .from(deals)
    .innerJoin(clients, eq(deals.clientId, clients.id))
    .where(eq(deals.userId, userId))
    .orderBy(desc(deals.createdAt))

  return list
})

// 6. Create Deal
export const createDeal = createServerFn({ method: 'POST' })
  .validator(dealSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('#/server/auth')
    const auth = await requireAuth()
    const userId = auth.user.id

    const { db } = await import('#/server/db')
    const { deals } = await import('#/server/db/schema')

    const [newDeal] = await db
      .insert(deals)
      .values({
        ...data,
        userId,
        value: data.value.toString(),
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
      })
      .returning()

    return newDeal
  })

// 7. Update Deal Status (Drag-and-Drop)
export const updateDealStatus = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      id: z.string().uuid(),
      status: z.enum(['lead', 'proposal', 'negotiation', 'won', 'lost']),
      lostReason: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('#/server/auth')
    const auth = await requireAuth()
    const userId = auth.user.id

    const { db } = await import('#/server/db')
    const { eq, and } = await import('drizzle-orm')
    const { deals, projects } = await import('#/server/db/schema')

    const [updated] = await db
      .update(deals)
      .set({
        status: data.status,
        lostReason: data.lostReason || null,
        updatedAt: new Date(),
      })
      .where(and(eq(deals.id, data.id), eq(deals.userId, userId)))
      .returning()

    // If deal won, let's create a project automatically
    if (data.status === 'won') {
      const existingProject = await db.query.projects.findFirst({
        where: and(eq(projects.dealId, data.id), eq(projects.userId, userId)),
      })

      if (!existingProject) {
        await db.insert(projects).values({
          userId,
          clientId: updated.clientId,
          dealId: updated.id,
          title: updated.title,
          status: 'active',
          type: 'fixed',
          budget: updated.value,
          isBillable: true,
        })
      }
    }

    return updated
  })
