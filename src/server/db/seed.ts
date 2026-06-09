'use server'

import { db } from './index'
import {
  users,
  clients,
  contacts,
  deals,
  projects,
  tasks,
  timeEntries,
  invoices,
  invoiceItems,
  expenses,
  contentCalendar,
  proposals,
  clientPortals,
  portalMessages,
  files,
  notifications,
} from './schema'
import { eq, sql, inArray } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

async function seed() {
  console.log('🌱 Starting database seed...')

  // 1. Find or create user
  const email = 'test_register_user@example.com'
  let user = await db.query.users.findFirst({
    where: eq(users.email, email),
  })

  if (!user) {
    console.log(`👤 User ${email} not found. Creating...`)
    const passwordHash = await bcrypt.hash('password123', 10)
    const [insertedUser] = await db
      .insert(users)
      .values({
        email,
        name: 'Test Vantage User',
        passwordHash,
        onboardingCompleted: true,
        plan: 'pro',
        timezone: 'America/New_York',
        currency: 'USD',
        businessName: 'Vantage Digital Inc.',
      })
      .returning()
    user = insertedUser
  }

  const userId = user.id
  console.log(`👤 Seeding data for User ID: ${userId}`)

  // Clean up existing seeded data for this user to make it repeatable
  console.log('🧹 Cleaning up old seed data for this user...')

  const userPortals = await db
    .select({ id: clientPortals.id })
    .from(clientPortals)
    .where(eq(clientPortals.userId, userId))
  if (userPortals.length > 0) {
    const portalIds = userPortals.map((p) => p.id)
    await db.delete(portalMessages).where(inArray(portalMessages.portalId, portalIds))
  }
  await db.delete(clientPortals).where(eq(clientPortals.userId, userId))
  await db.delete(files).where(eq(files.userId, userId))
  await db.delete(notifications).where(eq(notifications.userId, userId))
  await db.delete(contentCalendar).where(eq(contentCalendar.userId, userId))
  await db.delete(proposals).where(eq(proposals.userId, userId))
  await db.delete(expenses).where(eq(expenses.userId, userId))

  const userInvoices = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(eq(invoices.userId, userId))
  if (userInvoices.length > 0) {
    const invoiceIds = userInvoices.map((i) => i.id)
    await db.delete(invoiceItems).where(inArray(invoiceItems.invoiceId, invoiceIds))
  }
  await db.delete(invoices).where(eq(invoices.userId, userId))
  await db.delete(timeEntries).where(eq(timeEntries.userId, userId))
  await db.delete(tasks).where(eq(tasks.userId, userId))
  await db.delete(projects).where(eq(projects.userId, userId))
  await db.delete(deals).where(eq(deals.userId, userId))
  await db.delete(contacts).where(eq(contacts.userId, userId))
  await db.delete(clients).where(eq(clients.userId, userId))

  console.log('✅ Clean up finished. Seeding new rows...')

  // 2. Seed Clients (40 rows)
  console.log('👥 Seeding Clients...')
  const clientNames = [
    'Acme Corp',
    'Globex Corporation',
    'Soylent Corp',
    'Initech',
    'Umbrella Corp',
    'Hooli',
    'Vehement Capital',
    'Massive Dynamic',
    'Aperture Science',
    'Stark Industries',
    'Wayne Enterprises',
    'Oscorp',
    'Tyrell Corp',
    'Cyberdyne Systems',
    'Dunder Mifflin',
    'Sterling Cooper',
    'E Corp',
    'Pied Piper',
    'Monarch Sciences',
    'Vandelay Industries',
    'Reynholm Industries',
    'Bluth Company',
    'Prestige Worldwide',
    'Gekko & Co',
    'Duke & Duke',
    'Nakatomi Plaza',
    'Kravitz Corp',
    'Sutton Group',
    'Summit Partners',
    'Bain & Co',
    'Alpha Partners',
    'Nova Ventures',
    'Zenith Agency',
    'Meridian Labs',
    'Vanguard Legal',
    'Horizon Logistics',
    'Epic Design Studio',
    'Pixel Perfect',
    'Code Crafters',
    'Launchpad Inc',
  ]
  const industries = [
    'Tech',
    'Finance',
    'Health',
    'Retail',
    'Legal',
    'Logistics',
    'Marketing',
    'Consulting',
  ]

  const clientRows: any[] = []
  for (let i = 0; i < 40; i++) {
    const name = clientNames[i]
    const company = name
    const email = `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
    const industry = industries[i % industries.length]

    const [c] = await db
      .insert(clients)
      .values({
        userId,
        name: `${name} Rep`,
        company,
        email,
        phone: `+1-555-${100 + i}-${2000 + i}`,
        website: `www.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        status: i % 4 === 0 ? 'inactive' : i % 5 === 0 ? 'prospect' : 'active',
        tags: JSON.stringify([industry, i % 2 === 0 ? 'Enterprise' : 'SMB']),
        notes: `Key account in ${industry} space. Prefers Net 30 invoicing.`,
        address: `${100 + i} Main St, Suite ${i + 1}, New York, NY 10001`,
        totalRevenue: '0',
        totalProjects: 0,
        createdAt: new Date(Date.now() - (60 - i) * 24 * 60 * 60 * 1000),
      })
      .returning()
    clientRows.push(c)
  }

  // 3. Seed Contacts (40 rows)
  console.log('📞 Seeding Contacts...')
  const contactFirstNames = [
    'Alice',
    'Bob',
    'Charlie',
    'Diana',
    'Ethan',
    'Fiona',
    'George',
    'Hannah',
    'Ian',
    'Julia',
  ]
  const contactLastNames = [
    'Smith',
    'Johnson',
    'Williams',
    'Brown',
    'Jones',
    'Miller',
    'Davis',
    'Garcia',
    'Rodriguez',
    'Wilson',
  ]
  const roles = [
    'CEO',
    'CTO',
    'Product Manager',
    'Procurement Lead',
    'Director of Engineering',
    'VP of Marketing',
  ]

  for (let i = 0; i < 40; i++) {
    const client = clientRows[i]
    const name = `${contactFirstNames[i % contactFirstNames.length]} ${contactLastNames[i % contactLastNames.length]}`
    await db.insert(contacts).values({
      clientId: client.id,
      userId,
      name,
      email: `contact.${name.toLowerCase().replace(/ /g, '.')}@${client.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      phone: client.phone,
      role: roles[i % roles.length],
      isPrimary: i % 2 === 0,
    })
  }

  // 4. Seed Deals (40 rows)
  console.log('🤝 Seeding Deals...')
  const dealStages: ('lead' | 'proposal' | 'negotiation' | 'won' | 'lost')[] = [
    'lead',
    'proposal',
    'negotiation',
    'won',
    'lost',
  ]
  const dealRows: any[] = []

  for (let i = 0; i < 40; i++) {
    const client = clientRows[i]
    const value = 5000 + i * 2500
    const status = dealStages[i % dealStages.length]

    const [d] = await db
      .insert(deals)
      .values({
        userId,
        clientId: client.id,
        title: `${client.company} - Workspace Redesign & Dev`,
        value: value.toString(),
        currency: 'USD',
        status,
        probability:
          status === 'won'
            ? 100
            : status === 'lost'
              ? 0
              : status === 'negotiation'
                ? 80
                : status === 'proposal'
                  ? 55
                  : 20,
        expectedCloseDate: new Date(Date.now() + (i - 10) * 24 * 60 * 60 * 1000),
        notes: `Negotiating contract values and billing milestones. Value is $${value}.`,
        lostReason: status === 'lost' ? 'Competitor offered lower pricing.' : null,
        createdAt: new Date(Date.now() - (60 - i) * 24 * 60 * 60 * 1000),
      })
      .returning()
    dealRows.push(d)
  }

  // 5. Seed Projects (40 rows)
  console.log('📁 Seeding Projects...')
  const projectRows: any[] = []
  const projectStatuses: ('planning' | 'active' | 'on_hold' | 'completed' | 'cancelled')[] = [
    'planning',
    'active',
    'on_hold',
    'completed',
    'cancelled',
  ]

  for (let i = 0; i < 40; i++) {
    const client = clientRows[i]
    const deal = dealRows[i]
    const status = projectStatuses[i % projectStatuses.length]
    const type = i % 3 === 0 ? 'hourly' : i % 3 === 1 ? 'fixed' : 'retainer'
    const budget = type === 'fixed' ? (10000 + i * 1500).toString() : '0'
    const hourlyRate = type === 'hourly' ? (50 + (i % 5) * 25).toString() : '0'

    const [p] = await db
      .insert(projects)
      .values({
        userId,
        clientId: client.id,
        dealId: deal.status === 'won' ? deal.id : null,
        title: `${client.company} Project ${i + 1}`,
        description: `Delivery of premium design systems, application architecture, and integration steps.`,
        status,
        type,
        budget,
        hourlyRate,
        startDate: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + (30 + i) * 24 * 60 * 60 * 1000),
        completedAt:
          status === 'completed'
            ? new Date(Date.now() - (5 - (i % 5)) * 24 * 60 * 60 * 1000)
            : null,
        isBillable: true,
        createdAt: new Date(Date.now() - (40 - i) * 24 * 60 * 60 * 1000),
      })
      .returning()
    projectRows.push(p)

    // Increment total projects counter on client
    await db
      .update(clients)
      .set({ totalProjects: i % 4 === 0 ? 2 : 1 })
      .where(eq(clients.id, client.id))
  }

  // 6. Seed Tasks (40 rows)
  console.log('📋 Seeding Tasks...')
  const taskTitles = [
    'Research user personas',
    'Create design system',
    'Draft database schema',
    'Set up Vite project',
    'Configure Drizzle ORM',
    'Establish server functions',
    'Build authentication screens',
    'Build onboarding steps',
    'Integrate state manager',
    'Style dashboard metrics',
    'Create kanban columns',
    'Implement drag-n-drop',
    'Create manual time logging',
    'Establish CSV export',
    'Configure tailwind theme',
    'Write unit tests',
    'Setup client portal routes',
    'Integrate Resend emailing',
    'Build social content calendar',
    'Create project reports page',
    'Deploy client staging',
    'Add PDF export templates',
    'Refactor auth middlewares',
    'Setup Redis cache fallbacks',
    'Perform SEO audit',
    'Fix hydration bugs',
    'Optimize image loaders',
    'Draft pricing models',
    'Verify responsive forms',
    'Setup docker container',
    'Implement chat socket',
    'Code split routing tree',
    'Optimize SQL indices',
    'Review terms of service',
    'Establish stripe billing',
    'Refactor store actions',
    'Cleanup mock assets',
    'Perform load testing',
    'Setup production SSL',
    'Configure backup routines',
  ]
  const taskRows: any[] = []

  for (let i = 0; i < 40; i++) {
    const project = projectRows[i]
    const [t] = await db
      .insert(tasks)
      .values({
        projectId: project.id,
        userId,
        title: taskTitles[i],
        description: `Detailed sub-tasks to achieve milestone ${i + 1}. Review dependencies and design guidelines.`,
        status:
          i % 4 === 0 ? 'done' : i % 4 === 1 ? 'review' : i % 4 === 2 ? 'in_progress' : 'todo',
        priority: i % 5 === 0 ? 'urgent' : i % 5 === 1 ? 'high' : i % 5 === 2 ? 'medium' : 'low',
        dueDate: new Date(Date.now() + (i - 15) * 24 * 60 * 60 * 1000),
        completedAt: i % 4 === 0 ? new Date(Date.now() - (i % 5) * 24 * 60 * 60 * 1000) : null,
        estimatedHours: (4 + (i % 6) * 4).toString(),
        actualHours: i % 4 === 0 ? (4 + (i % 6) * 4).toString() : '0',
      })
      .returning()
    taskRows.push(t)
  }

  // 7. Seed Time Entries (40 rows)
  console.log('⏱️ Seeding Time Entries...')
  for (let i = 0; i < 40; i++) {
    const project = projectRows[i]
    const task = taskRows[i]
    const duration = 60 + (i % 8) * 45 // minutes
    const startedAt = new Date(Date.now() - (40 - i) * 24 * 60 * 60 * 1000)

    await db.insert(timeEntries).values({
      userId,
      projectId: project.id,
      taskId: i % 2 === 0 ? task.id : null,
      description: `Coding and refactoring task ${i + 1} - verified tests and alignment.`,
      startedAt,
      endedAt: new Date(startedAt.getTime() + duration * 60000),
      durationMinutes: duration,
      isBillable: i % 6 !== 0,
      hourlyRate: parseFloat(project.hourlyRate.toString()) > 0 ? project.hourlyRate : '75.00',
      isInvoiced: i % 3 === 0,
    })

    // Accumulate task actual hours if done
    if (i % 2 === 0 && task.status === 'done') {
      const hours = duration / 60
      await db.update(tasks).set({ actualHours: hours.toString() }).where(eq(tasks.id, task.id))
    }
  }

  // 8. Seed Invoices (40 rows)
  console.log('📄 Seeding Invoices...')
  const invoiceRows: any[] = []

  for (let i = 0; i < 40; i++) {
    const client = clientRows[i]
    const project = projectRows[i]

    // Distribute statuses using a cycle of length 8 to be coprime with 6,
    // ensuring approximately 50% paid status and a healthy mix of sent, viewed, overdue, draft, cancelled.
    const statusCycle = ['paid', 'paid', 'sent', 'viewed', 'overdue', 'draft', 'paid', 'cancelled']
    const status = statusCycle[i % statusCycle.length] as any

    const subtotal = 1500 + i * 250
    const taxRate = 8.25
    const discountAmount = i % 5 === 0 ? 100 : 0
    const taxAmount = (subtotal - discountAmount) * (taxRate / 100)
    const total = subtotal - discountAmount + taxAmount

    // Determine the month offset (0 to 5 months ago)
    const monthOffset = i % 6
    const targetDate = new Date()
    targetDate.setDate(1) // Avoid month overflow issues
    targetDate.setMonth(targetDate.getMonth() - monthOffset)

    // Determine a safe day in the month
    const todayDay = new Date().getDate()
    const day = monthOffset === 0 ? 1 + (i % Math.max(1, todayDay)) : 1 + (i % 28)

    targetDate.setDate(day)
    targetDate.setHours(9 + (i % 8), (i * 7) % 60, (i * 13) % 60, 0)

    let paidAt: Date | null = null
    let issueDate: Date
    let dueDate: Date

    if (status === 'paid') {
      paidAt = targetDate
      issueDate = new Date(paidAt.getTime() - 15 * 24 * 60 * 60 * 1000)
      dueDate = new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    } else if (status === 'overdue') {
      // Overdue invoices: dueDate should be in the past
      dueDate = new Date(Date.now() - (1 + (i % 10)) * 24 * 60 * 60 * 1000)
      issueDate = new Date(dueDate.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else {
      issueDate = targetDate
      dueDate = new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    }

    const [inv] = await db
      .insert(invoices)
      .values({
        userId,
        clientId: client.id,
        projectId: project.id,
        invoiceNumber: `INV-2026-${1000 + i}`,
        status,
        issueDate,
        dueDate,
        paidAt,
        subtotal: subtotal.toString(),
        taxRate: taxRate.toString(),
        taxAmount: taxAmount.toFixed(2),
        discountAmount: discountAmount.toString(),
        total: total.toFixed(2),
        currency: 'USD',
        notes: 'Thank you for your business! Please remit payment via bank transfer.',
        paymentMethod: status === 'paid' ? (i % 2 === 0 ? 'ach' : 'card') : null,
      })
      .returning()
    invoiceRows.push(inv)

    // If paid, increment total client revenue
    if (status === 'paid') {
      await db
        .update(clients)
        .set({
          totalRevenue: sql`${clients.totalRevenue} + ${total}`,
        })
        .where(eq(clients.id, client.id))
    }
  }

  // 9. Seed Invoice Items (40 rows)
  console.log('📝 Seeding Invoice Items...')
  for (let i = 0; i < 40; i++) {
    const invoice = invoiceRows[i]
    const subtotal = parseFloat(invoice.subtotal.toString())

    await db.insert(invoiceItems).values({
      invoiceId: invoice.id,
      description: `Development consulting and application deployment milestones (item ${i + 1})`,
      quantity: '1.00',
      unitPrice: subtotal.toString(),
      amount: subtotal.toString(),
      type: 'service',
    })
  }

  // 10. Seed Expenses (40 rows)
  console.log('💸 Seeding Expenses...')
  const expenseCategories = ['Software', 'Travel', 'Equipment', 'Contractor', 'Marketing', 'Other']
  const expenseDescs = [
    'Figma subscription',
    'AWS servers billing',
    'Uber for client meeting',
    'M2 Macbook Pro machine',
    'Facebook Ads campaign',
    'Contractor react-design assistance',
    'Coffee with prospective client',
    'Co-working hot desk monthly passes',
    'Resend transactional email pro plan',
    'Notion organization software',
    'Sentry error logger dashboard subscription',
  ]

  for (let i = 0; i < 40; i++) {
    const project = projectRows[i]
    const client = clientRows[i]
    const category = expenseCategories[i % expenseCategories.length]
    const amount = 20 + (i % 10) * 85

    await db.insert(expenses).values({
      userId,
      projectId: i % 2 === 0 ? project.id : null,
      clientId: i % 2 === 0 ? client.id : null,
      category,
      description: expenseDescs[i % expenseDescs.length],
      amount: amount.toString(),
      currency: 'USD',
      date: new Date(Date.now() - (40 - i) * 24 * 60 * 60 * 1000),
      isBillable: i % 4 === 0,
      isInvoiced: i % 8 === 0,
    })
  }

  // 11. Seed Content Calendar (40 rows)
  console.log('📅 Seeding Content Calendar...')
  const platforms: ('twitter' | 'linkedin' | 'instagram' | 'youtube' | 'blog' | 'other')[] = [
    'twitter',
    'linkedin',
    'instagram',
    'youtube',
    'blog',
    'other',
  ]
  const contentStatuses: ('idea' | 'drafting' | 'scheduled' | 'published')[] = [
    'idea',
    'drafting',
    'scheduled',
    'published',
  ]

  for (let i = 0; i < 40; i++) {
    const platform = platforms[i % platforms.length]
    const status = contentStatuses[i % contentStatuses.length]
    const schedOffset = (i - 15) * 2

    await db.insert(contentCalendar).values({
      userId,
      title: `Vantage Growth Hack #${i + 1}`,
      platform,
      status,
      content: `Here is tip #${i + 1} to automate your freelancer workflows and 10x your client margins. Use clean path routes, state synchronization, and persistent caches.`,
      scheduledAt: new Date(Date.now() + schedOffset * 24 * 60 * 60 * 1000),
      publishedAt: status === 'published' ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) : null,
      tags: JSON.stringify([platform, 'automation', 'solopreneur']),
      notes: 'Remember to cross-post to other channels and include visual graphs.',
    })
  }

  // 12. Seed Proposals (40 rows)
  console.log('📄 Seeding Proposals...')
  const proposalRows: any[] = []
  const proposalStatuses: ('draft' | 'sent' | 'viewed' | 'accepted' | 'declined')[] = [
    'draft',
    'sent',
    'viewed',
    'accepted',
    'declined',
  ]

  for (let i = 0; i < 40; i++) {
    const client = clientRows[i]
    const status = proposalStatuses[i % proposalStatuses.length]
    const value = 8000 + i * 1250

    const [prop] = await db
      .insert(proposals)
      .values({
        userId,
        clientId: client.id,
        title: `Premium Architecture Proposal for ${client.company}`,
        status,
        contentJson: JSON.stringify({
          blocks: [
            { type: 'header', text: 'Executive Summary Scope of Work' },
            {
              type: 'paragraph',
              text: 'This proposal details the design system, codebase migrations, and deployment architecture details.',
            },
          ],
        }),
        validUntil: new Date(Date.now() + (30 + i) * 24 * 60 * 60 * 1000),
        totalValue: value.toString(),
        viewedAt: status !== 'draft' ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) : null,
        respondedAt:
          status === 'accepted' || status === 'declined'
            ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            : null,
        signatureUrl: status === 'accepted' ? 'Jane Doe (Client E-Signature)' : null,
      })
      .returning()
    proposalRows.push(prop)
  }

  // 13. Seed Client Portals (40 rows)
  console.log('🌐 Seeding Client Portals...')
  const portalRows: any[] = []

  for (let i = 0; i < 40; i++) {
    const client = clientRows[i]
    const slug = `${client.company.toLowerCase().replace(/[^a-z0-9]/g, '')}-${i}`

    const [port] = await db
      .insert(clientPortals)
      .values({
        userId,
        clientId: client.id,
        slug,
        isActive: i % 8 !== 0,
        passwordHash: i % 4 === 0 ? 'portal_pass_mock' : null,
        showProjects: true,
        showInvoices: true,
        showFiles: true,
        showMessages: true,
        customMessage: `Welcome to the client portal for ${client.company}! Find resources below.`,
      })
      .returning()
    portalRows.push(port)
  }

  // 14. Seed Portal Messages (40 rows)
  console.log('💬 Seeding Portal Messages...')
  const messages = [
    'Hello! Let me know when you review the first project dashboard milestones.',
    'I uploaded the brand assets to the files tab.',
    'Can we move the weekly syncing meeting to Thursday at 2 PM?',
    'Awesome progress on the design systems. App looks premium!',
    'Are these invoice lines already including the contractor outlay discount?',
    'Just paid the second milestone invoice via credit card.',
  ]

  for (let i = 0; i < 40; i++) {
    const portal = portalRows[i]
    await db.insert(portalMessages).values({
      portalId: portal.id,
      senderType: i % 2 === 0 ? 'client' : 'freelancer',
      content: messages[i % messages.length],
      readAt: i % 3 === 0 ? new Date() : null,
      createdAt: new Date(Date.now() - (10 - (i % 10)) * 24 * 60 * 60 * 1000),
    })
  }

  // 15. Seed Files (40 rows)
  console.log('📁 Seeding Files...')
  const fileNames = [
    'brand_logo_guidelines.pdf',
    'neon_database_schema_v2.png',
    'figma_workspace_mockup.fig',
    'contractor_outlay_report.xlsx',
    'marketing_milestones.pdf',
    'website_copywriting_draft.docx',
    'tax_statement_2025.pdf',
    'vantage_architecture.png',
    'checkout_conversions.xlsx',
    'terms_and_conditions.docx',
  ]
  const mimeTypes = [
    'application/pdf',
    'image/png',
    'application/octet-stream',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]

  for (let i = 0; i < 40; i++) {
    const client = clientRows[i]
    const project = projectRows[i]
    const filename = fileNames[i % fileNames.length]

    await db.insert(files).values({
      userId,
      clientId: i % 2 === 0 ? client.id : null,
      projectId: i % 2 === 0 ? project.id : null,
      name: filename,
      url: `https://vantage-bucket.s3.amazonaws.com/uploads/${userId}/${filename}`,
      sizeBytes: 1024 * 200 + (i % 5) * 500000,
      mimeType: mimeTypes[i % mimeTypes.length],
      folder: i % 3 === 0 ? 'Design' : i % 3 === 1 ? 'Finance' : 'root',
    })
  }

  // 16. Seed Notifications (40 rows)
  console.log('🔔 Seeding Notifications...')
  const notifTitles = [
    'Invoice Paid',
    'Proposal Signed',
    'New Task Assigned',
    'Client Sent Message',
    'Contract Milestone Completed',
    'Project Nearing Budget Cap',
    'Time Log Approved',
  ]
  const notifBodies = [
    'Invoice INV-2026-1004 has been marked as paid by ach.',
    'Globe Corp signed the project architecture proposal.',
    'Task "Style dashboard metrics" was assigned to your pipeline.',
    'Umbrella Corp contact left a message in their portal.',
    'The Figma project contract was marked as completed.',
    'Active project utilization has reached 85% of fixed price budget.',
    'You logged 4.5 hours of billable coding successfully.',
  ]

  for (let i = 0; i < 40; i++) {
    await db.insert(notifications).values({
      userId,
      type: i % 3 === 0 ? 'billing' : i % 3 === 1 ? 'task' : 'portal',
      title: notifTitles[i % notifTitles.length],
      body: notifBodies[i % notifBodies.length],
      isRead: i % 4 === 0,
      actionUrl: i % 3 === 0 ? '/invoices' : i % 3 === 1 ? '/projects' : '/portals',
      createdAt: new Date(Date.now() - i * 4 * 60 * 60 * 1000),
    })
  }

  // 17. Invalidate dashboard cache for the seeded user
  console.log('🧹 Invalidating dashboard Redis cache...')
  try {
    const { getRedisClient } = await import('#/server/redis')
    const redis = getRedisClient()
    await redis.del(`dashboard:${userId}`)
    console.log('✅ Redis cache invalidated.')
  } catch (err) {
    console.warn('⚠️ Redis cache invalidation skipped.', err)
  }

  console.log('🎉 Database seeding completed successfully with 40 rows per table!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seeding failed with error:', err)
  process.exit(1)
})
