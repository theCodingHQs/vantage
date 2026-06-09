'use server'

import { createServerFn } from '@tanstack/react-start'
import { loginSchema, registerSchema, onboardingSchema } from '#/lib/validations'
import { getCookie } from '@tanstack/react-start/server'

// 1. Get Current Session User
export const getCurrentUser = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const { getSession } = await import('#/server/auth')
    const auth = await getSession()
    return auth ? auth.user : null
  } catch (err) {
    console.error('Error fetching current user:', err)
    return null
  }
})

// 2. Register
export const registerUser = createServerFn({ method: 'POST' })
  .validator(registerSchema)
  .handler(async ({ data }) => {
    try {
      const { email, name, password } = data
      const { db } = await import('#/server/db')
      const { eq } = await import('drizzle-orm')
      const { users } = await import('#/server/db/schema')
      const { hashPassword, createSession } = await import('#/server/auth')

      // Check if user exists
      const existing = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
      })

      if (existing) {
        return { success: false, error: 'An account with this email already exists' }
      }

      const passwordHash = await hashPassword(password)

      const [newUser] = await db
        .insert(users)
        .values({
          email: email.toLowerCase(),
          name,
          passwordHash,
          onboardingCompleted: false,
        })
        .returning()

      // Create session
      await createSession(newUser.id)

      return { success: true, user: newUser }
    } catch (err: any) {
      console.error('Registration server error:', err)
      return { success: false, error: err.message || 'Registration failed' }
    }
  })

// 3. Login
export const loginUser = createServerFn({ method: 'POST' })
  .validator(loginSchema)
  .handler(async ({ data }) => {
    try {
      const { email, password } = data
      const { db } = await import('#/server/db')
      const { eq } = await import('drizzle-orm')
      const { users } = await import('#/server/db/schema')
      const { comparePassword, createSession } = await import('#/server/auth')

      const user = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
      })

      if (!user) {
        return { success: false, error: 'Invalid email or password' }
      }

      const isValid = await comparePassword(password, user.passwordHash)
      if (!isValid) {
        return { success: false, error: 'Invalid email or password' }
      }

      // Create session
      await createSession(user.id)

      return { success: true, user }
    } catch (err: any) {
      console.error('Login server error:', err)
      return { success: false, error: err.message || 'Invalid email or password' }
    }
  })

// 4. Logout
export const logoutUser = createServerFn({ method: 'POST' }).handler(async () => {
  try {
    const token = getCookie('vantage_session')
    if (token) {
      const { deleteSession } = await import('#/server/auth')
      await deleteSession(token)
    }
    return { success: true }
  } catch (err: any) {
    console.error('Logout server error:', err)
    return { success: false, error: err.message || 'Logout failed' }
  }
})

// 5. Onboarding Completion
export const completeOnboarding = createServerFn({ method: 'POST' })
  .validator(onboardingSchema)
  .handler(async ({ data }) => {
    try {
      const { getSession } = await import('#/server/auth')
      const auth = await getSession()
      if (!auth) {
        return { success: false, error: 'Unauthorized' }
      }

      const userId = auth.user.id
      const { db } = await import('#/server/db')
      const { eq } = await import('drizzle-orm')
      const { users, clients, projects } = await import('#/server/db/schema')

      // Update user profile
      await db
        .update(users)
        .set({
          businessName: data.businessName,
          currency: data.currency,
          timezone: data.timezone,
          onboardingCompleted: true,
        })
        .where(eq(users.id, userId))

      // Insert first client
      const [client] = await db
        .insert(clients)
        .values({
          userId,
          name: data.clientName,
          email: data.clientEmail,
          status: 'active',
          tags: JSON.stringify([data.freelancerType]),
        })
        .returning()

      // Insert first project linked to the client
      const [project] = await db
        .insert(projects)
        .values({
          userId,
          clientId: client.id,
          title: 'First Project',
          status: 'active',
          type: data.hourlyRate > 0 ? 'hourly' : 'fixed',
          hourlyRate: data.hourlyRate.toString(),
          budget: data.hourlyRate > 0 ? '0' : '1000', // Default mock fixed price
        })
        .returning()

      return { success: true, clientId: client.id, projectId: project.id }
    } catch (err: any) {
      console.error('Onboarding completion server error:', err)
      return { success: false, error: err.message || 'Onboarding failed' }
    }
  })
