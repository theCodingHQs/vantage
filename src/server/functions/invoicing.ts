"use server"

import { createServerFn } from '@tanstack/react-start'
import { invoiceSchema, expenseSchema } from '#/lib/validations'
import { z } from 'zod'

// 1. Get Invoices List
export const getInvoices = createServerFn({ method: 'GET' })
  .validator(z.object({
    status: z.string().optional(),
    clientId: z.string().uuid().optional(),
  }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('#/server/auth')
    const auth = await requireAuth()
    const userId = auth.user.id

    const { db } = await import('#/server/db')
    const { eq, and, desc } = await import('drizzle-orm')
    const { invoices, clients, projects } = await import('#/server/db/schema')

    let conditions = [eq(invoices.userId, userId)]

    if (data.status && data.status !== 'all') {
      conditions.push(eq(invoices.status, data.status as any))
    }
    if (data.clientId) {
      conditions.push(eq(invoices.clientId, data.clientId))
    }

    const list = await db
      .select({
        invoice: invoices,
        clientName: clients.name,
        projectName: projects.title,
      })
      .from(invoices)
      .innerJoin(clients, eq(invoices.clientId, clients.id))
      .leftJoin(projects, eq(invoices.projectId, projects.id))
      .where(and(...conditions))
      .orderBy(desc(invoices.issueDate), desc(invoices.createdAt))

    return list
  })

// 2. Get Invoice Details
export const getInvoiceDetail = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('#/server/auth')
    const auth = await requireAuth()
    const userId = auth.user.id

    const { db } = await import('#/server/db')
    const { eq, and } = await import('drizzle-orm')
    const { invoices } = await import('#/server/db/schema')

    const invoice = await db.query.invoices.findFirst({
      where: and(eq(invoices.id, data.id), eq(invoices.userId, userId)),
      with: {
        client: true,
        items: true,
      }
    })

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    return invoice
  })

// 3. Create Invoice
export const createInvoice = createServerFn({ method: 'POST' })
  .validator(invoiceSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('#/server/auth')
    const auth = await requireAuth()
    const userId = auth.user.id

    const { db } = await import('#/server/db')
    const { invoices, invoiceItems } = await import('#/server/db/schema')

    // Live calculate subtotals, tax and total
    let subtotal = 0
    const itemsData = data.items.map(item => {
      const qty = parseFloat(item.quantity.toString())
      const price = parseFloat(item.unitPrice.toString())
      const amt = qty * price
      subtotal += amt
      return {
        description: item.description,
        quantity: qty.toString(),
        unitPrice: price.toString(),
        amount: amt.toString(),
        type: item.type,
      }
    })

    const taxRate = parseFloat(data.taxRate.toString())
    const discountAmount = parseFloat(data.discountAmount.toString())
    const taxAmount = (subtotal - discountAmount) * (taxRate / 100)
    const total = subtotal - discountAmount + taxAmount

    // Insert Invoice
    const [newInvoice] = await db.insert(invoices).values({
      userId,
      clientId: data.clientId,
      projectId: data.projectId,
      invoiceNumber: data.invoiceNumber,
      status: 'draft',
      issueDate: new Date(data.issueDate),
      dueDate: new Date(data.dueDate),
      subtotal: subtotal.toString(),
      taxRate: taxRate.toString(),
      taxAmount: taxAmount.toString(),
      discountAmount: discountAmount.toString(),
      total: total.toString(),
      currency: data.currency,
      notes: data.notes,
    }).returning()

    // Insert Invoice Items
    await db.insert(invoiceItems).values(
      itemsData.map(item => ({
        ...item,
        invoiceId: newInvoice.id,
      }))
    )

    return newInvoice
  })

// 4. Record Manual Payment (Mark Paid)
export const recordInvoicePayment = createServerFn({ method: 'POST' })
  .validator(z.object({
    id: z.string().uuid(),
    paymentMethod: z.string(),
    notes: z.string().optional()
  }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('#/server/auth')
    const auth = await requireAuth()
    const userId = auth.user.id

    const { db } = await import('#/server/db')
    const { eq, and, sql } = await import('drizzle-orm')
    const { invoices, clients } = await import('#/server/db/schema')

    const invoice = await db.query.invoices.findFirst({
      where: and(eq(invoices.id, data.id), eq(invoices.userId, userId))
    })

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    if (invoice.status === 'paid') {
      return invoice
    }

    const paidAt = new Date()

    // Update invoice status
    const [updated] = await db.update(invoices).set({
      status: 'paid',
      paidAt,
      paymentMethod: data.paymentMethod,
      notes: data.notes || invoice.notes,
      updatedAt: new Date(),
    })
    .where(and(eq(invoices.id, data.id), eq(invoices.userId, userId)))
    .returning()

    // Accumulate total client revenue
    await db.update(clients)
      .set({
        totalRevenue: sql`${clients.totalRevenue} + ${parseFloat(invoice.total.toString())}`
      })
      .where(eq(clients.id, invoice.clientId))

    return updated
  })

// 5. Update Invoice Status
export const updateInvoiceStatus = createServerFn({ method: 'POST' })
  .validator(z.object({
    id: z.string().uuid(),
    status: z.enum(['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'])
  }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('#/server/auth')
    const auth = await requireAuth()
    const userId = auth.user.id

    const { db } = await import('#/server/db')
    const { eq, and } = await import('drizzle-orm')
    const { invoices } = await import('#/server/db/schema')

    const [updated] = await db.update(invoices).set({
      status: data.status,
      updatedAt: new Date(),
    })
    .where(and(eq(invoices.id, data.id), eq(invoices.userId, userId)))
    .returning()

    return updated
  })

// 6. Get Expenses
export const getExpenses = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { requireAuth } = await import('#/server/auth')
    const auth = await requireAuth()
    const userId = auth.user.id

    const { db } = await import('#/server/db')
    const { eq, desc } = await import('drizzle-orm')
    const { expenses, clients, projects } = await import('#/server/db/schema')

    const list = await db
      .select({
        expense: expenses,
        clientName: clients.name,
        projectName: projects.title,
      })
      .from(expenses)
      .leftJoin(clients, eq(expenses.clientId, clients.id))
      .leftJoin(projects, eq(expenses.projectId, projects.id))
      .where(eq(expenses.userId, userId))
      .orderBy(desc(expenses.date))

    return list
  })

// 7. Create Expense
export const createExpense = createServerFn({ method: 'POST' })
  .validator(expenseSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('#/server/auth')
    const auth = await requireAuth()
    const userId = auth.user.id

    const { db } = await import('#/server/db')
    const { expenses } = await import('#/server/db/schema')

    const [newExpense] = await db.insert(expenses).values({
      ...data,
      userId,
      amount: data.amount.toString(),
      date: new Date(data.date),
      isInvoiced: false,
    }).returning()

    return newExpense
  })
