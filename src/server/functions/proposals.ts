'use server'

import { createServerFn } from '@tanstack/react-start'
import { proposalSchema } from '#/lib/validations'
import { z } from 'zod'

// 1. Get Proposals List
export const getProposals = createServerFn({ method: 'GET' }).handler(async () => {
  const { requireAuth } = await import('#/server/auth')
  const auth = await requireAuth()
  const userId = auth.user.id

  const { db } = await import('#/server/db')
  const { eq, desc } = await import('drizzle-orm')
  const { proposals, clients } = await import('#/server/db/schema')

  const list = await db
    .select({
      proposal: proposals,
      clientName: clients.name,
    })
    .from(proposals)
    .innerJoin(clients, eq(proposals.clientId, clients.id))
    .where(eq(proposals.userId, userId))
    .orderBy(desc(proposals.createdAt))

  return list
})

// 2. Get Proposal Detail (supports public view)
export const getProposalDetail = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { db } = await import('#/server/db')
    const { eq } = await import('drizzle-orm')
    const { proposals } = await import('#/server/db/schema')

    // Note: Public routes can access this, so we don't call requireAuth() here.
    // Instead, we verify that the proposal exists in the database.
    const proposal = await db.query.proposals.findFirst({
      where: eq(proposals.id, data.id),
      with: {
        client: {
          with: {
            portals: true,
          },
        },
      },
    })

    if (!proposal) {
      throw new Error('Proposal not found')
    }

    return proposal
  })

// 3. Create Proposal
export const createProposal = createServerFn({ method: 'POST' })
  .validator(proposalSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('#/server/auth')
    const auth = await requireAuth()
    const userId = auth.user.id

    const { db } = await import('#/server/db')
    const { proposals } = await import('#/server/db/schema')

    const [newProposal] = await db
      .insert(proposals)
      .values({
        userId,
        clientId: data.clientId,
        title: data.title,
        status: 'draft',
        contentJson: JSON.stringify(data.contentJson),
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        totalValue: data.totalValue.toString(),
      })
      .returning()

    return newProposal
  })

// 4. Record View
export const recordProposalView = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { db } = await import('#/server/db')
    const { eq } = await import('drizzle-orm')
    const { proposals } = await import('#/server/db/schema')

    const [updated] = await db
      .update(proposals)
      .set({
        viewedAt: new Date(),
        status: 'viewed',
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, data.id))
      .returning()

    return updated
  })

// 5. Accept Proposal (E-Signature)
export const acceptProposal = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      id: z.string().uuid(),
      signatureText: z.string().min(1, 'Signature is required'),
    })
  )
  .handler(async ({ data }) => {
    const { db } = await import('#/server/db')
    const { eq, and } = await import('drizzle-orm')
    const { proposals, projects } = await import('#/server/db/schema')

    const proposal = await db.query.proposals.findFirst({
      where: eq(proposals.id, data.id),
    })

    if (!proposal) {
      throw new Error('Proposal not found')
    }

    const respondedAt = new Date()

    // 1. Update proposal status
    const [updated] = await db
      .update(proposals)
      .set({
        status: 'accepted',
        respondedAt,
        signatureUrl: data.signatureText, // save typed signature text as string
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, data.id))
      .returning()

    // 2. Automatically convert accepted proposal to Project
    const existingProject = await db.query.projects.findFirst({
      where: and(
        eq(projects.clientId, proposal.clientId),
        eq(projects.title, proposal.title),
        eq(projects.userId, proposal.userId)
      ),
    })

    if (!existingProject) {
      await db.insert(projects).values({
        userId: proposal.userId,
        clientId: proposal.clientId,
        title: proposal.title,
        status: 'active',
        type: 'fixed',
        budget: proposal.totalValue,
        startDate: new Date(),
        isBillable: true,
      })
    }

    return updated
  })

// 6. Decline Proposal
export const declineProposal = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { db } = await import('#/server/db')
    const { eq } = await import('drizzle-orm')
    const { proposals } = await import('#/server/db/schema')

    const [updated] = await db
      .update(proposals)
      .set({
        status: 'declined',
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, data.id))
      .returning()

    return updated
  })
