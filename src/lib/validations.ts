import { z } from 'zod'

// 1. Auth & Onboarding
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const onboardingSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  currency: z.string().default('USD'),
  timezone: z.string().default('UTC'),
  freelancerType: z.string().min(1, 'Please select your business type'),
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Valid client email is required'),
  hourlyRate: z.string().or(z.number()).transform(v => typeof v === 'string' ? parseFloat(v) || 0 : v).default(0),
})

// 2. Client CRM
export const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  avatarUrl: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'prospect']).default('prospect'),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
})

// 3. Deal Pipeline
export const dealSchema = z.object({
  clientId: z.string().uuid('Please select a valid client'),
  title: z.string().min(1, 'Deal title is required'),
  value: z.string().or(z.number()).transform(v => typeof v === 'string' ? parseFloat(v) || 0 : v).default(0),
  currency: z.string().default('USD'),
  status: z.enum(['lead', 'proposal', 'negotiation', 'won', 'lost']).default('lead'),
  probability: z.number().min(0).max(100).default(50),
  expectedCloseDate: z.string().optional().nullable().transform(v => v ? new Date(v) : null),
  notes: z.string().optional().or(z.literal('')),
  lostReason: z.string().optional().or(z.literal('')),
})

// 4. Projects & Tasks
export const projectSchema = z.object({
  clientId: z.string().uuid('Please select a valid client'),
  dealId: z.string().uuid().optional().nullable(),
  title: z.string().min(1, 'Project title is required'),
  description: z.string().optional().or(z.literal('')),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).default('planning'),
  type: z.enum(['fixed', 'hourly', 'retainer']).default('fixed'),
  budget: z.string().or(z.number()).transform(v => typeof v === 'string' ? parseFloat(v) || 0 : v).default(0),
  hourlyRate: z.string().or(z.number()).transform(v => typeof v === 'string' ? parseFloat(v) || 0 : v).default(0),
  startDate: z.string().optional().nullable().transform(v => v ? new Date(v) : null),
  dueDate: z.string().optional().nullable().transform(v => v ? new Date(v) : null),
  isBillable: z.boolean().default(true),
})

export const taskSchema = z.object({
  projectId: z.string().uuid('Please select a project'),
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional().or(z.literal('')),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assigneeNotes: z.string().optional().or(z.literal('')),
  dueDate: z.string().optional().nullable().transform(v => v ? new Date(v) : null),
  estimatedHours: z.string().or(z.number()).optional().nullable().transform(v => typeof v === 'string' ? parseFloat(v) || 0 : v),
  actualHours: z.string().or(z.number()).optional().nullable().transform(v => typeof v === 'string' ? parseFloat(v) || 0 : v),
})

// 5. Time Tracking
export const timeEntrySchema = z.object({
  projectId: z.string().uuid('Please select a project'),
  taskId: z.string().uuid().optional().nullable(),
  description: z.string().min(1, 'Description is required'),
  startedAt: z.string().transform(v => new Date(v)),
  endedAt: z.string().optional().nullable().transform(v => v ? new Date(v) : null),
  durationMinutes: z.number().int().min(1, 'Duration must be at least 1 minute'),
  isBillable: z.boolean().default(true),
  hourlyRate: z.string().or(z.number()).transform(v => typeof v === 'string' ? parseFloat(v) || 0 : v).default(0),
})

// 6. Expenses
export const expenseSchema = z.object({
  projectId: z.string().uuid().optional().nullable(),
  clientId: z.string().uuid().optional().nullable(),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional().or(z.literal('')),
  amount: z.string().or(z.number()).transform(v => typeof v === 'string' ? parseFloat(v) || 0 : v).default(0),
  currency: z.string().default('USD'),
  date: z.string().transform(v => new Date(v)),
  isBillable: z.boolean().default(false),
  receiptUrl: z.string().optional().or(z.literal('')),
})

// 7. Invoices
export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.string().or(z.number()).transform(v => typeof v === 'string' ? parseFloat(v) || 1 : v),
  unitPrice: z.string().or(z.number()).transform(v => typeof v === 'string' ? parseFloat(v) || 0 : v),
  type: z.enum(['service', 'time', 'expense', 'product']).default('service'),
})

export const invoiceSchema = z.object({
  clientId: z.string().uuid('Please select a client'),
  projectId: z.string().uuid().optional().nullable(),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  issueDate: z.string().transform(v => new Date(v)),
  dueDate: z.string().transform(v => new Date(v)),
  taxRate: z.string().or(z.number()).transform(v => typeof v === 'string' ? parseFloat(v) || 0 : v).default(0),
  discountAmount: z.string().or(z.number()).transform(v => typeof v === 'string' ? parseFloat(v) || 0 : v).default(0),
  currency: z.string().default('USD'),
  notes: z.string().optional().or(z.literal('')),
  items: z.array(invoiceItemSchema).min(1, 'At least one line item is required'),
})

// 8. Proposals
export const proposalSchema = z.object({
  clientId: z.string().uuid('Please select a client'),
  title: z.string().min(1, 'Proposal title is required'),
  validUntil: z.string().optional().nullable().transform(v => v ? new Date(v) : null),
  totalValue: z.string().or(z.number()).transform(v => typeof v === 'string' ? parseFloat(v) || 0 : v).default(0),
  contentJson: z.any(), // Structure blocks
})

// 9. Client Portal Settings
export const clientPortalSchema = z.object({
  clientId: z.string().uuid(),
  slug: z.string().min(3, 'Slug must be at least 3 characters'),
  isActive: z.boolean().default(true),
  password: z.string().optional().nullable().or(z.literal('')),
  showProjects: z.boolean().default(true),
  showInvoices: z.boolean().default(true),
  showFiles: z.boolean().default(true),
  showMessages: z.boolean().default(true),
  customMessage: z.string().optional().or(z.literal('')),
})

// 10. Content Calendar
export const contentCalendarSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  platform: z.enum(['twitter', 'linkedin', 'instagram', 'youtube', 'blog', 'other']),
  status: z.enum(['idea', 'drafting', 'scheduled', 'published', 'archived']).default('idea'),
  content: z.string().optional().or(z.literal('')),
  mediaUrls: z.array(z.string()).default([]),
  scheduledAt: z.string().optional().nullable().transform(v => v ? new Date(v) : null),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional().or(z.literal('')),
})
