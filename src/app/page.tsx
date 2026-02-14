'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Auth'
import { Header } from '@/components/Header'
import { DocumentList } from '@/components/DocumentList'
import { LoginButton } from '@/components/Auth'
import { markdownToHtml } from '@/lib/markdown'

interface Document {
  id: string
  title: string
  updated_at: string
  owner_id: string
  profiles?: {
    display_name: string | null
    avatar_url: string | null
  }
  shared_permission?: string
}

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [documents, setDocuments] = useState<{ owned: Document[]; shared: Document[] }>({
    owned: [],
    shared: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isImportingDrive, setIsImportingDrive] = useState(false)

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch('/api/documents')
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchDocuments()
    } else if (!loading) {
      setIsLoading(false)
    }
  }, [user, loading, fetchDocuments])

  const handleCreateDocument = async () => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Document' }),
      })

      if (response.ok) {
        const doc = await response.json()
        router.push(`/doc/${doc.id}`)
      }
    } catch (error) {
      console.error('Failed to create document:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteDocument = async (id: string) => {
    try {
      const response = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setDocuments((prev) => ({
          ...prev,
          owned: prev.owned.filter((d) => d.id !== id),
        }))
      }
    } catch (error) {
      console.error('Failed to delete document:', error)
    }
  }

  const handleRenameDocument = async (id: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      })

      if (response.ok) {
        setDocuments((prev) => ({
          ...prev,
          owned: prev.owned.map((d) => (d.id === id ? { ...d, title: newTitle } : d)),
        }))
      }
    } catch (error) {
      console.error('Failed to rename document:', error)
    }
  }

  const handleUploadMarkdown = async (file: File) => {
    setIsUploading(true)
    try {
      const markdownContent = await file.text()
      const title = file.name.replace(/\.[^.]+$/, '') || 'Untitled Document'

      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: markdownToHtml(markdownContent),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to upload markdown')
      }

      const doc = await response.json()
      router.push(`/doc/${doc.id}`)
    } catch (error) {
      console.error('Failed to upload markdown:', error)
      alert('Failed to upload markdown file.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleImportFromGoogleDrive = async () => {
    const fileUrl = prompt('Paste a Google Drive file URL for a markdown (.md/.markdown) file')
    if (!fileUrl) return

    setIsImportingDrive(true)
    try {
      const response = await fetch('/api/integrations/google-drive/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl }),
      })

      const data = await response.json()
      if (!response.ok || !data?.documentId) {
        throw new Error(data?.error || 'Failed to import from Google Drive')
      }

      router.push(`/doc/${data.documentId}`)
    } catch (error) {
      console.error('Failed to import from Google Drive:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      alert(`Google Drive import failed: ${message}`)
    } finally {
      setIsImportingDrive(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-lg">
                CM
              </div>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4 tracking-tight">ColabMD</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
              A collaborative markdown editor with real-time co-editing, inline comments, and seamless sharing.
            </p>
            <div className="flex justify-center">
              <LoginButton />
            </div>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mb-4">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">Real-time Collaboration</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Edit documents together with live cursors and presence indicators.</p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mb-4">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">Inline Comments</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Add comments to specific text selections and discuss changes inline.</p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mb-4">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">Easy Sharing</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Share documents with view, comment, or edit permissions.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <DocumentList
          owned={documents.owned}
          shared={documents.shared}
          onCreateDocument={handleCreateDocument}
          onUploadMarkdown={handleUploadMarkdown}
          onImportFromGoogleDrive={handleImportFromGoogleDrive}
          onDeleteDocument={handleDeleteDocument}
          onRenameDocument={handleRenameDocument}
          isCreating={isCreating}
          isUploading={isUploading}
          isImportingDrive={isImportingDrive}
        />
      </main>
    </div>
  )
}
