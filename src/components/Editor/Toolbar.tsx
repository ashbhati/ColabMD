'use client'

import { Editor } from '@tiptap/react'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/Tooltip'

interface ToolbarProps {
  editor: Editor
  isSaving?: boolean
  onSave?: () => void
  viewMode: 'wysiwyg' | 'markdown'
  onViewModeChange: (mode: 'wysiwyg' | 'markdown') => void
  isCommentsSidebarOpen?: boolean
  onToggleCommentsSidebar?: () => void
  commentCount?: number
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  children: React.ReactNode
  title?: string
  shortcut?: string
}

function ToolbarButton({ onClick, isActive, disabled, children, title, shortcut }: ToolbarButtonProps) {
  const button = (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-md p-1.5 transition-all duration-150',
        isActive
          ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  )

  if (!title) return button

  return (
    <Tooltip content={title} shortcut={shortcut}>
      {button}
    </Tooltip>
  )
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" />
}

export function Toolbar({
  editor,
  isSaving,
  onSave,
  viewMode,
  onViewModeChange,
  isCommentsSidebarOpen,
  onToggleCommentsSidebar,
  commentCount
}: ToolbarProps) {
  return (
    <div className="sticky top-16 z-30 flex items-center gap-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-1.5 py-1">
      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold"
        shortcut="⌘B"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic"
        shortcut="⌘I"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4h4m-2 0l-4 16m0 0h4" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {/* Horizontal strikethrough line */}
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16" />
          {/* Letter "S" shape representing text */}
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="Inline code"
        shortcut="⌘E"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      </ToolbarButton>

      <Divider />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
        shortcut="⌘⌥1"
      >
        <span className="text-sm font-bold">H1</span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
        shortcut="⌘⌥2"
      >
        <span className="text-sm font-bold">H2</span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
        shortcut="⌘⌥3"
      >
        <span className="text-sm font-bold">H3</span>
      </ToolbarButton>

      <Divider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet list"
        shortcut="⌘⇧8"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          <circle cx="2" cy="6" r="1" fill="currentColor" />
          <circle cx="2" cy="12" r="1" fill="currentColor" />
          <circle cx="2" cy="18" r="1" fill="currentColor" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered list"
        shortcut="⌘⇧7"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h13M7 12h13M7 18h13" />
          <text x="2" y="8" fontSize="8" fill="currentColor">1</text>
          <text x="2" y="14" fontSize="8" fill="currentColor">2</text>
          <text x="2" y="20" fontSize="8" fill="currentColor">3</text>
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Quote"
        shortcut="⌘⇧B"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        title="Code block"
        shortcut="⌘⌥C"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth={2} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10l-2 2 2 2m4-4l2 2-2 2" />
        </svg>
      </ToolbarButton>

      <Divider />

      {/* Horizontal rule */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal rule"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16" />
        </svg>
      </ToolbarButton>

      <Divider />

      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
        shortcut="⌘Z"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
        shortcut="⌘⇧Z"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
        </svg>
      </ToolbarButton>

      <Divider />

      {/* Comments sidebar toggle */}
      <div className="relative">
        <ToolbarButton
          onClick={() => onToggleCommentsSidebar?.()}
          isActive={isCommentsSidebarOpen}
          title="Toggle comments sidebar"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </ToolbarButton>
        {commentCount !== undefined && commentCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-indigo-500 text-[10px] font-bold text-white flex items-center justify-center pointer-events-none">
            {commentCount > 9 ? '9+' : commentCount}
          </span>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* View Mode Toggle */}
      <div className="flex items-center rounded-md bg-slate-100 dark:bg-slate-800 p-0.5">
        <Tooltip content="Rich Text View">
          <button
            onClick={() => onViewModeChange('wysiwyg')}
            className={cn(
              'rounded px-2 py-1 text-xs font-medium transition-colors',
              viewMode === 'wysiwyg'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            )}
          >
            Rich
          </button>
        </Tooltip>
        <Tooltip content="Markdown Source">
          <button
            onClick={() => onViewModeChange('markdown')}
            className={cn(
              'rounded px-2 py-1 text-xs font-medium transition-colors',
              viewMode === 'markdown'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            )}
          >
            MD
          </button>
        </Tooltip>
      </div>

      <Divider />

      {/* Save status */}
      {onSave && (
        <Tooltip content={isSaving ? "Saving..." : "Save document"} shortcut="⌘S">
          <button
            onClick={onSave}
            disabled={isSaving}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150',
              isSaving
                ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-400 dark:hover:bg-indigo-900'
            )}
          >
            {isSaving ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save
              </>
            )}
          </button>
        </Tooltip>
      )}
    </div>
  )
}
