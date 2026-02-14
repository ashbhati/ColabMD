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

interface DriveDiffPreview {
  added: number
  removed: number
  changed: number
  entries: Array<{
    line: number
    before: string
    after: string
    kind: 'added' | 'removed' | 'changed'
  }>
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
  const [isRefreshingSource, setIsRefreshingSource] = useState(false)
  const [externalContentOverride, setExternalContentOverride] = useState<string | null>(null)
  const [refreshPreview, setRefreshPreview] = useState<DriveDiffPreview | null>(null)

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
      return
    }

    if (!authLoading && !user) {
      setLoading(false)
      router.push(`/login?next=${encodeURIComponent(`/doc/${documentId}`)}`)
    }
  }, [user, authLoading, documentId, router])

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

  const handleRefreshFromGoogleDrive = async () => {
    setIsRefreshingSource(true)
    try {
      const previewRes = await fetch('/api/integrations/google-drive/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      })

      const previewData = await previewRes.json()
      if (!previewRes.ok) {
        throw new Error(previewData?.error || 'Refresh failed')
      }

      if (previewData?.unchanged) {
        alert('No changes found in Google Drive source file.')
        return
      }

      if (previewData?.requiresConfirm && previewData?.diffPreview) {
        setRefreshPreview(previewData.diffPreview)
        return
      }

      const applyRes = await fetch('/api/integrations/google-drive/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, force: true }),
      })
      const applyData = await applyRes.json()
      if (!applyRes.ok) {
        throw new Error(applyData?.error || 'Refresh failed')
      }

      const latestRes = await fetch(`/api/documents/${documentId}`)
      if (latestRes.ok) {
        const latestDoc = await latestRes.json()
        setDocument(latestDoc)
        setExternalContentOverride(latestDoc.content || '')
      }
      alert('Document refreshed from Google Drive.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      alert(`Refresh failed: ${message}`)
    } finally {
      setIsRefreshingSource(false)
    }
  }

  const handleConfirmDriveOverwrite = async () => {
    setIsRefreshingSource(true)
    try {
      const applyRes = await fetch('/api/integrations/google-drive/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, force: true }),
      })

      const applyData = await applyRes.json()
      if (!applyRes.ok) {
        throw new Error(applyData?.error || 'Refresh failed')
      }

      const latestRes = await fetch(`/api/documents/${documentId}`)
      if (latestRes.ok) {
        const latestDoc = await latestRes.json()
        setDocument(latestDoc)
        setExternalContentOverride(latestDoc.content || '')
      }

      setRefreshPreview(null)
      alert('Document refreshed from Google Drive.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      alert(`Refresh failed: ${message}`)
    } finally {
      setIsRefreshingSource(false)
    }
  }

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header showBackButton />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header showBackButton />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <div className="flex flex-col items-center justify-center h-96">
            <svg className="h-12 w-12 text-slate-300 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="mt-4 text-lg font-medium text-slate-800 dark:text-slate-200">{error}</h2>
            <button
              onClick={() => router.push('/')}
              className="mt-4 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
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
    <RoomProvider
      id={`doc:${documentId}`}
      initialPresence={{
        cursor: null,
        name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous',
        color: '#6366f1',
      }}
    >
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="text-sm font-medium text-slate-800 dark:text-slate-200 border-b-2 border-indigo-500 bg-transparent focus:outline-none"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="text-sm font-medium text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  title="Click to edit title"
                >
                  {document.title}
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <ClientSideSuspense fallback={null}>
                <Avatars />
              </ClientSideSuspense>

              {document.owner_id === user?.id && (
                <>
                  <button
                    onClick={handleRefreshFromGoogleDrive}
                    disabled={isRefreshingSource}
                    className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                  >
                    {isRefreshingSource ? 'Refreshing...' : 'Refresh from Drive'}
                  </button>

                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        <ShareModal
          documentId={documentId}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />

        {refreshPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setRefreshPreview(null)} />
            <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl mx-4">
              <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-4">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Confirm overwrite from Google Drive</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {refreshPreview.added} added, {refreshPreview.removed} removed, {refreshPreview.changed} changed lines.
                </p>
              </div>

              <div className="max-h-[50vh] overflow-y-auto p-5 space-y-2">
                {refreshPreview.entries.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No line-level diff preview available.</p>
                ) : (
                  refreshPreview.entries.map((entry) => (
                    <div key={`${entry.line}-${entry.kind}`} className="rounded-md border border-slate-200 dark:border-slate-700 p-3">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Line {entry.line} • {entry.kind}
                      </p>
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap">{entry.before || '(empty)'}</p>
                      <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 whitespace-pre-wrap">{entry.after || '(empty)'}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800 px-5 py-4">
                <button
                  onClick={() => setRefreshPreview(null)}
                  className="rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDriveOverwrite}
                  disabled={isRefreshingSource}
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {isRefreshingSource ? 'Applying...' : 'Overwrite from Drive'}
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="mx-auto max-w-5xl px-4 py-6">
          <ClientSideSuspense fallback={
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mx-auto" />
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Connecting to collaboration server...</p>
              </div>
            </div>
          }>
            <Editor
              documentId={documentId}
              initialContent={document.content || ''}
              externalContentOverride={externalContentOverride}
              onSave={handleSaveContent}
            />
          </ClientSideSuspense>
        </main>
      </div>
    </RoomProvider>
  )
}
