import { db } from './db'
import { users } from './db/schema'

async function run() {
  console.log('Testing DB connection...')
  try {
    const allUsers = await db.select().from(users).limit(1)
    console.log('✅ Connection successful. User count limit 1:', allUsers.length)
  } catch (err: any) {
    console.error('❌ Connection failed:', err.message)
  }
  process.exit(0)
}

run()
