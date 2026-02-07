'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface SharedDocument {
  id: string
  title: string
  content: string | null
  updated_at: string
}

export default function SharePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const [document, setDocument] = useState<SharedDocument | null>(null)
  const [permission, setPermission] = useState<'view' | 'comment' | 'edit' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function handleShare() {
      const supabase = createClient()

      // Check if user is logged in first
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        try {
          const response = await fetch(`/api/share/access?token=${encodeURIComponent(token)}`)

          if (!response.ok) {
            const data = await response.json()
            setError(data.error || 'Invalid or expired share link')
            setLoading(false)
            return
          }

          const data = await response.json()
          setDocument(data.document)
          setPermission(data.permission)
          setLoading(false)
          return
        } catch {
          setError('Failed to access shared document')
          setLoading(false)
          return
        }
      }

      // Use server-side API to redeem the share token
      try {
        const response = await fetch('/api/share/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        if (!response.ok) {
          const data = await response.json()
          setError(data.error || 'Invalid or expired share link')
          setLoading(false)
          return
        }

        const data = await response.json()
        // Redirect to the document
        router.push(`/doc/${data.documentId}`)
      } catch {
        setError('Failed to access shared document')
        setLoading(false)
      }
    }

    handleShare()
  }, [token, router])

  if (loading && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" />
          <p className="mt-4 text-gray-600">Accessing shared document...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">{error}</h2>
          <p className="mt-2 text-gray-600">This link may have been revoked or never existed.</p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!document) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <h1 className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
            {document.title}
          </h1>
          <span className="rounded-full bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 capitalize">
            {permission || 'view'}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <article className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{document.title}</h2>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Shared view for guests. Sign in to collaborate.
            </p>
          </div>
          <div
            className="prose prose-slate dark:prose-invert max-w-none px-8 py-8"
            dangerouslySetInnerHTML={{ __html: document.content || '<p>No content yet.</p>' }}
          />
        </article>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => router.push(`/login?next=/share/${encodeURIComponent(token)}`)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            Sign in to collaborate
          </button>
          <button
            onClick={() => router.push('/')}
            className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Back to home
          </button>
        </div>
      </main>
    </div>
  )
}
