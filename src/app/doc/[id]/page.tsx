'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { RoomProvider } from '../../../../liveblocks.config'
import { ClientSideSuspense } from '@liveblocks/react'
import { Editor } from '@/components/Editor'
import { Avatars } from '@/components/Presence'
import { Header } from '@/components/Header'
import { useAuth } from '@/components/Auth'
import { ShareModal } from '@/components/ShareModal'

interface Document {
  id: string
  title: string
  content: string | null
  owner_id: string
}

function EditorWrapper({ documentId, initialContent, onSave }: {
  documentId: string
  initialContent?: string
  onSave: (content: string) => Promise<void>
}) {
  return (
    <ClientSideSuspense fallback={
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" />
          <p className="mt-4 text-gray-500">Connecting to collaboration server...</p>
        </div>
      </div>
    }>
      <Editor
        documentId={documentId}
        initialContent={initialContent || ''}
        onSave={onSave}
      />
    </ClientSideSuspense>
  )
}

function PresenceWrapper() {
  return (
    <ClientSideSuspense fallback={null}>
      <Avatars />
    </ClientSideSuspense>
  )
}

export default function DocumentPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const documentId = params.id as string

  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  useEffect(() => {
    async function fetchDocument() {
      try {
        const response = await fetch(`/api/documents/${documentId}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('Document not found')
          } else if (response.status === 403) {
            setError('You do not have access to this document')
          } else {
            setError('Failed to load document')
          }
          return
        }
        const doc = await response.json()
        setDocument(doc)
        setTitle(doc.title)
      } catch {
        setError('Failed to load document')
      } finally {
        setLoading(false)
      }
    }

    if (user && documentId) {
      fetchDocument()
    }
  }, [user, documentId])

  const handleSaveContent = useCallback(async (content: string) => {
    try {
      await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
    } catch (error) {
      console.error('Failed to save document:', error)
    }
  }, [documentId])

  const handleSaveTitle = async () => {
    if (!title.trim()) {
      setTitle(document?.title || 'Untitled')
      setIsEditingTitle(false)
      return
    }

    try {
      await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      })
      setDocument((prev) => prev ? { ...prev, title: title.trim() } : null)
    } catch (error) {
      console.error('Failed to save title:', error)
    }
    setIsEditingTitle(false)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showBackButton />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showBackButton />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <div className="flex flex-col items-center justify-center h-96">
            <svg className="h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">{error}</h2>
            <button
              onClick={() => router.push('/')}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 transition-colors"
            >
              Go back to dashboard
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (!document) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle()
                  if (e.key === 'Escape') {
                    setTitle(document.title)
                    setIsEditingTitle(false)
                  }
                }}
                className="text-lg font-medium text-gray-900 border-b-2 border-indigo-500 bg-transparent focus:outline-none"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="text-lg font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                title="Click to edit title"
              >
                {document.title}
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <RoomProvider
              id={`doc:${documentId}`}
              initialPresence={{
                cursor: null,
                name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous',
                color: '#6366f1',
              }}
            >
              <PresenceWrapper />
            </RoomProvider>

            {document.owner_id === user?.id && (
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
            )}
          </div>
        </div>
      </header>

      <ShareModal
        documentId={documentId}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <RoomProvider
          id={`doc:${documentId}`}
          initialPresence={{
            cursor: null,
            name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous',
            color: '#6366f1',
          }}
        >
          <EditorWrapper
            documentId={documentId}
            initialContent={document.content || ''}
            onSave={handleSaveContent}
          />
        </RoomProvider>
      </main>
    </div>
  )
}
