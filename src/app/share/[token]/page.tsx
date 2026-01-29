'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function SharePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function handleShare() {
      const supabase = createClient()

      // Check if user is logged in first
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Redirect to login with return URL
        router.push(`/login?next=/share/${encodeURIComponent(token)}`)
        return
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

  return null
}
