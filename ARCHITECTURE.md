# Vantage — System Architecture

Vantage is structured as a monolithic isomorphic application, deploying both client bundles and node server processes together.

---

## 1. System Topology

```
             ┌───────────────────────────────────────┐
             │            Web Browser                │
             └──────────────────┬────────────────────┘
                                │ (HTTP / Server Action RPCs)
                                ▼
             ┌───────────────────────────────────────┐
             │       TanStack Start (Vite/Vinxi)     │
             │                                       │
             │  ┌─────────────────┐ ┌──────────────┐ │
             │  │   Isomorphic    │ │  Server RPC  │ │
             │  │  Loader SSR     │ │  Functions  │ │
             │  └────────┬────────┘ └──────┬───────┘ │
             └───────────┼─────────────────┼─────────┘
                         │ (SQL)           │ (Cache/Session/Queue)
                         ▼                 ▼
             ┌───────────────────┐ ┌─────────────────┐
             │    PostgreSQL     │ │  Redis (Upstash)│
             │   (Neon Server)   │ │  Session/Stats│
             └───────────────────┘ └─────────────────┘
```

---

## 2. Isomorphic Loader & Server Function Pattern

Vantage utilizes **TanStack Start Isomorphic Execution Model**:

1. **Loaders**: Run on the server during SSR (Server-Side Rendering) and pre-hydrate the data. On subsequent navigations, loaders fetch via client-side fetch RPCs automatically.
2. **Server Functions**: Compiled into light RPC boundaries. Client-side components invoke them directly like standard TypeScript functions:
   ```typescript
   // In components:
   const newClient = await createClient({ data: clientPayload })
   ```
   During build, the Vite plugin strips the body of `createClient` from the client bundle and swaps it for a network request to the server, which invokes the database queries parameterized by Drizzle.

---

## 3. Custom Session Authentication Flow

We bypass heavy auth packages in favor of a robust, lightweight, cookie-based session database schema backed by **Redis**:

1. **Sign-up/Login**:
   - Verify/create user record.
   - Generate secure random token `vantage_session`.
   - Insert session token, expiration (14 days), IP, and UserAgent into Postgres `sessions` table.
   - Set an `httpOnly`, `secure`, `sameSite: lax` cookie on the client response.

2. **Session Verification (Middleware)**:
   - Client requests any route.
   - `beforeLoad` on `_app.tsx` layout boundary triggers `getCurrentUser` server function.
   - Server searches for the `vantage_session` token in **Redis**.
     - **Cache Hit**: Instantly parse JSON and resolve user object (reduces Postgres load by 90%).
     - **Cache Miss**: Search in Postgres, write to Redis with 5-minute TTL (300 seconds).
   - If session expired/not found, throw redirect to `/login`.

---

## 4. Redis Caching & Job Queues

Vantage leverages Redis for 4 core functions:

- **Session Caching**: Stores user session profiles with a 5-minute TTL.
- **Rate Limiting**: Increments hit counters per client IP address on `/login` and `/register` endpoints (maximum 10 requests per minute).
- **Dashboard Metrics Caching**: Aggregates month-over-month revenue statistics, project hours, and utilization rates, storing the output in Redis. On any invoice payment or client additions, the cache key is purged (`del("dashboard:userId")`) to reflect instant changes.
- **Job Mock Queue**: Simulates scheduling email alerts (weekly summaries, overdue invoice warnings) to run asynchronously.
