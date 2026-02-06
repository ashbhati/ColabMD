'use client'

import { useOthers, useSelf } from '../../../liveblocks.config'

const MAX_OTHERS = 3

export function Avatars() {
  const others = useOthers()
  const self = useSelf()

  // Deduplicate the current user in case Liveblocks reports the same user twice (e.g., due to multiple sessions)
  const filteredOthers = others.filter((other) => other.id !== self?.id)

  const hasMoreUsers = filteredOthers.length > MAX_OTHERS
  const visibleOthers = filteredOthers.slice(0, MAX_OTHERS)

  return (
    <div className="flex items-center -space-x-2">
      {visibleOthers.map((user) => (
        <div
          key={user.connectionId}
          className="relative"
          title={user.info?.name || 'Anonymous'}
        >
          {user.info?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.info.avatar}
              alt={user.info.name || 'User avatar'}
              className="h-8 w-8 rounded-full ring-2 ring-white"
              style={{ borderColor: user.info.color }}
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
            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500"
            title="Online"
          />
        </div>
      ))}

      {hasMoreUsers && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 ring-2 ring-white text-xs font-medium text-gray-600">
          +{others.length - MAX_OTHERS}
        </div>
      )}

      {/* Current user */}
      {self && (
        <div
          className="relative ml-2 border-l-2 border-gray-200 pl-2"
          title={`${self.info?.name || 'You'} (you)`}
        >
          {self.info?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={self.info.avatar}
              alt={self.info.name || 'Your avatar'}
              className="h-8 w-8 rounded-full ring-2 ring-indigo-500"
            />
          ) : (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-indigo-500 text-white text-xs font-medium"
              style={{ backgroundColor: self.info?.color || '#6366f1' }}
            >
              {self.info?.name?.[0]?.toUpperCase() || 'Y'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
