'use client'

import { useOthers } from '../../../liveblocks.config'
import { cn } from '@/lib/utils'

interface AIPresenceIndicatorProps {
  className?: string
}

export function AIPresenceIndicator({ className }: AIPresenceIndicatorProps) {
  const others = useOthers()

  // Filter for AI agents based on presence or user ID pattern
  const aiAgents = others.filter((other) => {
    return other.presence?.isAI || other.id.startsWith('ai-agent:')
  })

  if (aiAgents.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-purple-100 dark:bg-purple-900 px-2.5 py-1 text-xs font-medium text-purple-700 dark:text-purple-300',
        className
      )}
    >
      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
      </svg>
      <span>
        {aiAgents.length} AI agent{aiAgents.length !== 1 ? 's' : ''} active
      </span>

      {/* Status indicators for each AI agent */}
      <div className="flex -space-x-1 ml-1">
        {aiAgents.slice(0, 3).map((agent) => {
          const status = agent.presence?.aiStatus || 'idle'
          const statusColors: Record<string, string> = {
            idle: 'bg-slate-400',
            analyzing: 'bg-blue-500 animate-pulse',
            commenting: 'bg-purple-500 animate-pulse',
            reviewing: 'bg-amber-500 animate-pulse',
          }
          return (
            <div
              key={agent.connectionId}
              className={cn(
                'h-2 w-2 rounded-full ring-2 ring-purple-100 dark:ring-purple-900',
                statusColors[status] || statusColors.idle
              )}
              title={`AI Agent: ${status}`}
            />
          )
        })}
        {aiAgents.length > 3 && (
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-200 dark:bg-purple-800 text-[10px] font-bold text-purple-700 dark:text-purple-300">
            +{aiAgents.length - 3}
          </div>
        )}
      </div>
    </div>
  )
}
