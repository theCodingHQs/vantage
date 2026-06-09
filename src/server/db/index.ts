import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_N30amcTkZugd@ep-weathered-pine-aqhsdfp6-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

// Avoid connection pool leaks during HMR in development by utilizing a global singleton
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined
}

// Disable prepared statements for Neon pooler. Set max connections to 1 in dev/serverless context to prevent connection limits.
const client =
  globalForDb.conn ??
  postgres(connectionString, {
    prepare: false,
    max: 1,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForDb.conn = client
}

export const db = drizzle(client, { schema })
export type Db = typeof db
export * from './schema'
