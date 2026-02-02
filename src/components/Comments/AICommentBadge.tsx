'use client'

import { cn } from '@/lib/utils'

interface AICommentBadgeProps {
  confidence?: number
  category?: 'grammar' | 'style' | 'clarity' | 'factual' | 'suggestion' | 'question'
  suggestedAction?: 'accept' | 'reject' | 'review' | 'none'
  reasoning?: string
  className?: string
}

const categoryLabels: Record<string, string> = {
  grammar: 'Grammar',
  style: 'Style',
  clarity: 'Clarity',
  factual: 'Factual',
  suggestion: 'Suggestion',
  question: 'Question',
}

const actionLabels: Record<string, string> = {
  accept: 'Consider accepting',
  reject: 'Consider rejecting',
  review: 'Needs review',
  none: '',
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
  if (confidence >= 0.5) return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
  return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
}

export function AICommentBadge({
  confidence,
  category,
  suggestedAction,
  reasoning,
  className,
}: AICommentBadgeProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5 mb-2', className)}>
      {/* AI Badge */}
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-900 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300">
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
        </svg>
        AI
      </span>

      {/* Confidence Score */}
      {confidence !== undefined && (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
            getConfidenceColor(confidence)
          )}
          title={`Confidence: ${Math.round(confidence * 100)}%`}
        >
          {Math.round(confidence * 100)}%
        </span>
      )}

      {/* Category */}
      {category && categoryLabels[category] && (
        <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
          {categoryLabels[category]}
        </span>
      )}

      {/* Suggested Action */}
      {suggestedAction && suggestedAction !== 'none' && actionLabels[suggestedAction] && (
        <span className="inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300">
          {actionLabels[suggestedAction]}
        </span>
      )}

      {/* Reasoning tooltip */}
      {reasoning && (
        <span
          className="inline-flex items-center text-slate-400 dark:text-slate-500 cursor-help"
          title={reasoning}
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </span>
      )}
    </div>
  )
}
