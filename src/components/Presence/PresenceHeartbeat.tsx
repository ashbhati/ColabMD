'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useUpdateMyPresence } from '../../../liveblocks.config'

const PRESENCE_UPDATE_THROTTLE_MS = 5000

export function PresenceHeartbeat() {
  const updateMyPresence = useUpdateMyPresence()
  const lastSentAtRef = useRef(0)

  const markActive = useCallback(() => {
    const now = Date.now()
    if (now - lastSentAtRef.current < PRESENCE_UPDATE_THROTTLE_MS) {
      return
    }
    lastSentAtRef.current = now
    updateMyPresence({ lastActiveAt: now })
  }, [updateMyPresence])

  useEffect(() => {
    markActive()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        markActive()
      }
    }

    window.addEventListener('pointerdown', markActive)
    window.addEventListener('keydown', markActive)
    window.addEventListener('scroll', markActive, { passive: true })
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pointerdown', markActive)
      window.removeEventListener('keydown', markActive)
      window.removeEventListener('scroll', markActive)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [markActive])

  return null
}
