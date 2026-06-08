import { pgTable, uuid, text, timestamp, boolean, integer, numeric, jsonb, bigint } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// 1. Users Table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').unique().notNull(),
  name: text('name'),
  passwordHash: text('password_hash').notNull(),
  avatarUrl: text('avatar_url'),
  plan: text('plan', { enum: ['free', 'pro'] }).default('free').notNull(),
  timezone: text('timezone').default('UTC').notNull(),
  currency: text('currency').default('USD').notNull(),
  businessName: text('business_name'),
  businessLogoUrl: text('business_logo_url'),
  businessAddress: text('business_address'),
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 2. Sessions Table
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 3. Clients Table
export const clients = pgTable('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  company: text('company'),
  website: text('website'),
  avatarUrl: text('avatar_url'),
  status: text('status', { enum: ['active', 'inactive', 'prospect'] }).default('prospect').notNull(),
  tags: jsonb('tags').$type<any>().default('[]').notNull(), // string array stored as JSONB
  notes: text('notes'),
  address: text('address'),
  totalRevenue: numeric('total_revenue', { precision: 12, scale: 2 }).default('0').notNull(),
  totalProjects: integer('total_projects').default(0).notNull(),
  lastContactAt: timestamp('last_contact_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 4. Contacts Table
export const contacts = pgTable('contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  role: text('role'),
  isPrimary: boolean('is_primary').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 5. Deals Table
export const deals = pgTable('deals', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  value: numeric('value', { precision: 12, scale: 2 }).default('0').notNull(),
  currency: text('currency').default('USD').notNull(),
  status: text('status', { enum: ['lead', 'proposal', 'negotiation', 'won', 'lost'] }).default('lead').notNull(),
  probability: integer('probability').default(0).notNull(),
  expectedCloseDate: timestamp('expected_close_date'),
  notes: text('notes'),
  lostReason: text('lost_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 6. Projects Table
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }).notNull(),
  dealId: uuid('deal_id').references(() => deals.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', { enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'] }).default('planning').notNull(),
  type: text('type', { enum: ['fixed', 'hourly', 'retainer'] }).default('fixed').notNull(),
  budget: numeric('budget', { precision: 12, scale: 2 }).default('0').notNull(),
  hourlyRate: numeric('hourly_rate', { precision: 10, scale: 2 }).default('0').notNull(),
  startDate: timestamp('start_date'),
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  isBillable: boolean('is_billable').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 7. Tasks Table
export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', { enum: ['todo', 'in_progress', 'review', 'done'] }).default('todo').notNull(),
  priority: text('priority', { enum: ['low', 'medium', 'high', 'urgent'] }).default('medium').notNull(),
  assigneeNotes: text('assignee_notes'),
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  estimatedHours: numeric('estimated_hours', { precision: 6, scale: 2 }),
  actualHours: numeric('actual_hours', { precision: 6, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 8. Time Entries Table
export const timeEntries = pgTable('time_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  description: text('description'),
  startedAt: timestamp('started_at').notNull(),
  endedAt: timestamp('ended_at'),
  durationMinutes: integer('duration_minutes').default(0).notNull(),
  isBillable: boolean('is_billable').default(true).notNull(),
  hourlyRate: numeric('hourly_rate', { precision: 10, scale: 2 }).default('0').notNull(),
  isInvoiced: boolean('is_invoiced').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 9. Invoices Table
export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }).notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
  invoiceNumber: text('invoice_number').notNull(),
  status: text('status', { enum: ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'] }).default('draft').notNull(),
  issueDate: timestamp('issue_date').notNull(),
  dueDate: timestamp('due_date').notNull(),
  paidAt: timestamp('paid_at'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).default('0').notNull(),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('0').notNull(),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).default('0').notNull(),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).default('0').notNull(),
  total: numeric('total', { precision: 12, scale: 2 }).default('0').notNull(),
  currency: text('currency').default('USD').notNull(),
  notes: text('notes'),
  paymentMethod: text('payment_method'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 10. Invoice Items Table
export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }).notNull(),
  description: text('description').notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).default('1').notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).default('0').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).default('0').notNull(),
  type: text('type', { enum: ['service', 'time', 'expense', 'product'] }).default('service').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 11. Expenses Table
export const expenses = pgTable('expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
  category: text('category').notNull(), // Software, Travel, Equipment, Contractor, Marketing, Other
  description: text('description'),
  amount: numeric('amount', { precision: 12, scale: 2 }).default('0').notNull(),
  currency: text('currency').default('USD').notNull(),
  date: timestamp('date').notNull(),
  isBillable: boolean('is_billable').default(false).notNull(),
  receiptUrl: text('receipt_url'),
  isInvoiced: boolean('is_invoiced').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 12. Content Calendar Table
export const contentCalendar = pgTable('content_calendar', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  platform: text('platform', { enum: ['twitter', 'linkedin', 'instagram', 'youtube', 'blog', 'other'] }).notNull(),
  status: text('status', { enum: ['idea', 'drafting', 'scheduled', 'published', 'archived'] }).default('idea').notNull(),
  content: text('content'),
  mediaUrls: jsonb('media_urls').$type<any>().default('[]').notNull(), // array of strings
  scheduledAt: timestamp('scheduled_at'),
  publishedAt: timestamp('published_at'),
  tags: jsonb('tags').$type<any>().default('[]').notNull(), // array of strings
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 13. Proposals Table
export const proposals = pgTable('proposals', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  status: text('status', { enum: ['draft', 'sent', 'viewed', 'accepted', 'declined'] }).default('draft').notNull(),
  contentJson: jsonb('content_json').$type<any>().notNull(), // Rich blocks data
  validUntil: timestamp('valid_until'),
  totalValue: numeric('total_value', { precision: 12, scale: 2 }).default('0').notNull(),
  viewedAt: timestamp('viewed_at'),
  respondedAt: timestamp('responded_at'),
  signatureUrl: text('signature_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 14. Client Portals Table
export const clientPortals = pgTable('client_portals', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }).notNull(),
  slug: text('slug').unique().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  passwordHash: text('password_hash'),
  showProjects: boolean('show_projects').default(true).notNull(),
  showInvoices: boolean('show_invoices').default(true).notNull(),
  showFiles: boolean('show_files').default(true).notNull(),
  showMessages: boolean('show_messages').default(true).notNull(),
  customMessage: text('custom_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 15. Portal Messages Table
export const portalMessages = pgTable('portal_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  portalId: uuid('portal_id').references(() => clientPortals.id, { onDelete: 'cascade' }).notNull(),
  senderType: text('sender_type', { enum: ['client', 'freelancer'] }).notNull(),
  content: text('content').notNull(),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 16. Files Table
export const files = pgTable('files', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
  mimeType: text('mime_type'),
  folder: text('folder').default('root').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 17. Notifications Table
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  actionUrl: text('action_url'),
  metadataJson: jsonb('metadata_json').$type<any>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Relational Mappings (optional for Drizzle query builder)
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  clients: many(clients),
  projects: many(projects),
  invoices: many(invoices),
  expenses: many(expenses),
  notifications: many(notifications),
}))

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, { fields: [clients.userId], references: [users.id] }),
  contacts: many(contacts),
  deals: many(deals),
  projects: many(projects),
  invoices: many(invoices),
  proposals: many(proposals),
  portals: many(clientPortals),
}))

export const clientPortalsRelations = relations(clientPortals, ({ one, many }) => ({
  client: one(clients, { fields: [clientPortals.clientId], references: [clients.id] }),
  messages: many(portalMessages),
}))

export const portalMessagesRelations = relations(portalMessages, ({ one }) => ({
  portal: one(clientPortals, { fields: [portalMessages.portalId], references: [clientPortals.id] }),
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, { fields: [projects.clientId], references: [clients.id] }),
  tasks: many(tasks),
  timeEntries: many(timeEntries),
}))

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  timeEntries: many(timeEntries),
}))

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  project: one(projects, { fields: [timeEntries.projectId], references: [projects.id] }),
  task: one(tasks, { fields: [timeEntries.taskId], references: [tasks.id] }),
}))

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, { fields: [invoices.clientId], references: [clients.id] }),
  items: many(invoiceItems),
}))

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, { fields: [invoiceItems.invoiceId], references: [invoices.id] }),
}))

export const proposalsRelations = relations(proposals, ({ one }) => ({
  user: one(users, { fields: [proposals.userId], references: [users.id] }),
  client: one(clients, { fields: [proposals.clientId], references: [clients.id] }),
}))
