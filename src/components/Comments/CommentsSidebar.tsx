'use client'

import { useMemo } from 'react'
import { useThreads, ThreadMetadata } from '../../../liveblocks.config'
import { Thread } from '@liveblocks/react-ui'
import { cn } from '@/lib/utils'
import { AICommentBadge } from './AICommentBadge'

interface CommentsSidebarProps {
  isOpen: boolean
  onClose: () => void
  onAddComment?: () => void
}

// Type guard for AI thread metadata
function isAIThread(metadata: ThreadMetadata | undefined): boolean {
  return metadata?.aiGenerated === true
}

export function CommentsSidebar({ isOpen, onClose, onAddComment }: CommentsSidebarProps) {
  const { threads } = useThreads()

  const { resolvedThreads, unresolvedThreads } = useMemo(() => ({
    resolvedThreads: threads.filter((thread) => thread.metadata?.resolved),
    unresolvedThreads: threads.filter((thread) => !thread.metadata?.resolved),
  }), [threads])

  return (
    <aside
      role="complementary"
      aria-label="Comments sidebar"
      aria-hidden={!isOpen}
      className={cn(
        'fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-lg transition-transform duration-300 z-40 overflow-y-auto',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Comments</h2>
        <div className="flex items-center gap-2">
          {onAddComment && (
            <button
              onClick={onAddComment}
              aria-label="Add comment to selected text"
              className="flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-400 dark:hover:bg-indigo-900 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close comments sidebar"
            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {threads.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="mt-4 text-slate-500 dark:text-slate-400">No comments yet</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              Select text in the editor and add a comment
            </p>
          </div>
        ) : (
          <>
            {unresolvedThreads.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                  Open ({unresolvedThreads.length})
                </h3>
                <div className="space-y-2">
                  {unresolvedThreads.map((thread) => {
                    const isAI = isAIThread(thread.metadata)
                    return (
                      <div
                        key={thread.id}
                        className={cn(
                          'rounded-lg',
                          isAI && 'border-l-2 border-purple-500 dark:border-purple-400 pl-2'
                        )}
                      >
                        {isAI && thread.metadata && (
                          <AICommentBadge
                            confidence={thread.metadata.aiConfidence}
                            category={thread.metadata.aiCategory}
                            suggestedAction={thread.metadata.aiSuggestedAction}
                            reasoning={thread.metadata.aiReasoning}
                          />
                        )}
                        <Thread thread={thread} showActions={true} showComposer="collapsed" showResolveAction showReactions />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {resolvedThreads.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-slate-400 dark:text-slate-500 mb-2">
                  Resolved ({resolvedThreads.length})
                </h3>
                <div className="space-y-2 opacity-60">
                  {resolvedThreads.map((thread) => {
                    const isAI = isAIThread(thread.metadata)
                    return (
                      <div
                        key={thread.id}
                        className={cn(
                          'rounded-lg',
                          isAI && 'border-l-2 border-purple-500 dark:border-purple-400 pl-2'
                        )}
                      >
                        {isAI && thread.metadata && (
                          <AICommentBadge
                            confidence={thread.metadata.aiConfidence}
                            category={thread.metadata.aiCategory}
                            suggestedAction={thread.metadata.aiSuggestedAction}
                            reasoning={thread.metadata.aiReasoning}
                          />
                        )}
                        <Thread thread={thread} showActions={true} showComposer="collapsed" showResolveAction showReactions />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  )
}
