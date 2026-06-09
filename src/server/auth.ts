import bcrypt from 'bcryptjs'
import { eq, and, gte } from 'drizzle-orm'
import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server'
import { redirect } from '@tanstack/react-router'
import { db } from './db'
import { users, sessions } from './db/schema'
import { getRedisClient } from './redis'

const SESSION_COOKIE_NAME = 'vantage_session'
const SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000 // 14 days

export type SafeUser = {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  plan: 'free' | 'pro'
  timezone: string
  currency: string
  businessName: string | null
  businessLogoUrl: string | null
  businessAddress: string | null
  onboardingCompleted: boolean
  createdAt: Date
}

export type UserSession = {
  id: string
  userId: string
  expiresAt: Date
}

// Retry helper for transient database network issues (e.g. ECONNRESET)
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 300): Promise<T> {
  let lastErr: any
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err: any) {
      lastErr = err
      const errCode = err?.code || (err?.cause as any)?.code || ''
      const isNetworkError =
        errCode === 'ECONNRESET' ||
        errCode === 'ETIMEDOUT' ||
        errCode === 'ECONNREFUSED' ||
        errCode === 'EPIPE' ||
        err?.message?.includes('disconnected') ||
        err?.message?.includes('socket') ||
        err?.message?.includes('network')

      if (isNetworkError && i < retries - 1) {
        console.warn(
          `⚠️ Database query failed (${errCode || err.message}). Retrying in ${delayMs}ms (attempt ${i + 1}/${retries})...`
        )
        await new Promise((resolve) => setTimeout(resolve, delayMs))
        continue
      }
      throw err
    }
  }
  throw lastErr
}

// 1. Password Helpers
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// 2. Session Management
export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const token =
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  await withRetry(() =>
    db.insert(sessions).values({
      id: token,
      userId,
      expiresAt,
      ipAddress,
      userAgent,
    })
  )

  // Set httpOnly cookie
  setCookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_MS / 1000,
  })

  return token
}

export async function deleteSession(sessionId: string): Promise<void> {
  try {
    const redis = getRedisClient()
    await redis.del(`session:${sessionId}`)
  } catch (err) {
    console.warn('⚠️ Redis delete session failed:', err)
  }
  await withRetry(() => db.delete(sessions).where(eq(sessions.id, sessionId)))
  deleteCookie(SESSION_COOKIE_NAME)
}

// 3. Retrieve Session
export async function getSession(): Promise<{ user: SafeUser; session: UserSession } | null> {
  const token = getCookie(SESSION_COOKIE_NAME)
  if (!token) return null

  let cached: string | null = null
  try {
    const redis = getRedisClient()
    cached = await redis.get(`session:${token}`)
  } catch (err) {
    console.warn('⚠️ Redis get session failed. Falling back to DB query.', err)
  }

  if (cached) {
    try {
      const data = JSON.parse(cached)
      return {
        user: { ...data.user, createdAt: new Date(data.user.createdAt) },
        session: { ...data.session, expiresAt: new Date(data.session.expiresAt) },
      }
    } catch {
      // JSON parse error, ignore cache and fetch from DB
    }
  }

  // Fetch session and user
  let results: any[]
  try {
    results = await withRetry(() =>
      db
        .select({
          session: {
            id: sessions.id,
            userId: sessions.userId,
            expiresAt: sessions.expiresAt,
          },
          user: {
            id: users.id,
            email: users.email,
            name: users.name,
            avatarUrl: users.avatarUrl,
            plan: users.plan,
            timezone: users.timezone,
            currency: users.currency,
            businessName: users.businessName,
            businessLogoUrl: users.businessLogoUrl,
            businessAddress: users.businessAddress,
            onboardingCompleted: users.onboardingCompleted,
            createdAt: users.createdAt,
          },
        })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(and(eq(sessions.id, token), gte(sessions.expiresAt, new Date())))
        .limit(1)
    )
  } catch (err) {
    console.error('❌ Failed to fetch session from database:', err)
    return null
  }

  if (results.length === 0) {
    // Session invalid or expired
    deleteCookie(SESSION_COOKIE_NAME)
    return null
  }

  const { user, session } = results[0]

  // Cache in Redis for 5 minutes
  try {
    const redis = getRedisClient()
    await redis.set(`session:${token}`, JSON.stringify({ user, session }), 'EX', 300)
  } catch (err) {
    console.warn('⚠️ Redis cache session write failed:', err)
  }

  return { user, session }
}

// 4. Require Authentication Guard
export async function requireAuth(): Promise<{ user: SafeUser; session: UserSession }> {
  const auth = await getSession()
  if (!auth) {
    throw redirect({
      to: '/login',
    })
  }
  return auth
}
