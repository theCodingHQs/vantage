"use server"

import { createServerFn } from '@tanstack/react-start'
import { contentCalendarSchema } from '#/lib/validations'
import { z } from 'zod'

// 1. Get Content Items
export const getContentItems = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { requireAuth } = await import('#/server/auth')
    const auth = await requireAuth()
    const userId = auth.user.id

    const { db } = await import('#/server/db')
    const { eq, desc } = await import('drizzle-orm')
    const { contentCalendar } = await import('#/server/db/schema')

    const list = await db
      .select()
      .from(contentCalendar)
      .where(eq(contentCalendar.userId, userId))
      .orderBy(desc(contentCalendar.scheduledAt), desc(contentCalendar.createdAt))

    return list
  })

// 2. Create Content Item
export const createContentItem = createServerFn({ method: 'POST' })
  .validator(contentCalendarSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('#/server/auth')
    const auth = await requireAuth()
    const userId = auth.user.id

    const { db } = await import('#/server/db')
    const { contentCalendar } = await import('#/server/db/schema')

    const [newItem] = await db.insert(contentCalendar).values({
      ...data,
      userId,
      mediaUrls: JSON.stringify(data.mediaUrls),
      tags: JSON.stringify(data.tags),
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
    }).returning()

    return newItem
  })

// 3. Update Content Item
export const updateContentItem = createServerFn({ method: 'POST' })
  .validator(z.object({
    id: z.string().uuid(),
    data: contentCalendarSchema
  }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('#/server/auth')
    const auth = await requireAuth()
    const userId = auth.user.id

    const { db } = await import('#/server/db')
    const { eq, and } = await import('drizzle-orm')
    const { contentCalendar } = await import('#/server/db/schema')

    const [updated] = await db.update(contentCalendar).set({
      ...data.data,
      mediaUrls: JSON.stringify(data.data.mediaUrls),
      tags: JSON.stringify(data.data.tags),
      scheduledAt: data.data.scheduledAt ? new Date(data.data.scheduledAt) : null,
      updatedAt: new Date(),
    })
    .where(and(eq(contentCalendar.id, data.id), eq(contentCalendar.userId, userId)))
    .returning()

    return updated
  })

// 4. Delete Content Item
export const deleteContentItem = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('#/server/auth')
    const auth = await requireAuth()
    const userId = auth.user.id

    const { db } = await import('#/server/db')
    const { eq, and } = await import('drizzle-orm')
    const { contentCalendar } = await import('#/server/db/schema')

    const [deleted] = await db.delete(contentCalendar)
      .where(and(eq(contentCalendar.id, data.id), eq(contentCalendar.userId, userId)))
      .returning()

    return deleted
  })
