'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useLiveblocksExtension, FloatingComposer, FloatingThreads } from '@liveblocks/react-tiptap'
import { useThreads } from '../../../liveblocks.config'
import { Toolbar } from './Toolbar'
import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface EditorProps {
  documentId: string
  initialContent?: string
  onSave?: (content: string) => void
}

export function Editor({ onSave }: EditorProps) {
  const liveblocks = useLiveblocksExtension()
  const { threads } = useThreads()
  const [isSaving, setIsSaving] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      liveblocks,
    ],
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-slate max-w-none focus:outline-none',
          'min-h-[500px] px-8 py-6'
        ),
      },
    },
    immediatelyRender: false,
  })

  // Auto-save functionality
  const handleSave = useCallback(async () => {
    if (!editor || !onSave) return

    setIsSaving(true)
    try {
      const html = editor.getHTML()
      await onSave(html)
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }, [editor, onSave])

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

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="relative">
      <Toolbar editor={editor} isSaving={isSaving} onSave={handleSave} />

      <div className="relative mt-4 rounded-lg border bg-white shadow-sm">
        <EditorContent editor={editor} />

        <FloatingComposer editor={editor} style={{ width: 350 }} />
        <FloatingThreads editor={editor} threads={threads} style={{ width: 350 }} />
      </div>
    </div>
  )
}
