'use server'

import { createServerFn } from '@tanstack/react-start'
import { clientPortalSchema } from '#/lib/validations'
import { z } from 'zod'

// 1. Get Portals list
export const getPortals = createServerFn({ method: 'GET' }).handler(async () => {
  const { requireAuth } = await import('#/server/auth')
  const auth = await requireAuth()
  const userId = auth.user.id

  const { db } = await import('#/server/db')
  const { eq, desc } = await import('drizzle-orm')
  const { clientPortals, clients } = await import('#/server/db/schema')

  const list = await db
    .select({
      portal: clientPortals,
      clientName: clients.name,
      clientCompany: clients.company,
    })
    .from(clientPortals)
    .innerJoin(clients, eq(clientPortals.clientId, clients.id))
    .where(eq(clientPortals.userId, userId))
    .orderBy(desc(clientPortals.createdAt))

  return list
})

// 2. Update/Upsert Portal Settings
export const savePortalSettings = createServerFn({ method: 'POST' })
  .validator(clientPortalSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('#/server/auth')
    const auth = await requireAuth()
    const userId = auth.user.id

    const { db } = await import('#/server/db')
    const { eq, and } = await import('drizzle-orm')
    const { clientPortals } = await import('#/server/db/schema')

    // Check if portal already exists
    const existing = await db.query.clientPortals.findFirst({
      where: and(eq(clientPortals.clientId, data.clientId), eq(clientPortals.userId, userId)),
    })

    if (existing) {
      const [updated] = await db
        .update(clientPortals)
        .set({
          slug: data.slug,
          isActive: data.isActive,
          passwordHash: data.password || existing.passwordHash, // simple storage mock
          showProjects: data.showProjects,
          showInvoices: data.showInvoices,
          showFiles: data.showFiles,
          showMessages: data.showMessages,
          customMessage: data.customMessage,
          updatedAt: new Date(),
        })
        .where(eq(clientPortals.id, existing.id))
        .returning()
      return updated
    } else {
      const [newPortal] = await db
        .insert(clientPortals)
        .values({
          userId,
          clientId: data.clientId,
          slug: data.slug,
          isActive: data.isActive,
          passwordHash: data.password || null,
          showProjects: data.showProjects,
          showInvoices: data.showInvoices,
          showFiles: data.showFiles,
          showMessages: data.showMessages,
          customMessage: data.customMessage,
        })
        .returning()
      return newPortal
    }
  })

// 3. Get Public Portal Data by Slug (Public Route)
export const getPublicPortalData = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const { db } = await import('#/server/db')
    const { eq, and, desc, ne } = await import('drizzle-orm')
    const { clientPortals, portalMessages, clients, projects, invoices, users, files, proposals } =
      await import('#/server/db/schema')

    const portal = await db.query.clientPortals.findFirst({
      where: and(eq(clientPortals.slug, data.slug), eq(clientPortals.isActive, true)),
      with: {
        messages: {
          orderBy: [desc(portalMessages.createdAt)],
          limit: 50,
        },
      },
    })

    if (!portal) {
      throw new Error('Client portal not found or inactive')
    }

    const freelancer = await db.query.users.findFirst({
      where: eq(users.id, portal.userId),
    })

    const client = await db.query.clients.findFirst({
      where: eq(clients.id, portal.clientId),
    })

    let activeProjects: any[] = []
    let activeInvoices: any[] = []
    let sharedFiles: any[] = []

    if (portal.showProjects) {
      activeProjects = await db.query.projects.findMany({
        where: and(eq(projects.clientId, portal.clientId), eq(projects.status, 'active')),
        with: {
          tasks: true,
        },
      })
    }

    if (portal.showInvoices) {
      activeInvoices = await db.query.invoices.findMany({
        where: eq(invoices.clientId, portal.clientId),
        orderBy: [desc(invoices.issueDate)],
      })
    }

    if (portal.showFiles) {
      sharedFiles = await db.query.files.findMany({
        where: eq(files.clientId, portal.clientId),
        orderBy: [desc(files.createdAt)],
      })
    }

    const proposalsList = await db.query.proposals.findMany({
      where: and(eq(proposals.clientId, portal.clientId), ne(proposals.status, 'draft')),
      orderBy: [desc(proposals.createdAt)],
    })

    return {
      portal,
      freelancer: freelancer
        ? {
            businessName: freelancer.businessName,
            businessLogoUrl: freelancer.businessLogoUrl,
            businessAddress: freelancer.businessAddress,
            name: freelancer.name,
            currency: freelancer.currency,
          }
        : null,
      client,
      activeProjects,
      activeInvoices,
      sharedFiles,
      proposals: proposalsList,
    }
  })

// 4. Send Message inside Portal (Public/Client or Freelancer)
export const sendPortalMessage = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      portalId: z.string().uuid(),
      senderType: z.enum(['client', 'freelancer']),
      content: z.string().min(1, 'Message cannot be empty'),
    })
  )
  .handler(async ({ data }) => {
    // If sender is freelancer, we can check auth, otherwise it's the client accessing their public portal
    if (data.senderType === 'freelancer') {
      const { requireAuth } = await import('#/server/auth')
      await requireAuth()
    }

    const { db } = await import('#/server/db')
    const { portalMessages } = await import('#/server/db/schema')

    const [newMessage] = await db
      .insert(portalMessages)
      .values({
        portalId: data.portalId,
        senderType: data.senderType,
        content: data.content,
      })
      .returning()

    return newMessage
  })
