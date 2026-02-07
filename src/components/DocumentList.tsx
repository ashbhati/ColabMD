'use client'

import { useRef, useState } from 'react'
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
  onUploadMarkdown: (file: File) => Promise<void>
  onDeleteDocument: (id: string) => Promise<void>
  onRenameDocument: (id: string, newTitle: string) => Promise<void>
  isCreating?: boolean
  isUploading?: boolean
}

export function DocumentList({
  owned,
  shared,
  onCreateDocument,
  onUploadMarkdown,
  onDeleteDocument,
  onRenameDocument,
  isCreating,
  isUploading,
}: DocumentListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const uploadInputRef = useRef<HTMLInputElement | null>(null)

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
        'group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-all duration-150 hover:border-indigo-200 dark:hover:border-indigo-900 hover:bg-slate-50 dark:hover:bg-slate-800/50',
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
            className="flex-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            autoFocus
          />
          <button
            onClick={() => handleSaveRename(doc.id)}
            className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Save
          </button>
          <button
            onClick={() => setEditingId(null)}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Cancel
          </button>
        </div>
      ) : (
        <Link href={`/doc/${doc.id}`} className="block">
          <h3 className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {doc.title}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
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
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-[10px]">
                    {doc.profiles.display_name?.[0] || '?'}
                  </span>
                )}
                <span>{doc.profiles.display_name || 'Unknown'}</span>
                <span className="text-gray-300 dark:text-gray-600">|</span>
              </span>
            )}
            <span>{formatDate(doc.updated_at)}</span>
            {doc.shared_permission && (
              <span className="rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 text-xs capitalize">
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
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
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
            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 transition-colors"
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
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">My Documents</h2>
        <div className="flex items-center gap-2">
          <input
            ref={uploadInputRef}
            type="file"
            accept=".md,.markdown,text/markdown"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0]
              if (!file) return
              await onUploadMarkdown(file)
              event.target.value = ''
            }}
          />

          <button
            onClick={() => uploadInputRef.current?.click()}
            disabled={!!isUploading}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-indigo-500 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 4v12m0-12l-3 3m3-3l3 3" />
                </svg>
                Upload Markdown
              </>
            )}
          </button>

          <button
            onClick={onCreateDocument}
            disabled={!!isCreating}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-indigo-500 disabled:opacity-50"
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
      </div>

      {owned.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center">
          <svg className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-4 text-slate-500 dark:text-slate-400">No documents yet</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Create your first document to get started</p>
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
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Shared with Me</h2>
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
