# Vantage — API Server Functions Reference

Vantage operates strictly on **TanStack Start Server Functions** (RPCs) which replace REST/GraphQL endpoints. All inputs are validated via Zod schemas prior to database evaluation.

---

## 1. Authentication & Onboarding

### `getCurrentUser`
- **Method**: `GET`
- **Input**: None
- **Returns**: `SafeUser | null`
- **Description**: Returns the active session profile or null.

### `registerUser`
- **Method**: `POST`
- **Validator**: `registerSchema`
- **Input**: `{ email, name, password }`
- **Returns**: `{ success: boolean, user: User }`
- **Description**: Registers a user and issues a session cookie.

### `loginUser`
- **Method**: `POST`
- **Validator**: `loginSchema`
- **Input**: `{ email, password }`
- **Returns**: `{ success: boolean, user: User }`

### `completeOnboarding`
- **Method**: `POST`
- **Validator**: `onboardingSchema`
- **Input**: `{ businessName, currency, timezone, freelancerType, clientName, clientEmail, hourlyRate }`
- **Returns**: `{ success: boolean, clientId: string, projectId: string }`
- **Description**: Sets user configuration and spins up initial demo client and project.

---

## 2. Clients & CRM Pipeline

### `getClients`
- **Method**: `GET`
- **Input**: `{ search?: string, status?: string }`
- **Returns**: `Client[]`

### `getClientDetail`
- **Method**: `GET`
- **Input**: `{ id: string }`
- **Returns**: `Client & { contacts: Contact[], projects: Project[], invoices: Invoice[] }`

### `createClient`
- **Method**: `POST`
- **Validator**: `clientSchema`
- **Input**: Client fields
- **Returns**: `Client`

### `updateDealStatus`
- **Method**: `POST`
- **Input**: `{ id: string, status: 'lead'|'proposal'|'negotiation'|'won'|'lost', lostReason?: string }`
- **Returns**: `Deal`
- **Description**: Updates deal column stage. If set to `won`, automatically spins up a project.

---

## 3. Projects, Tasks, and Time tracking

### `createProject`
- **Method**: `POST`
- **Validator**: `projectSchema`
- **Input**: Project parameters
- **Returns**: `Project`

### `createTask`
- **Method**: `POST`
- **Validator**: `taskSchema`
- **Input**: Task parameters
- **Returns**: `Task`

### `createTimeEntry`
- **Method**: `POST`
- **Validator**: `timeEntrySchema`
- **Input**: Time log details (including start/end times and duration)
- **Returns**: `TimeEntry`

---

## 4. Invoicing & Billing

### `createInvoice`
- **Method**: `POST`
- **Validator**: `invoiceSchema`
- **Input**: `{ clientId, projectId, invoiceNumber, issueDate, dueDate, taxRate, discountAmount, currency, items: { description, quantity, unitPrice, type }[] }`
- **Returns**: `Invoice`
- **Description**: Creates an invoice and maps children invoice items. Calculates totals and tax values live.

### `recordInvoicePayment`
- **Method**: `POST`
- **Input**: `{ id: string, paymentMethod: string, notes?: string }`
- **Returns**: `Invoice`
- **Description**: Sets invoice status to `paid`, logs timestamp, and increments the associated client's `totalRevenue` automatically.

---

## 5. Client Portals

### `getPublicPortalData`
- **Method**: `GET`
- **Input**: `{ slug: string }`
- **Returns**: `{ portal: Portal, freelancer: FreelancerInfo, client: Client, activeProjects: Project[], activeInvoices: Invoice[] }`
- **Description**: Returns shared workspace details to client portals based on configurations. Public route.
