'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useLiveblocksExtension, FloatingComposer, FloatingThreads } from '@liveblocks/react-tiptap'
import { useThreads } from '../../../liveblocks.config'
import { Toolbar } from './Toolbar'
import { CommentsSidebar, CustomThread } from '@/components/Comments'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { htmlToMarkdown, markdownToHtml } from '@/lib/markdown'

interface EditorProps {
  /** @deprecated Document ID is managed by Liveblocks room context */
  documentId?: string
  /** Initial HTML content hydrated from Supabase */
  initialContent?: string
  /** Explicit external content sync (e.g., Google Drive refresh) */
  externalContentOverride?: string | null
  onSave?: (content: string) => void
}

export function Editor({ initialContent = '', externalContentOverride = null, onSave }: EditorProps) {
  const liveblocks = useLiveblocksExtension()
  const { threads } = useThreads()
  const [isSaving, setIsSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'wysiwyg' | 'markdown'>('wysiwyg')
  const [markdownContent, setMarkdownContent] = useState('')
  const [isCommentsSidebarOpen, setIsCommentsSidebarOpen] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)
  const hasHydratedInitialContent = useRef(false)
  const markdownContentRef = useRef('')
  const isApplyingMarkdownRef = useRef(false)
  const markdownSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const modeSwitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSyncedMarkdownRef = useRef('')
  const viewModeRef = useRef<'wysiwyg' | 'markdown'>('wysiwyg')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // History is managed by Liveblocks via Yjs
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      liveblocks,
    ],
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: cn(
          'text-slate-800 dark:text-slate-200 max-w-none focus:outline-none',
          'min-h-[500px] px-10 py-8',
          'leading-relaxed',
          // Typography styles
          '[&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:text-slate-900 [&_h1]:dark:text-slate-100 [&_h1]:mt-8 [&_h1]:mb-4',
          '[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h2]:dark:text-slate-100 [&_h2]:mt-6 [&_h2]:mb-3',
          '[&_h3]:text-xl [&_h3]:font-medium [&_h3]:text-slate-900 [&_h3]:dark:text-slate-100 [&_h3]:mt-5 [&_h3]:mb-2',
          '[&_p]:mb-4',
          '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4',
          '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4',
          '[&_li]:mb-1',
          '[&_blockquote]:border-l-4 [&_blockquote]:border-indigo-300 [&_blockquote]:dark:border-indigo-700 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_blockquote]:dark:text-slate-400 [&_blockquote]:my-4',
          '[&_code]:bg-slate-100 [&_code]:dark:bg-slate-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono',
          '[&_pre]:bg-slate-900 [&_pre]:dark:bg-slate-950 [&_pre]:text-slate-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-4',
          '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
          '[&_hr]:border-slate-200 [&_hr]:dark:border-slate-700 [&_hr]:my-8'
        ),
      },
    },
    immediatelyRender: false,
  })

  const applyMarkdownToEditor = useCallback((nextMarkdown: string) => {
    if (!editor) return true

    try {
      if (lastSyncedMarkdownRef.current === nextMarkdown) return true

      isApplyingMarkdownRef.current = true
      editor.commands.setContent(markdownToHtml(nextMarkdown), { emitUpdate: true })
      lastSyncedMarkdownRef.current = nextMarkdown
      return true
    } catch {
      setNotification('Failed to parse markdown. Please check syntax.')
      setTimeout(() => setNotification(null), 3000)
      return false
    } finally {
      isApplyingMarkdownRef.current = false
    }
  }, [editor])

  // Ensure the Supabase-backed HTML hydrates the editor/Yjs doc exactly once
  useEffect(() => {
    if (!editor || hasHydratedInitialContent.current) return

    if (initialContent && editor.isEmpty) {
      editor.commands.setContent(initialContent)
    }

    hasHydratedInitialContent.current = true
  }, [editor, initialContent])

  // Force apply externally refreshed content (e.g., Drive refresh)
  useEffect(() => {
    if (!editor || !externalContentOverride) return

    editor.commands.setContent(externalContentOverride, { emitUpdate: true })
    const syncedMarkdown = htmlToMarkdown(externalContentOverride)
    setMarkdownContent(syncedMarkdown)
    lastSyncedMarkdownRef.current = syncedMarkdown
  }, [editor, externalContentOverride])

  // View mode toggle handler
  const handleViewModeChange = useCallback((newMode: 'wysiwyg' | 'markdown') => {
    viewModeRef.current = newMode

    if (!editor) {
      setViewMode(newMode)
      return
    }

    if (modeSwitchTimerRef.current) {
      clearTimeout(modeSwitchTimerRef.current)
      modeSwitchTimerRef.current = null
    }

    if (newMode === 'markdown') {
      setViewMode(newMode)

      modeSwitchTimerRef.current = setTimeout(() => {
        if (viewModeRef.current !== 'markdown') return

        const nextMarkdown = htmlToMarkdown(editor.getHTML())
        lastSyncedMarkdownRef.current = nextMarkdown
        setMarkdownContent(nextMarkdown)
        modeSwitchTimerRef.current = null
      }, 0)
      return
    }

    // Flush pending markdown edits immediately when switching back to rich view.
    if (markdownSyncTimerRef.current) {
      clearTimeout(markdownSyncTimerRef.current)
      markdownSyncTimerRef.current = null
    }

    setViewMode(newMode)
    const pendingMarkdown = markdownContentRef.current
    modeSwitchTimerRef.current = setTimeout(() => {
      applyMarkdownToEditor(pendingMarkdown)
      modeSwitchTimerRef.current = null
    }, 0)
  }, [applyMarkdownToEditor, editor])

  useEffect(() => {
    markdownContentRef.current = markdownContent
  }, [markdownContent])

  useEffect(() => {
    viewModeRef.current = viewMode
  }, [viewMode])

  useEffect(() => {
    if (!editor) return

    if (typeof editor.on !== 'function' || typeof editor.off !== 'function') {
      return
    }

    const handleEditorUpdate = () => {
      if (viewModeRef.current !== 'markdown') return
      if (isApplyingMarkdownRef.current) return

      const nextMarkdown = htmlToMarkdown(editor.getHTML())

      if (nextMarkdown !== markdownContentRef.current) {
        lastSyncedMarkdownRef.current = nextMarkdown
        setMarkdownContent(nextMarkdown)
      }
    }

    editor.on('update', handleEditorUpdate)
    return () => {
      editor.off('update', handleEditorUpdate)
    }
  }, [editor])

  useEffect(() => {
    if (!editor || viewMode !== 'markdown') return

    if (markdownSyncTimerRef.current) {
      clearTimeout(markdownSyncTimerRef.current)
    }

    markdownSyncTimerRef.current = setTimeout(() => {
      applyMarkdownToEditor(markdownContentRef.current)
    }, 80)

    return () => {
      if (markdownSyncTimerRef.current) {
        clearTimeout(markdownSyncTimerRef.current)
      }
    }
  }, [applyMarkdownToEditor, editor, markdownContent, viewMode])

  useEffect(() => {
    return () => {
      if (markdownSyncTimerRef.current) clearTimeout(markdownSyncTimerRef.current)
      if (modeSwitchTimerRef.current) clearTimeout(modeSwitchTimerRef.current)
    }
  }, [])

  // Auto-save functionality
  const handleSave = useCallback(async () => {
    if (!editor || !onSave) return

    setIsSaving(true)
    try {
      // If in markdown mode, convert to HTML first
      const html = viewMode === 'markdown'
        ? markdownToHtml(markdownContent)
        : editor.getHTML()
      await onSave(html)
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }, [editor, onSave, viewMode, markdownContent])

  // Auto-save every 30 seconds if content has changed
  useEffect(() => {
    if (!editor) return

    const interval = setInterval(() => {
      if (editor.isEmpty) return
      handleSave()
    }, 30000)

    return () => clearInterval(interval)
  }, [editor, handleSave])

  // Save on Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  // Open sidebar when clicking on comment marks
  useEffect(() => {
    if (!editor) return

    const handleEditorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      // Check if clicked on a thread mark
      if (target.closest('.lb-tiptap-thread-mark')) {
        setIsCommentsSidebarOpen(true)
      }
    }

    const editorElement = editor.view.dom
    editorElement.addEventListener('click', handleEditorClick)

    return () => {
      editorElement.removeEventListener('click', handleEditorClick)
    }
  }, [editor])

  // Handle add comment button click
  const handleAddComment = useCallback(() => {
    if (!editor) return

    const { from, to } = editor.state.selection
    if (from === to) {
      // No selection - show non-blocking notification
      setNotification('Select text in the document to add a comment')
      setTimeout(() => setNotification(null), 3000)
      return
    }

    // Trigger Liveblocks comment composer
    try {
      const result = editor.commands.addPendingComment()
      if (!result) {
        console.warn('addPendingComment command returned false')
      }
    } catch (error) {
      console.error('Failed to add pending comment:', error)
      setNotification('Failed to add comment. Please try again.')
      setTimeout(() => setNotification(null), 3000)
    }
  }, [editor])

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="relative">
      <div className={cn(
        'transition-[padding-right] duration-300 ease-in-out',
        isCommentsSidebarOpen ? 'pr-80' : 'pr-0'
      )}>
        <Toolbar
          editor={editor}
          isSaving={isSaving}
          onSave={handleSave}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          isCommentsSidebarOpen={isCommentsSidebarOpen}
          onToggleCommentsSidebar={() => setIsCommentsSidebarOpen(!isCommentsSidebarOpen)}
          commentCount={threads.length}
        />

        {viewMode === 'wysiwyg' ? (
          <div className="relative mt-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <EditorContent editor={editor} />

            <FloatingComposer editor={editor} style={{ width: 350 }} />
            <FloatingThreads editor={editor} threads={threads} style={{ width: 350 }} components={{ Thread: CustomThread }} />
          </div>
        ) : (
          <textarea
            value={markdownContent}
            onChange={(e) => setMarkdownContent(e.target.value)}
            className="w-full min-h-[500px] px-10 py-8 font-mono text-sm leading-relaxed
                     bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200
                     border border-slate-200 dark:border-slate-800 rounded-xl
                     focus:outline-none resize-none mt-3"
            spellCheck={false}
          />
        )}
      </div>

      <CommentsSidebar
        isOpen={isCommentsSidebarOpen}
        onClose={() => setIsCommentsSidebarOpen(false)}
        onAddComment={handleAddComment}
      />

      {/* Non-blocking notification */}
      {notification && (
        <div
          role="alert"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 text-sm rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {notification}
        </div>
      )}
    </div>
  )
}
