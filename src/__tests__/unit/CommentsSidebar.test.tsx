/**
 * Unit Tests for CommentsSidebar Component
 *
 * Tests the comments sidebar functionality including:
 * - Basic rendering and toggle behavior
 * - Thread display (resolved/unresolved)
 * - AI thread indicators
 * - Dark mode styling
 * - NEW: onAddComment prop and "Add" button
 * - NEW: ARIA accessibility attributes
 * - NEW: Memoized thread filtering (useMemo)
 * - NEW: Semantic aside element usage
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { CommentsSidebar } from '@/components/Comments'

// ============================================================================
// Mock Setup
// ============================================================================

// Mock Liveblocks hooks
const mockThreads: MockThread[] = []

jest.mock('../../../liveblocks.config', () => ({
  useThreads: () => ({ threads: mockThreads }),
}))

// Mock the Thread component from Liveblocks
jest.mock('@liveblocks/react-ui', () => ({
  Thread: ({ thread }: { thread: MockThread }) => (
    <div data-testid={`thread-${thread.id}`} className="mock-thread">
      Thread: {thread.id}
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

// Helper to set mock threads
const setMockThreads = (threads: MockThread[]) => {
  mockThreads.length = 0
  mockThreads.push(...threads)
}

describe('CommentsSidebar Component', () => {
  beforeEach(() => {
    setMockThreads([])
  })

  // ==========================================================================
  // Basic Rendering
  // ==========================================================================

  describe('basic rendering', () => {
    it('should render sidebar when isOpen is true', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      expect(screen.getByText('Comments')).toBeInTheDocument()
    })

    it('should apply translate-x-0 when open', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('translate-x-0')
    })

    it('should apply translate-x-full when closed', () => {
      render(<CommentsSidebar isOpen={false} onClose={jest.fn()} />)

      // Use hidden option since aria-hidden="true" hides from accessibility tree
      const sidebar = screen.getByRole('complementary', { hidden: true })
      expect(sidebar).toHaveClass('translate-x-full')
    })

    it('should render close button', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const closeButton = screen.getByLabelText('Close comments sidebar')
      expect(closeButton).toBeInTheDocument()
    })

    it('should use aside element for semantic HTML', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const sidebar = screen.getByRole('complementary')
      expect(sidebar.tagName.toLowerCase()).toBe('aside')
    })
  })

  // ==========================================================================
  // ARIA Accessibility Attributes (NEW)
  // ==========================================================================

  describe('ARIA accessibility attributes', () => {
    it('should have role="complementary" on sidebar', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toBeInTheDocument()
    })

    it('should have aria-label="Comments sidebar"', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveAttribute('aria-label', 'Comments sidebar')
    })

    it('should have aria-hidden="false" when open', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveAttribute('aria-hidden', 'false')
    })

    it('should have aria-hidden="true" when closed', () => {
      render(<CommentsSidebar isOpen={false} onClose={jest.fn()} />)

      // Use hidden option since aria-hidden="true" hides from accessibility tree
      const sidebar = screen.getByRole('complementary', { hidden: true })
      expect(sidebar).toHaveAttribute('aria-hidden', 'true')
    })

    it('should have aria-label on close button', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const closeButton = screen.getByLabelText('Close comments sidebar')
      expect(closeButton).toBeInTheDocument()
    })

    it('should have aria-hidden on decorative SVG icons', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      // The close button SVG should have aria-hidden
      const closeButton = screen.getByLabelText('Close comments sidebar')
      const svg = closeButton.querySelector('svg')
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    })
  })

  // ==========================================================================
  // Add Comment Button (NEW)
  // ==========================================================================

  describe('add comment button', () => {
    it('should render Add button when onAddComment prop is provided', () => {
      render(
        <CommentsSidebar isOpen={true} onClose={jest.fn()} onAddComment={jest.fn()} />
      )

      const addButton = screen.getByLabelText('Add comment to selected text')
      expect(addButton).toBeInTheDocument()
    })

    it('should not render Add button when onAddComment prop is not provided', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const addButton = screen.queryByLabelText('Add comment to selected text')
      expect(addButton).not.toBeInTheDocument()
    })

    it('should call onAddComment when Add button is clicked', () => {
      const onAddComment = jest.fn()
      render(
        <CommentsSidebar isOpen={true} onClose={jest.fn()} onAddComment={onAddComment} />
      )

      const addButton = screen.getByLabelText('Add comment to selected text')
      fireEvent.click(addButton)

      expect(onAddComment).toHaveBeenCalledTimes(1)
    })

    it('should display "Add" text in the button', () => {
      render(
        <CommentsSidebar isOpen={true} onClose={jest.fn()} onAddComment={jest.fn()} />
      )

      expect(screen.getByText('Add')).toBeInTheDocument()
    })

    it('should have appropriate styling for Add button', () => {
      render(
        <CommentsSidebar isOpen={true} onClose={jest.fn()} onAddComment={jest.fn()} />
      )

      const addButton = screen.getByLabelText('Add comment to selected text')
      expect(addButton).toHaveClass('bg-indigo-50')
      expect(addButton).toHaveClass('text-indigo-600')
    })

    it('should have dark mode styles for Add button', () => {
      render(
        <CommentsSidebar isOpen={true} onClose={jest.fn()} onAddComment={jest.fn()} />
      )

      const addButton = screen.getByLabelText('Add comment to selected text')
      expect(addButton).toHaveClass('dark:bg-indigo-950')
      expect(addButton).toHaveClass('dark:text-indigo-400')
    })

    it('should include plus icon in Add button', () => {
      render(
        <CommentsSidebar isOpen={true} onClose={jest.fn()} onAddComment={jest.fn()} />
      )

      const addButton = screen.getByLabelText('Add comment to selected text')
      const svg = addButton.querySelector('svg')
      expect(svg).toBeInTheDocument()
      // Check for the plus icon path
      const path = svg?.querySelector('path')
      expect(path).toHaveAttribute('d', 'M12 4v16m8-8H4')
    })
  })

  // ==========================================================================
  // Close Behavior
  // ==========================================================================

  describe('close behavior', () => {
    it('should call onClose when close button is clicked', () => {
      const onClose = jest.fn()
      render(<CommentsSidebar isOpen={true} onClose={onClose} />)

      const closeButton = screen.getByLabelText('Close comments sidebar')
      fireEvent.click(closeButton)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should not call onAddComment when close button is clicked', () => {
      const onClose = jest.fn()
      const onAddComment = jest.fn()
      render(
        <CommentsSidebar isOpen={true} onClose={onClose} onAddComment={onAddComment} />
      )

      const closeButton = screen.getByLabelText('Close comments sidebar')
      fireEvent.click(closeButton)

      expect(onClose).toHaveBeenCalledTimes(1)
      expect(onAddComment).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // Empty State
  // ==========================================================================

  describe('empty state', () => {
    it('should show empty state message when no threads', () => {
      setMockThreads([])
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      expect(screen.getByText('No comments yet')).toBeInTheDocument()
      expect(screen.getByText('Select text in the editor and add a comment')).toBeInTheDocument()
    })

    it('should show empty state icon', () => {
      setMockThreads([])
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      // Check for the empty state comment bubble icon
      const emptyIcon = document.querySelector('svg path[d*="M8 10h.01M12 10h.01M16 10h.01"]')
      expect(emptyIcon).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Thread Display
  // ==========================================================================

  describe('thread display', () => {
    it('should display unresolved threads', () => {
      setMockThreads([
        { id: 'thread-1', metadata: { resolved: false } },
        { id: 'thread-2', metadata: { resolved: false } },
      ])
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      expect(screen.getByTestId('thread-thread-1')).toBeInTheDocument()
      expect(screen.getByTestId('thread-thread-2')).toBeInTheDocument()
    })

    it('should show Open section header with count', () => {
      setMockThreads([
        { id: 'thread-1', metadata: { resolved: false } },
        { id: 'thread-2', metadata: { resolved: false } },
      ])
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      expect(screen.getByText('Open (2)')).toBeInTheDocument()
    })

    it('should display resolved threads in separate section', () => {
      setMockThreads([
        { id: 'thread-1', metadata: { resolved: true } },
      ])
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      expect(screen.getByText('Resolved (1)')).toBeInTheDocument()
      expect(screen.getByTestId('thread-thread-1')).toBeInTheDocument()
    })

    it('should show both open and resolved sections when both exist', () => {
      setMockThreads([
        { id: 'thread-1', metadata: { resolved: false } },
        { id: 'thread-2', metadata: { resolved: true } },
      ])
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      expect(screen.getByText('Open (1)')).toBeInTheDocument()
      expect(screen.getByText('Resolved (1)')).toBeInTheDocument()
    })

    it('should apply opacity to resolved threads section', () => {
      setMockThreads([
        { id: 'thread-1', metadata: { resolved: true } },
      ])
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const resolvedSection = screen.getByText('Resolved (1)').closest('div')?.querySelector('.opacity-60')
      expect(resolvedSection).toBeInTheDocument()
    })

    it('should handle threads with undefined metadata', () => {
      setMockThreads([
        { id: 'thread-1' }, // No metadata
      ])
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      // Thread without metadata should appear in unresolved section
      expect(screen.getByTestId('thread-thread-1')).toBeInTheDocument()
      expect(screen.getByText('Open (1)')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Thread Filtering with useMemo (NEW)
  // ==========================================================================

  describe('thread filtering optimization', () => {
    it('should correctly categorize multiple threads', () => {
      setMockThreads([
        { id: 'thread-1', metadata: { resolved: false } },
        { id: 'thread-2', metadata: { resolved: true } },
        { id: 'thread-3', metadata: { resolved: false } },
        { id: 'thread-4', metadata: { resolved: true } },
        { id: 'thread-5', metadata: { resolved: false } },
      ])
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      expect(screen.getByText('Open (3)')).toBeInTheDocument()
      expect(screen.getByText('Resolved (2)')).toBeInTheDocument()
    })

    it('should show only Open section when no resolved threads', () => {
      setMockThreads([
        { id: 'thread-1', metadata: { resolved: false } },
        { id: 'thread-2', metadata: { resolved: false } },
      ])
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      expect(screen.getByText('Open (2)')).toBeInTheDocument()
      expect(screen.queryByText(/Resolved/)).not.toBeInTheDocument()
    })

    it('should show only Resolved section when no open threads', () => {
      setMockThreads([
        { id: 'thread-1', metadata: { resolved: true } },
        { id: 'thread-2', metadata: { resolved: true } },
      ])
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      expect(screen.queryByText(/Open/)).not.toBeInTheDocument()
      expect(screen.getByText('Resolved (2)')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // AI Thread Indicators
  // ==========================================================================

  describe('AI thread indicators', () => {
    it('should show AI badge for AI-generated threads', () => {
      setMockThreads([
        {
          id: 'ai-thread-1',
          metadata: {
            resolved: false,
            aiGenerated: true,
            aiConfidence: 0.85,
            aiCategory: 'grammar',
          },
        },
      ])
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      // AI threads have a purple left border
      const aiIndicator = document.querySelector('.border-purple-500')
      expect(aiIndicator).toBeInTheDocument()
    })

    it('should not show AI indicator for non-AI threads', () => {
      setMockThreads([
        { id: 'thread-1', metadata: { resolved: false, aiGenerated: false } },
      ])
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const aiIndicator = document.querySelector('.border-purple-500')
      expect(aiIndicator).not.toBeInTheDocument()
    })

    it('should show AI indicator for resolved AI threads', () => {
      setMockThreads([
        {
          id: 'ai-thread-resolved',
          metadata: {
            resolved: true,
            aiGenerated: true,
            aiConfidence: 0.95,
          },
        },
      ])
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const aiIndicator = document.querySelector('.border-purple-500')
      expect(aiIndicator).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Dark Mode Styling
  // ==========================================================================

  describe('dark mode styling', () => {
    it('should have dark mode background classes', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('bg-white')
      expect(sidebar).toHaveClass('dark:bg-slate-900')
    })

    it('should have dark mode border classes', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('border-slate-200')
      expect(sidebar).toHaveClass('dark:border-slate-800')
    })

    it('should have dark mode text classes for header', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const header = screen.getByText('Comments')
      expect(header).toHaveClass('text-slate-900')
      expect(header).toHaveClass('dark:text-slate-100')
    })

    it('should have dark mode AI indicator styling', () => {
      setMockThreads([
        {
          id: 'ai-thread-1',
          metadata: { resolved: false, aiGenerated: true },
        },
      ])
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const aiIndicator = document.querySelector('.dark\\:border-purple-400')
      expect(aiIndicator).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Positioning and Layout
  // ==========================================================================

  describe('positioning and layout', () => {
    it('should be fixed positioned on the right', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('fixed')
      expect(sidebar).toHaveClass('right-0')
    })

    it('should start below the header (top-16)', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('top-16')
    })

    it('should have correct width (w-80)', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('w-80')
    })

    it('should have z-40 for proper layering', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('z-40')
    })

    it('should be scrollable', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('overflow-y-auto')
    })
  })

  // ==========================================================================
  // Transition Animation
  // ==========================================================================

  describe('transition animation', () => {
    it('should have transition classes for smooth animation', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('transition-transform')
      expect(sidebar).toHaveClass('duration-300')
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle empty thread array', () => {
      setMockThreads([])
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      expect(screen.getByText('No comments yet')).toBeInTheDocument()
    })

    it('should handle very long thread lists', () => {
      const manyThreads = Array.from({ length: 50 }, (_, i) => ({
        id: `thread-${i}`,
        metadata: { resolved: i % 2 === 0 },
      }))
      setMockThreads(manyThreads)
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      // Should show correct counts
      expect(screen.getByText('Open (25)')).toBeInTheDocument()
      expect(screen.getByText('Resolved (25)')).toBeInTheDocument()
    })

    it('should handle thread with null metadata', () => {
      setMockThreads([
        // @ts-expect-error - Testing null metadata edge case
        { id: 'thread-1', metadata: null },
      ])

      // Should not throw an error
      expect(() => {
        render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)
      }).not.toThrow()
    })

    it('should handle rapid open/close toggling', () => {
      const { rerender } = render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      // Rapidly toggle
      rerender(<CommentsSidebar isOpen={false} onClose={jest.fn()} />)
      rerender(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)
      rerender(<CommentsSidebar isOpen={false} onClose={jest.fn()} />)

      // Use hidden option since aria-hidden="true" hides from accessibility tree
      const sidebar = screen.getByRole('complementary', { hidden: true })
      expect(sidebar).toHaveClass('translate-x-full')
    })

    it('should handle undefined onAddComment gracefully', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} onAddComment={undefined} />)

      // Add button should not appear
      expect(screen.queryByLabelText('Add comment to selected text')).not.toBeInTheDocument()
    })
  })
})
