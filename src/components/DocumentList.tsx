'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

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

interface DocumentListProps {
  owned: Document[]
  shared: Document[]
  onCreateDocument: () => Promise<void>
  onDeleteDocument: (id: string) => Promise<void>
  onRenameDocument: (id: string, newTitle: string) => Promise<void>
  isCreating?: boolean
}

export function DocumentList({
  owned,
  shared,
  onCreateDocument,
  onDeleteDocument,
  onRenameDocument,
  isCreating,
}: DocumentListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleStartRename = (doc: Document) => {
    setEditingId(doc.id)
    setEditTitle(doc.title)
  }

  const handleSaveRename = async (id: string) => {
    if (editTitle.trim()) {
      await onRenameDocument(id, editTitle.trim())
    }
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      setDeletingId(id)
      await onDeleteDocument(id)
      setDeletingId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const DocumentCard = ({ doc, isOwned }: { doc: Document; isOwned: boolean }) => (
    <div
      className={cn(
        'group relative rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md',
        deletingId === doc.id && 'opacity-50'
      )}
    >
      {editingId === doc.id ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveRename(doc.id)
              if (e.key === 'Escape') setEditingId(null)
            }}
            className="flex-1 rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
          <button
            onClick={() => handleSaveRename(doc.id)}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            Save
          </button>
          <button
            onClick={() => setEditingId(null)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      ) : (
        <Link href={`/doc/${doc.id}`} className="block">
          <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
            {doc.title}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
            {!isOwned && doc.profiles && (
              <span className="flex items-center gap-1">
                {doc.profiles.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={doc.profiles.avatar_url}
                    alt="Owner avatar"
                    className="h-4 w-4 rounded-full"
                  />
                ) : (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[10px]">
                    {doc.profiles.display_name?.[0] || '?'}
                  </span>
                )}
                <span>{doc.profiles.display_name || 'Unknown'}</span>
                <span className="text-gray-300">|</span>
              </span>
            )}
            <span>{formatDate(doc.updated_at)}</span>
            {doc.shared_permission && (
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs capitalize">
                {doc.shared_permission}
              </span>
            )}
          </div>
        </Link>
      )}

      {isOwned && editingId !== doc.id && (
        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.preventDefault()
              handleStartRename(doc)
            }}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Rename"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              handleDelete(doc.id)
            }}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
            title="Delete"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">My Documents</h2>
        <button
          onClick={onCreateDocument}
          disabled={isCreating}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {isCreating ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Document
            </>
          )}
        </button>
      </div>

      {owned.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-4 text-gray-500">No documents yet</p>
          <p className="mt-1 text-sm text-gray-400">Create your first document to get started</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {owned.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} isOwned={true} />
          ))}
        </div>
      )}

      {shared.length > 0 && (
        <>
          <h2 className="text-xl font-semibold text-gray-900">Shared with Me</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shared.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} isOwned={false} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
