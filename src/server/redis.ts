import { Redis } from 'ioredis'

const redisUrl =
  process.env.REDIS_URL ||
  'rediss://default:gQAAAAAAAWe0AAIgcDJlMTlkNTQ4ZTZkZTg0Yzg4YTAyMTVmMDUxMTkyMTMzMg@up-shad-92084.upstash.io:6379'

let redis: Redis | null = null

// Fallback in-memory store if Redis is unavailable
const memoryStore = new Map<string, string>()

class MemoryRedisFallback {
  async get(key: string): Promise<string | null> {
    return memoryStore.get(key) || null
  }
  async set(key: string, value: string, mode?: string, duration?: number): Promise<string> {
    memoryStore.set(key, value)
    if (mode === 'EX' && duration) {
      setTimeout(() => {
        memoryStore.delete(key)
      }, duration * 1000)
    }
    return 'OK'
  }
  async del(key: string): Promise<number> {
    const deleted = memoryStore.delete(key) ? 1 : 0
    return deleted
  }
  async incr(key: string): Promise<number> {
    const val = parseInt(memoryStore.get(key) || '0', 10) + 1
    memoryStore.set(key, val.toString())
    return val
  }
  async expire(key: string, seconds: number): Promise<number> {
    if (memoryStore.has(key)) {
      setTimeout(() => {
        memoryStore.delete(key)
      }, seconds * 1000)
      return 1
    }
    return 0
  }
  async ping(): Promise<string> {
    return 'PONG'
  }
}

const fallbackRedis = new MemoryRedisFallback() as unknown as Redis

try {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout: 5000,
    reconnectOnError: () => false,
  })

  redis.on('error', (err) => {
    console.warn('⚠️ Redis Connection Error. Using in-memory fallback.', err.message)
  })
} catch (err) {
  console.warn('⚠️ Failed to initialize Redis. Using in-memory fallback.', err)
}

export const getRedisClient = (): Redis => {
  if (redis && redis.status === 'ready') {
    return redis
  }
  return fallbackRedis
}

export default getRedisClient
