# Vantage — Freelancer & Solopreneur Operating System

> "Vantage gives freelancers and solopreneurs the edge — one workspace to run your entire business, professionally."

Vantage is a premium, self-hostable, full-stack digital workspace designed to replace Notion, Toggl, Monday, FreshBooks, and social media post planners. Built on TanStack Start with PostgreSQL, Drizzle ORM, and Redis, it delivers server-side rendering, strict Type-safety, custom session auth, and real-time dashboard analytics.

---

## Technical Stack

- **Frontend & Routing**: [TanStack Start](https://tanstack.com/start) (React 19, isomorphic server functions, file-based routing)
- **Styling**: Tailwind CSS v4 (dark-first Refined Utility tokens)
- **Database**: PostgreSQL (hosted on Neon)
- **Database ORM**: [Drizzle ORM](https://orm.drizzle.team)
- **Key-Value Cache**: Redis (Upstash)
- **Authentication**: Custom session-backed HttpOnly cookies (cached in Redis)
- **Validation**: Zod (strict client and server boundaries)
- **Charts**: Recharts (for finance, utilization, and margins)
- **State Management**: Zustand (for persistent timer widget)

---

## Local Development Setup

### 1. Clone & Install Dependencies
```powershell
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (refer to `.env.example`):
```env
DATABASE_URL="postgresql://neondb_owner:npg_N30amcTkZugd@ep-weathered-pine-aqhsdfp6-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
REDIS_URL="rediss://default:gQAAAAAAAWe0AAIgcDJlMTlkNTQ4ZTZkZTg0Yzg4YTAyMTVmMDUxMTkyMTMzMg@up-shad-92084.upstash.io:6379"
BETTER_AUTH_SECRET="f2a1b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0"
RESEND_API_KEY="re_mock_api_key_vantage_for_development"
APP_URL="http://localhost:3000"
```

### 3. Apply Database Migrations
Push the database schema directly to your Postgres instance:
```powershell
npx drizzle-kit push
```

### 4. Start Local Development Server
```powershell
npm run dev
```
Open `http://localhost:3000` to view the onboarding wizard and access your workspace.

---

## Folder Layout

```
vantage/
├── src/
│   ├── routes/              # TanStack File-based Routes
│   │   ├── _auth/           # Guest authentication routes
│   │   ├── _app/            # Authenticated layout-wrapped routes
│   │   │   ├── dashboard/   # Revenue charts, activity timeline
│   │   │   ├── clients/     # CRM Kanban boards
│   │   │   ├── projects/    # Tasks checklists
│   │   │   ├── time/        # Live timer timesheets
│   │   │   ├── invoices/    # Invoicing line items
│   │   │   ├── expenses/    # Outlays categorization
│   │   │   ├── proposals/   # Rich proposal builders
│   │   │   ├── portals/     # Branded sharing preferences
│   │   │   ├── content/     # Marketing calendar month-view
│   │   │   ├── reports/     # Margins & Aging
│   │   │   └── settings/    # Profile, currencies, JSON backups
│   │   └── portal/          # Public client portal
│   ├── components/
│   │   ├── ui/              # Reusable Button, Input, Modal, Table
│   │   ├── layout/          # Collapsible Sidebar, Headers, PageShells
│   │   └── forms/           # CRM Client, Project contract, Time logging
│   ├── server/
│   │   ├── db/              # Schema mapping & database connection
│   │   ├── auth.ts          # Hashing, cookie setup, session caches
│   │   ├── email.ts         # Social/onboarding email drafts (Resend)
│   │   └── functions/       # Isomorphic TanStack server RPCs
│   ├── lib/
│   │   ├── utils.ts         # Currency/relative date formats
│   │   └── timerStore.ts    # Zustand timer persistence
│   └── styles.css           # Tailwind v4 theme variables
├── app.config.ts            # Start configurations
└── package.json
```

---

## Deploying to Production

Vantage is optimized for deployment to **Vercel**, **Railway**, **Fly.io**, or **Docker** containers.

1. Set the target server preset in `app.config.ts` (e.g. `vercel` or `node` for VPS).
2. Configure all environment variables in your deployment dashboard.
3. Build the production build:
   ```bash
   npm run build
   ```
4. Start the server (VPS):
   ```bash
   node dist/server/server.js
   ```
