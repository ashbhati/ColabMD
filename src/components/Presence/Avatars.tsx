'use client'

import { useEffect, useMemo, useState } from 'react'
import { useOthers, useSelf } from '../../../liveblocks.config'

const MAX_OTHERS = 3
const ACTIVE_WINDOW_MS = 60000

function getPresenceStatus(lastActiveAt?: number) {
  if (!lastActiveAt) {
    return 'active'
  }
  return Date.now() - lastActiveAt <= ACTIVE_WINDOW_MS ? 'active' : 'idle'
}

export function Avatars() {
  const others = useOthers()
  const self = useSelf()
  const [now, setNow] = useState(() => Date.now())

  // Deduplicate the current user in case Liveblocks reports the same user twice (e.g., due to multiple sessions)
  const filteredOthers = others.filter((other) => other.id !== self?.id)

  const hasMoreUsers = filteredOthers.length > MAX_OTHERS
  const visibleOthers = filteredOthers.slice(0, MAX_OTHERS)
  const visibleNames = useMemo(() => {
    return visibleOthers.map((user) => {
      const status = getPresenceStatus(user.presence?.lastActiveAt)
      return {
        connectionId: user.connectionId,
        name: user.info?.name || 'Anonymous',
        status,
        color: user.info?.color || '#94a3b8',
      }
    })
  }, [visibleOthers, now])

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 15000)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center -space-x-2">
        {visibleOthers.map((user) => {
          const status = getPresenceStatus(user.presence?.lastActiveAt)
          return (
            <div
              key={user.connectionId}
              className="relative"
              title={`${user.info?.name || 'Anonymous'} (${status})`}
            >
              {user.info?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.info.avatar}
                  alt={user.info.name || 'User avatar'}
                  className="h-8 w-8 rounded-full ring-2 ring-white"
                  style={{ borderColor: user.info?.color || '#94a3b8' }}
                />
              ) : (
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-white text-white text-xs font-medium"
                  style={{ backgroundColor: user.info?.color || '#888' }}
                >
                  {user.info?.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${status === 'active' ? 'bg-emerald-500' : 'bg-amber-400'}`}
                title={status === 'active' ? 'Active now' : 'Idle'}
              />
            </div>
          )
        })}

        {hasMoreUsers && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 ring-2 ring-white text-xs font-medium text-gray-600">
            +{others.length - MAX_OTHERS}
          </div>
        )}

        {/* Current user */}
        {self && (
          <div
            className="relative ml-2 border-l-2 border-gray-200 pl-2"
            title={`${self.info?.name || 'You'} (you, active)`}
          >
            {self.info?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={self.info.avatar}
                alt={self.info.name || 'Your avatar'}
                className="h-8 w-8 rounded-full ring-2"
                style={{ borderColor: self.info?.color || '#6366f1' }}
              />
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full ring-2 text-white text-xs font-medium"
                style={{
                  backgroundColor: self.info?.color || '#6366f1',
                  borderColor: self.info?.color || '#6366f1',
                }}
              >
                {self.info?.name?.[0]?.toUpperCase() || 'Y'}
              </div>
            )}
            <div
              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500"
              title="Active now"
            />
          </div>
        )}
      </div>

      <div className="hidden lg:flex items-center gap-2 text-xs">
        {visibleNames.map((user) => (
          <div
            key={user.connectionId}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 px-2 py-1 text-slate-600 dark:text-slate-300"
            title={`${user.name} (${user.status})`}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: user.color }} />
            <span className="max-w-20 truncate">{user.name}</span>
            <span className={user.status === 'active' ? 'text-emerald-500' : 'text-amber-500'}>
              {user.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
