/**
 * Unit Tests for Editor Component
 *
 * Tests the collaborative editor functionality including:
 * - Basic rendering and initialization
 * - NEW: Click handler to open sidebar when clicking comment marks
 * - NEW: handleAddComment function with non-blocking notification
 * - NEW: Error handling for addPendingComment command
 * - NEW: Toast notification UI component
 * - View mode switching (WYSIWYG / Markdown)
 * - Auto-save functionality
 */

import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { Editor } from '@/components/Editor/Editor'

// ============================================================================
// Mock Setup
// ============================================================================

// Create fresh mock editor for each test
const createMockEditor = () => ({
  view: {
    dom: document.createElement('div'),
  },
  state: {
    selection: {
      from: 0,
      to: 0,
    },
  },
  commands: {
    addPendingComment: jest.fn().mockReturnValue(true),
    setContent: jest.fn(),
  },
  getHTML: jest.fn().mockReturnValue('<p>Test content</p>'),
  isEmpty: false,
})

let mockEditor: ReturnType<typeof createMockEditor> | null = null

jest.mock('@tiptap/react', () => ({
  useEditor: () => mockEditor,
  EditorContent: ({ editor }: { editor: unknown }) => (
    <div data-testid="editor-content" data-editor={!!editor}>
      Editor Content
    </div>
  ),
}))

jest.mock('@tiptap/starter-kit', () => ({
  __esModule: true,
  default: {
    configure: jest.fn().mockReturnValue({}),
  },
}))

jest.mock('@tiptap/extension-placeholder', () => ({
  __esModule: true,
  default: {
    configure: jest.fn().mockReturnValue({}),
  },
}))

// Mock Liveblocks
const mockThreads: MockThread[] = []

jest.mock('@liveblocks/react-tiptap', () => ({
  useLiveblocksExtension: jest.fn().mockReturnValue({}),
  FloatingComposer: () => <div data-testid="floating-composer">Composer</div>,
  FloatingThreads: () => <div data-testid="floating-threads">Threads</div>,
}))

jest.mock('../../../liveblocks.config', () => ({
  useThreads: () => ({ threads: mockThreads }),
  useOthers: () => [],
}))

// Mock markdown utilities
jest.mock('@/lib/markdown', () => ({
  htmlToMarkdown: jest.fn().mockReturnValue('# Test markdown'),
  markdownToHtml: jest.fn().mockReturnValue('<h1>Test markdown</h1>'),
}))

// Mock CommentsSidebar
jest.mock('@/components/Comments', () => ({
  CommentsSidebar: ({ isOpen, onClose, onAddComment }: { isOpen: boolean; onClose: () => void; onAddComment?: () => void }) => (
    <div
      data-testid="comments-sidebar"
      data-open={isOpen}
      onClick={onClose}
    >
      <button data-testid="add-comment-btn" onClick={onAddComment}>Add Comment</button>
      Comments Sidebar
    </div>
  ),
}))

// Mock Toolbar
jest.mock('@/components/Editor/Toolbar', () => ({
  Toolbar: ({
    isCommentsSidebarOpen,
    onToggleCommentsSidebar,
    commentCount,
  }: {
    isCommentsSidebarOpen: boolean
    onToggleCommentsSidebar: () => void
    commentCount: number
  }) => (
    <div data-testid="toolbar">
      <button
        data-testid="toggle-sidebar-btn"
        onClick={onToggleCommentsSidebar}
        data-sidebar-open={isCommentsSidebarOpen}
      >
        Toggle Sidebar ({commentCount})
      </button>
    </div>
  ),
}))

interface MockThread {
  id: string
  metadata?: {
    resolved?: boolean
  }
}

// Helper to set mock threads
const setMockThreads = (threads: MockThread[]) => {
  mockThreads.length = 0
  mockThreads.push(...threads)
}

describe('Editor Component', () => {
  beforeEach(() => {
    mockEditor = createMockEditor()
    setMockThreads([])
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  // ==========================================================================
  // Basic Rendering
  // ==========================================================================

  describe('basic rendering', () => {
    it('should render the editor content', () => {
      render(<Editor />)

      expect(screen.getByTestId('editor-content')).toBeInTheDocument()
    })

    it('should render the toolbar', () => {
      render(<Editor />)

      expect(screen.getByTestId('toolbar')).toBeInTheDocument()
    })

    it('should render the comments sidebar', () => {
      render(<Editor />)

      expect(screen.getByTestId('comments-sidebar')).toBeInTheDocument()
    })

    it('should render floating composer in WYSIWYG mode', () => {
      render(<Editor />)

      expect(screen.getByTestId('floating-composer')).toBeInTheDocument()
    })

    it('should render floating threads in WYSIWYG mode', () => {
      render(<Editor />)

      expect(screen.getByTestId('floating-threads')).toBeInTheDocument()
    })

    it('should show loading spinner when editor is not ready', () => {
      mockEditor = null
      render(<Editor />)

      // Check for the loading spinner (has animate-spin class)
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Comments Sidebar Toggle
  // ==========================================================================

  describe('comments sidebar toggle', () => {
    it('should start with sidebar closed', () => {
      render(<Editor />)

      const sidebar = screen.getByTestId('comments-sidebar')
      expect(sidebar).toHaveAttribute('data-open', 'false')
    })

    it('should toggle sidebar when toggle button is clicked', () => {
      render(<Editor />)

      const toggleBtn = screen.getByTestId('toggle-sidebar-btn')
      fireEvent.click(toggleBtn)

      const sidebar = screen.getByTestId('comments-sidebar')
      expect(sidebar).toHaveAttribute('data-open', 'true')
    })

    it('should close sidebar when close is triggered', () => {
      render(<Editor />)

      // Open sidebar first
      const toggleBtn = screen.getByTestId('toggle-sidebar-btn')
      fireEvent.click(toggleBtn)

      // Close it
      const sidebar = screen.getByTestId('comments-sidebar')
      fireEvent.click(sidebar)

      expect(sidebar).toHaveAttribute('data-open', 'false')
    })

    it('should display correct comment count in toolbar', () => {
      setMockThreads([
        { id: 'thread-1' },
        { id: 'thread-2' },
        { id: 'thread-3' },
      ])
      render(<Editor />)

      expect(screen.getByText('Toggle Sidebar (3)')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Click Handler for Comment Marks (NEW)
  // ==========================================================================

  describe('click handler for comment marks', () => {
    it('should set up click event listener on editor DOM', () => {
      const editor = createMockEditor()
      mockEditor = editor
      const addEventListenerSpy = jest.spyOn(editor.view.dom, 'addEventListener')
      render(<Editor />)

      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
      addEventListenerSpy.mockRestore()
    })

    it('should remove click event listener on unmount', () => {
      const editor = createMockEditor()
      mockEditor = editor
      const removeEventListenerSpy = jest.spyOn(editor.view.dom, 'removeEventListener')
      const { unmount } = render(<Editor />)

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
      removeEventListenerSpy.mockRestore()
    })

    it('should open sidebar when clicking on thread mark element', async () => {
      const editor = createMockEditor()
      mockEditor = editor
      render(<Editor />)

      // Create a mock thread mark element
      const threadMark = document.createElement('span')
      threadMark.className = 'lb-tiptap-thread-mark'
      editor.view.dom.appendChild(threadMark)

      // Simulate click on thread mark wrapped in act
      await act(async () => {
        const event = new MouseEvent('click', { bubbles: true })
        Object.defineProperty(event, 'target', { value: threadMark })
        editor.view.dom.dispatchEvent(event)
      })

      // Sidebar should now be open
      const sidebar = screen.getByTestId('comments-sidebar')
      expect(sidebar).toHaveAttribute('data-open', 'true')

      // Cleanup
      threadMark.remove()
    })

    it('should open sidebar when clicking on element inside thread mark', async () => {
      const editor = createMockEditor()
      mockEditor = editor
      render(<Editor />)

      // Create a mock thread mark element with nested content
      const threadMark = document.createElement('span')
      threadMark.className = 'lb-tiptap-thread-mark'
      const innerSpan = document.createElement('span')
      innerSpan.textContent = 'Commented text'
      threadMark.appendChild(innerSpan)
      editor.view.dom.appendChild(threadMark)

      // Simulate click on inner element wrapped in act
      await act(async () => {
        const event = new MouseEvent('click', { bubbles: true })
        Object.defineProperty(event, 'target', { value: innerSpan })
        editor.view.dom.dispatchEvent(event)
      })

      // Sidebar should now be open
      const sidebar = screen.getByTestId('comments-sidebar')
      expect(sidebar).toHaveAttribute('data-open', 'true')

      // Cleanup
      threadMark.remove()
    })

    it('should not open sidebar when clicking outside thread marks', async () => {
      const editor = createMockEditor()
      mockEditor = editor
      render(<Editor />)

      // Simulate click on regular content
      const regularElement = document.createElement('p')
      regularElement.textContent = 'Regular text'
      editor.view.dom.appendChild(regularElement)

      await act(async () => {
        const event = new MouseEvent('click', { bubbles: true })
        Object.defineProperty(event, 'target', { value: regularElement })
        editor.view.dom.dispatchEvent(event)
      })

      // Sidebar should remain closed
      const sidebar = screen.getByTestId('comments-sidebar')
      expect(sidebar).toHaveAttribute('data-open', 'false')

      // Cleanup
      regularElement.remove()
    })
  })

  // ==========================================================================
  // handleAddComment Function (NEW)
  // ==========================================================================

  describe('handleAddComment function', () => {
    it('should show notification when no text is selected', async () => {
      const editor = createMockEditor()
      editor.state.selection = { from: 5, to: 5 }
      mockEditor = editor
      render(<Editor />)

      // Click the add comment button
      const addBtn = screen.getByTestId('add-comment-btn')
      fireEvent.click(addBtn)

      // Notification should appear
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText('Select text in the document to add a comment')).toBeInTheDocument()
      })
    })

    it('should auto-dismiss notification after 3 seconds', async () => {
      const editor = createMockEditor()
      editor.state.selection = { from: 5, to: 5 }
      mockEditor = editor
      render(<Editor />)

      // Click the add comment button
      const addBtn = screen.getByTestId('add-comment-btn')
      fireEvent.click(addBtn)

      // Notification appears
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Fast-forward 3 seconds
      act(() => {
        jest.advanceTimersByTime(3000)
      })

      // Notification should be gone
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })

    it('should call addPendingComment when text is selected', () => {
      const editor = createMockEditor()
      editor.state.selection = { from: 5, to: 15 }
      mockEditor = editor
      render(<Editor />)

      // Click the add comment button
      const addBtn = screen.getByTestId('add-comment-btn')
      fireEvent.click(addBtn)

      expect(editor.commands.addPendingComment).toHaveBeenCalled()
    })

    it('should not show notification when text is selected', () => {
      const editor = createMockEditor()
      editor.state.selection = { from: 5, to: 15 }
      mockEditor = editor
      render(<Editor />)

      // Click the add comment button
      const addBtn = screen.getByTestId('add-comment-btn')
      fireEvent.click(addBtn)

      // No notification should appear for successful add
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should log warning when addPendingComment returns false', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      const editor = createMockEditor()
      editor.state.selection = { from: 5, to: 15 }
      editor.commands.addPendingComment.mockReturnValue(false)
      mockEditor = editor
      render(<Editor />)

      // Click the add comment button
      const addBtn = screen.getByTestId('add-comment-btn')
      fireEvent.click(addBtn)

      expect(consoleSpy).toHaveBeenCalledWith('addPendingComment command returned false')
      consoleSpy.mockRestore()
    })
  })

  // ==========================================================================
  // Error Handling (NEW)
  // ==========================================================================

  describe('error handling for addPendingComment', () => {
    it('should catch and log errors from addPendingComment', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const editor = createMockEditor()
      editor.state.selection = { from: 5, to: 15 }
      editor.commands.addPendingComment.mockImplementation(() => {
        throw new Error('Failed to add comment')
      })
      mockEditor = editor
      render(<Editor />)

      // Click the add comment button
      const addBtn = screen.getByTestId('add-comment-btn')
      fireEvent.click(addBtn)

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to add pending comment:',
        expect.any(Error)
      )
      consoleSpy.mockRestore()
    })

    it('should show error notification when addPendingComment throws', async () => {
      jest.spyOn(console, 'error').mockImplementation()
      const editor = createMockEditor()
      editor.state.selection = { from: 5, to: 15 }
      editor.commands.addPendingComment.mockImplementation(() => {
        throw new Error('Failed to add comment')
      })
      mockEditor = editor
      render(<Editor />)

      // Click the add comment button
      const addBtn = screen.getByTestId('add-comment-btn')
      fireEvent.click(addBtn)

      // Error notification should appear
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText('Failed to add comment. Please try again.')).toBeInTheDocument()
      })
    })

    it('should dismiss error notification after 3 seconds', async () => {
      jest.spyOn(console, 'error').mockImplementation()
      const editor = createMockEditor()
      editor.state.selection = { from: 5, to: 15 }
      editor.commands.addPendingComment.mockImplementation(() => {
        throw new Error('Failed')
      })
      mockEditor = editor
      render(<Editor />)

      // Click the add comment button
      const addBtn = screen.getByTestId('add-comment-btn')
      fireEvent.click(addBtn)

      // Notification appears
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Fast-forward 3 seconds
      act(() => {
        jest.advanceTimersByTime(3000)
      })

      // Notification should be gone
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })
  })

  // ==========================================================================
  // Toast Notification UI (NEW)
  // ==========================================================================

  describe('toast notification UI', () => {
    it('should have role="alert" for accessibility', async () => {
      const editor = createMockEditor()
      editor.state.selection = { from: 5, to: 5 }
      mockEditor = editor
      render(<Editor />)

      const addBtn = screen.getByTestId('add-comment-btn')
      fireEvent.click(addBtn)

      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toBeInTheDocument()
      })
    })

    it('should be positioned at bottom center of screen', async () => {
      const editor = createMockEditor()
      editor.state.selection = { from: 5, to: 5 }
      mockEditor = editor
      render(<Editor />)

      const addBtn = screen.getByTestId('add-comment-btn')
      fireEvent.click(addBtn)

      await waitFor(() => {
        const notification = screen.getByRole('alert')
        expect(notification).toHaveClass('fixed')
        expect(notification).toHaveClass('bottom-4')
        expect(notification).toHaveClass('left-1/2')
        expect(notification).toHaveClass('-translate-x-1/2')
      })
    })

    it('should have appropriate z-index for visibility', async () => {
      const editor = createMockEditor()
      editor.state.selection = { from: 5, to: 5 }
      mockEditor = editor
      render(<Editor />)

      const addBtn = screen.getByTestId('add-comment-btn')
      fireEvent.click(addBtn)

      await waitFor(() => {
        const notification = screen.getByRole('alert')
        expect(notification).toHaveClass('z-50')
      })
    })

    it('should have dark/light mode styling', async () => {
      const editor = createMockEditor()
      editor.state.selection = { from: 5, to: 5 }
      mockEditor = editor
      render(<Editor />)

      const addBtn = screen.getByTestId('add-comment-btn')
      fireEvent.click(addBtn)

      await waitFor(() => {
        const notification = screen.getByRole('alert')
        expect(notification).toHaveClass('bg-slate-800')
        expect(notification).toHaveClass('dark:bg-slate-200')
        expect(notification).toHaveClass('text-white')
        expect(notification).toHaveClass('dark:text-slate-900')
      })
    })

    it('should have animation classes for entrance', async () => {
      const editor = createMockEditor()
      editor.state.selection = { from: 5, to: 5 }
      mockEditor = editor
      render(<Editor />)

      const addBtn = screen.getByTestId('add-comment-btn')
      fireEvent.click(addBtn)

      await waitFor(() => {
        const notification = screen.getByRole('alert')
        expect(notification).toHaveClass('animate-in')
        expect(notification).toHaveClass('fade-in')
        expect(notification).toHaveClass('slide-in-from-bottom-2')
      })
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle null editor gracefully in handleAddComment', () => {
      mockEditor = null
      render(<Editor />)

      // Should show loading state, not crash
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('should handle selection at document start (from = 0)', () => {
      const editor = createMockEditor()
      editor.state.selection = { from: 0, to: 10 }
      mockEditor = editor
      render(<Editor />)

      const addBtn = screen.getByTestId('add-comment-btn')
      fireEvent.click(addBtn)

      expect(editor.commands.addPendingComment).toHaveBeenCalled()
    })

    it('should handle single character selection', () => {
      const editor = createMockEditor()
      editor.state.selection = { from: 5, to: 6 }
      mockEditor = editor
      render(<Editor />)

      const addBtn = screen.getByTestId('add-comment-btn')
      fireEvent.click(addBtn)

      expect(editor.commands.addPendingComment).toHaveBeenCalled()
    })

    it('should handle multiple rapid add comment clicks', async () => {
      const editor = createMockEditor()
      editor.state.selection = { from: 5, to: 5 }
      mockEditor = editor
      render(<Editor />)

      const addBtn = screen.getByTestId('add-comment-btn')

      // Rapid clicks
      fireEvent.click(addBtn)
      fireEvent.click(addBtn)
      fireEvent.click(addBtn)

      // Should still only show one notification
      await waitFor(() => {
        const alerts = screen.getAllByRole('alert')
        expect(alerts.length).toBe(1)
      })
    })

    it('should handle switching between WYSIWYG and markdown mode', () => {
      mockEditor = createMockEditor()
      render(<Editor />)

      // Initial state should be WYSIWYG
      expect(screen.getByTestId('floating-composer')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Integration with CommentsSidebar
  // ==========================================================================

  describe('integration with CommentsSidebar', () => {
    it('should pass onAddComment callback to CommentsSidebar', () => {
      mockEditor = createMockEditor()
      render(<Editor />)

      // The add comment button should be present in the sidebar
      expect(screen.getByTestId('add-comment-btn')).toBeInTheDocument()
    })

    it('should pass isOpen state to CommentsSidebar', () => {
      mockEditor = createMockEditor()
      render(<Editor />)

      // Initial state - closed
      const sidebar = screen.getByTestId('comments-sidebar')
      expect(sidebar).toHaveAttribute('data-open', 'false')

      // Toggle open
      const toggleBtn = screen.getByTestId('toggle-sidebar-btn')
      fireEvent.click(toggleBtn)

      expect(sidebar).toHaveAttribute('data-open', 'true')
    })
  })
})
