'use client'
import { useState, useEffect } from 'react'

interface UserInfo {
  id: string
  name: string
  username: string
}

interface UseUserResult {
  userId: string
  userName: string
  userInfo: UserInfo | null
  loading: boolean
  error: string | null
}

const LS_KEY = 'toko_emas_user'

/**
 * Hook that fetches and caches the current single-user from /api/init.
 *
 * - On first mount, checks localStorage for a cached userId.
 * - If cache exists, returns it immediately (no loading flicker) while still
 *   re-validating in the background.
 * - On success, writes the full UserInfo to localStorage.
 *
 * Usage:
 *   const { userId, userName, loading } = useUser()
 */
export function useUser(): UseUserResult {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(() => {
    // Attempt to hydrate from localStorage synchronously on first render
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) return JSON.parse(raw) as UserInfo
    } catch {
      // ignore parse errors
    }
    return null
  })
  const [loading, setLoading] = useState<boolean>(!userInfo) // already cached → no spinner
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const r = await fetch('/api/init')
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const data: UserInfo = await r.json()
        if (!cancelled) {
          setUserInfo(data)
          setError(null)
          try {
            localStorage.setItem(LS_KEY, JSON.stringify(data))
          } catch {
            // localStorage may be unavailable in some contexts
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load user')
          // If we have a cached value, keep using it — don't clear it
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => { cancelled = true }
  }, [])

  return {
    userId: userInfo?.id ?? '',
    userName: userInfo?.name ?? '',
    userInfo,
    loading,
    error,
  }
}

/**
 * Clears the localStorage cache for the current user.
 * Useful during development or if the server user changes.
 */
export function clearUserCache(): void {
  try {
    localStorage.removeItem(LS_KEY)
  } catch {
    // ignore
  }
}
