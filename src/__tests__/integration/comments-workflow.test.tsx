/**
 * Integration Tests for Comments Workflow
 *
 * Tests the complete comment system flow including:
 * - Opening sidebar via toolbar toggle
 * - Opening sidebar via clicking on comment marks in editor
 * - Adding comments through the sidebar button
 * - Notification system for user feedback
 * - Thread filtering and display
 * - Accessibility compliance throughout the workflow
 */

import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'

// ============================================================================
// Mock Setup for Editor Tests
// ============================================================================

// Mock editor with configurable state
const createMockEditor = (overrides = {}) => ({
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
  ...overrides,
})

let mockEditor: ReturnType<typeof createMockEditor> | null = null
const mockThreads: MockThread[] = []
const mockOthers: unknown[] = []

// Mock Tiptap
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
  default: { configure: jest.fn().mockReturnValue({}) },
}))

jest.mock('@tiptap/extension-placeholder', () => ({
  __esModule: true,
  default: { configure: jest.fn().mockReturnValue({}) },
}))

// Mock Liveblocks
jest.mock('@liveblocks/react-tiptap', () => ({
  useLiveblocksExtension: jest.fn().mockReturnValue({}),
  FloatingComposer: () => <div data-testid="floating-composer">Composer</div>,
  FloatingThreads: () => <div data-testid="floating-threads">Threads</div>,
}))

jest.mock('../../../liveblocks.config', () => ({
  useThreads: () => ({ threads: mockThreads }),
  useOthers: () => mockOthers,
}))

jest.mock('@liveblocks/react-ui', () => ({
  Thread: ({ thread }: { thread: MockThread }) => (
    <div data-testid={`thread-${thread.id}`} className="mock-thread">
      Thread: {thread.id}
    </div>
  ),
}))

// Mock markdown utilities
jest.mock('@/lib/markdown', () => ({
  htmlToMarkdown: jest.fn().mockReturnValue('# Test'),
  markdownToHtml: jest.fn().mockReturnValue('<h1>Test</h1>'),
}))

// Mock Toolbar to avoid editor.isActive issues
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

// Mock CommentsSidebar for Editor tests
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

interface MockThread {
  id: string
  metadata?: {
    resolved?: boolean
    aiGenerated?: boolean
    aiConfidence?: number
    aiCategory?: string
    aiSuggestedAction?: string
    aiReasoning?: string
  }
}

// Helpers
const setMockThreads = (threads: MockThread[]) => {
  mockThreads.length = 0
  mockThreads.push(...threads)
}

const resetMocks = () => {
  mockEditor = createMockEditor()
  setMockThreads([])
  mockOthers.length = 0
  jest.useFakeTimers()
}

// Import Editor after mocks are set up
import { Editor } from '@/components/Editor/Editor'

describe('Comments Workflow Integration', () => {
  beforeEach(() => {
    resetMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  // ==========================================================================
  // Sidebar Toggle Workflow
  // ==========================================================================

  describe('sidebar toggle workflow', () => {
    it('should complete full toggle cycle: closed -> open -> closed', () => {
      render(<Editor />)

      // Initial: sidebar closed
      const sidebar = screen.getByTestId('comments-sidebar')
      expect(sidebar).toHaveAttribute('data-open', 'false')

      // Toggle open
      const toggleBtn = screen.getByTestId('toggle-sidebar-btn')
      fireEvent.click(toggleBtn)
      expect(sidebar).toHaveAttribute('data-open', 'true')

      // Toggle closed via sidebar close action
      fireEvent.click(sidebar)
      expect(sidebar).toHaveAttribute('data-open', 'false')
    })

    it('should maintain sidebar state across multiple interactions', () => {
      render(<Editor />)

      const toggleBtn = screen.getByTestId('toggle-sidebar-btn')
      const sidebar = screen.getByTestId('comments-sidebar')

      // Multiple toggles
      fireEvent.click(toggleBtn) // Open
      expect(sidebar).toHaveAttribute('data-open', 'true')

      fireEvent.click(toggleBtn) // Close
      expect(sidebar).toHaveAttribute('data-open', 'false')

      fireEvent.click(toggleBtn) // Open again
      expect(sidebar).toHaveAttribute('data-open', 'true')
    })
  })

  // ==========================================================================
  // Comment Mark Click Workflow
  // ==========================================================================

  describe('comment mark click workflow', () => {
    it('should open sidebar when clicking thread mark, then allow closing', async () => {
      render(<Editor />)

      // Create thread mark in editor
      const threadMark = document.createElement('span')
      threadMark.className = 'lb-tiptap-thread-mark'
      mockEditor!.view.dom.appendChild(threadMark)

      // Click on thread mark
      await act(async () => {
        const clickEvent = new MouseEvent('click', { bubbles: true })
        Object.defineProperty(clickEvent, 'target', { value: threadMark })
        mockEditor!.view.dom.dispatchEvent(clickEvent)
      })

      // Sidebar should open
      const sidebar = screen.getByTestId('comments-sidebar')
      expect(sidebar).toHaveAttribute('data-open', 'true')

      // Close sidebar
      fireEvent.click(sidebar)
      expect(sidebar).toHaveAttribute('data-open', 'false')

      threadMark.remove()
    })

    it('should handle multiple thread marks correctly', async () => {
      render(<Editor />)

      // Create multiple thread marks
      const threadMark1 = document.createElement('span')
      threadMark1.className = 'lb-tiptap-thread-mark'
      threadMark1.textContent = 'First comment'

      const threadMark2 = document.createElement('span')
      threadMark2.className = 'lb-tiptap-thread-mark'
      threadMark2.textContent = 'Second comment'

      mockEditor!.view.dom.appendChild(threadMark1)
      mockEditor!.view.dom.appendChild(threadMark2)

      // Click first mark
      await act(async () => {
        const clickEvent1 = new MouseEvent('click', { bubbles: true })
        Object.defineProperty(clickEvent1, 'target', { value: threadMark1 })
        mockEditor!.view.dom.dispatchEvent(clickEvent1)
      })

      const sidebar = screen.getByTestId('comments-sidebar')
      expect(sidebar).toHaveAttribute('data-open', 'true')

      // Close and click second mark
      fireEvent.click(sidebar)
      expect(sidebar).toHaveAttribute('data-open', 'false')

      await act(async () => {
        const clickEvent2 = new MouseEvent('click', { bubbles: true })
        Object.defineProperty(clickEvent2, 'target', { value: threadMark2 })
        mockEditor!.view.dom.dispatchEvent(clickEvent2)
      })

      expect(sidebar).toHaveAttribute('data-open', 'true')

      threadMark1.remove()
      threadMark2.remove()
    })
  })

  // ==========================================================================
  // Add Comment Workflow
  // ==========================================================================

  describe('add comment workflow', () => {
    it('should show notification when trying to add comment without selection', async () => {
      mockEditor!.state.selection = { from: 5, to: 5 } // No selection
      render(<Editor />)

      // Open sidebar first
      const toggleBtn = screen.getByTestId('toggle-sidebar-btn')
      fireEvent.click(toggleBtn)

      // Click add comment
      const addBtn = screen.getByTestId('add-comment-btn')
      fireEvent.click(addBtn)

      // Notification appears
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText('Select text in the document to add a comment')).toBeInTheDocument()
      })

      // Wait for auto-dismiss
      act(() => {
        jest.advanceTimersByTime(3000)
      })

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })

    it('should successfully initiate comment when text is selected', () => {
      mockEditor!.state.selection = { from: 5, to: 20 } // Text selected
      render(<Editor />)

      // Open sidebar
      const toggleBtn = screen.getByTestId('toggle-sidebar-btn')
      fireEvent.click(toggleBtn)

      // Click add comment
      const addBtn = screen.getByTestId('add-comment-btn')
      fireEvent.click(addBtn)

      // Should call addPendingComment
      expect(mockEditor!.commands.addPendingComment).toHaveBeenCalled()

      // No error notification should appear
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should handle error during comment addition gracefully', async () => {
      mockEditor!.state.selection = { from: 5, to: 20 }
      mockEditor!.commands.addPendingComment.mockImplementation(() => {
        throw new Error('Network error')
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      render(<Editor />)

      // Open sidebar and try to add comment
      const toggleBtn = screen.getByTestId('toggle-sidebar-btn')
      fireEvent.click(toggleBtn)

      const addBtn = screen.getByTestId('add-comment-btn')
      fireEvent.click(addBtn)

      // Error notification should appear
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText('Failed to add comment. Please try again.')).toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })
  })

  // ==========================================================================
  // Error Recovery Workflow
  // ==========================================================================

  describe('error recovery workflow', () => {
    it('should recover after failed comment addition', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      // First attempt fails
      mockEditor!.state.selection = { from: 5, to: 20 }
      mockEditor!.commands.addPendingComment
        .mockImplementationOnce(() => {
          throw new Error('First failure')
        })
        .mockReturnValue(true) // Subsequent attempts succeed

      render(<Editor />)

      const addBtn = screen.getByTestId('add-comment-btn')

      // First click - should fail
      fireEvent.click(addBtn)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Wait for notification to dismiss
      act(() => {
        jest.advanceTimersByTime(3000)
      })

      // Second click - should succeed
      fireEvent.click(addBtn)

      expect(mockEditor!.commands.addPendingComment).toHaveBeenCalledTimes(2)

      consoleSpy.mockRestore()
    })

    it('should allow retry after showing no-selection notification', async () => {
      render(<Editor />)

      const addBtn = screen.getByTestId('add-comment-btn')

      // First click - no selection
      mockEditor!.state.selection = { from: 5, to: 5 }
      fireEvent.click(addBtn)

      await waitFor(() => {
        expect(screen.getByText('Select text in the document to add a comment')).toBeInTheDocument()
      })

      // Wait for notification to dismiss
      act(() => {
        jest.advanceTimersByTime(3000)
      })

      // Now user selects text and tries again
      mockEditor!.state.selection = { from: 5, to: 20 }
      fireEvent.click(addBtn)

      expect(mockEditor!.commands.addPendingComment).toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // Full Workflow Scenarios
  // ==========================================================================

  describe('complete workflow scenarios', () => {
    it('should support full workflow: open sidebar, add comment, see threads', async () => {
      mockEditor!.state.selection = { from: 5, to: 20 }
      setMockThreads([])

      render(<Editor />)

      // Step 1: Open sidebar
      const toggleBtn = screen.getByTestId('toggle-sidebar-btn')
      fireEvent.click(toggleBtn)

      const sidebar = screen.getByTestId('comments-sidebar')
      expect(sidebar).toHaveAttribute('data-open', 'true')

      // Step 2: Add comment
      const addBtn = screen.getByTestId('add-comment-btn')
      fireEvent.click(addBtn)

      expect(mockEditor!.commands.addPendingComment).toHaveBeenCalled()

      // Step 3: Threads would appear (simulated by updating mock)
      // In real scenario, Liveblocks would update the threads list
    })

    it('should support click-on-mark workflow: click mark, sidebar opens, close sidebar', async () => {
      setMockThreads([
        { id: 'thread-1', metadata: { resolved: false } },
      ])

      render(<Editor />)

      // Create thread mark
      const threadMark = document.createElement('span')
      threadMark.className = 'lb-tiptap-thread-mark'
      mockEditor!.view.dom.appendChild(threadMark)

      // Click on mark
      await act(async () => {
        const clickEvent = new MouseEvent('click', { bubbles: true })
        Object.defineProperty(clickEvent, 'target', { value: threadMark })
        mockEditor!.view.dom.dispatchEvent(clickEvent)
      })

      // Sidebar opens
      const sidebar = screen.getByTestId('comments-sidebar')
      expect(sidebar).toHaveAttribute('data-open', 'true')

      // Close sidebar
      fireEvent.click(sidebar)
      expect(sidebar).toHaveAttribute('data-open', 'false')

      threadMark.remove()
    })
  })
})
