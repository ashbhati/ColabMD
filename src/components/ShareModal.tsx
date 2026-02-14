'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface Share {
  id: string
  user_id: string | null
  share_token: string | null
  invited_email?: string | null
  permission: 'view' | 'edit' | 'comment'
  profiles?: {
    email: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface ShareModalProps {
  documentId: string
  isOpen: boolean
  onClose: () => void
}

export function ShareModal({ documentId, isOpen, onClose }: ShareModalProps) {
  const [shares, setShares] = useState<Share[]>([])
  const [pendingInvites, setPendingInvites] = useState<Share[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<'view' | 'edit' | 'comment'>('view')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [linkShare, setLinkShare] = useState<{ token: string; permission: string } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchShares()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, documentId])

  const fetchShares = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/documents/${documentId}/share`)
      if (response.ok) {
        const data = await response.json()
        setShares(data.filter((s: Share) => s.user_id))
        setPendingInvites(data.filter((s: Share) => !s.user_id && !!s.invited_email))
        const link = data.find((s: Share) => s.share_token)
        if (link) {
          setLinkShare({ token: link.share_token, permission: link.permission })
        }
      }
    } catch {
      console.error('Failed to fetch shares')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/documents/${documentId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, permission }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to share document')
        return
      }

      const data = await response.json()

      if (data.share_token && data.permission) {
        setLinkShare({ token: data.share_token, permission: data.permission })
      }

      if (data.pending_invite_email) {
        setNotice(`Invite link created for ${data.pending_invite_email}. Share the link below so they can sign in with Google and join.`)
      }

      setEmail('')
      fetchShares()
    } catch {
      setError('Failed to share document')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateLink = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/documents/${documentId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'link', permission }),
      })

      if (response.ok) {
        const data = await response.json()
        setLinkShare({ token: data.share_token, permission: data.permission })
      }
    } catch {
      console.error('Failed to create share link')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveShare = async (shareId: string) => {
    try {
      await fetch(`/api/documents/${documentId}/share?shareId=${shareId}`, {
        method: 'DELETE',
      })
      setShares(shares.filter((s) => s.id !== shareId))
    } catch {
      console.error('Failed to remove share')
    }
  }

  const copyLink = () => {
    if (linkShare) {
      navigator.clipboard.writeText(`${window.location.origin}/share/${linkShare.token}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Share Document</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Share by email */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Invite by email</h3>
            <form onSubmit={handleShare} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as typeof permission)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="view">Can view</option>
                <option value="comment">Can comment</option>
                <option value="edit">Can edit</option>
              </select>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Sharing...' : 'Share'}
              </button>
            </form>
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            {notice && (
              <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{notice}</p>
            )}
          </div>

          {/* Link sharing */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Share via link</h3>
            {linkShare ? (
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <input
                  type="text"
                  value={`${window.location.origin}/share/${linkShare.token}`}
                  readOnly
                  className="flex-1 bg-transparent text-sm text-slate-600 dark:text-slate-400 truncate"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">{linkShare.permission}</span>
                <button
                  onClick={copyLink}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    copied
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800'
                  )}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            ) : (
              <button
                onClick={handleCreateLink}
                disabled={isSubmitting}
                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Create shareable link
              </button>
            )}
          </div>

          {/* Current shares */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">People with access</h3>
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              </div>
            ) : shares.length === 0 && pendingInvites.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                Only you have access to this document
              </p>
            ) : (
              <div className="space-y-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {share.profiles?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={share.profiles.avatar_url}
                          alt="User avatar"
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium">
                          {share.profiles?.display_name?.[0] || share.profiles?.email?.[0] || '?'}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {share.profiles?.display_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{share.profiles?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">{share.permission}</span>
                      <button
                        onClick={() => handleRemoveShare(share.id)}
                        className="text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 transition-colors"
                        title="Remove access"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pendingInvites.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Pending invites
                </p>
                {pendingInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {invite.invited_email}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Awaiting first sign in</p>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">{invite.permission}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
