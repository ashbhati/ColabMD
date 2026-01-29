'use client'

import { useThreads } from '../../../liveblocks.config'
import { Thread } from '@liveblocks/react-ui'
import { cn } from '@/lib/utils'

interface CommentsSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function CommentsSidebar({ isOpen, onClose }: CommentsSidebarProps) {
  const { threads } = useThreads()

  const resolvedThreads = threads.filter((thread) => thread.metadata?.resolved)
  const unresolvedThreads = threads.filter((thread) => !thread.metadata?.resolved)

  return (
    <div
      className={cn(
        'fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 bg-white border-l shadow-lg transition-transform duration-300 z-40 overflow-y-auto',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Comments</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-4">
        {threads.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="mt-4 text-gray-500">No comments yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Select text in the editor and add a comment
            </p>
          </div>
        ) : (
          <>
            {unresolvedThreads.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Open ({unresolvedThreads.length})
                </h3>
                <div className="space-y-2">
                  {unresolvedThreads.map((thread) => (
                    <Thread key={thread.id} thread={thread} />
                  ))}
                </div>
              </div>
            )}

            {resolvedThreads.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-400 mb-2">
                  Resolved ({resolvedThreads.length})
                </h3>
                <div className="space-y-2 opacity-60">
                  {resolvedThreads.map((thread) => (
                    <Thread key={thread.id} thread={thread} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
