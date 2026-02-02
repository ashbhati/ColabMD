/**
 * Integration Tests for CommentsSidebar Component
 *
 * Tests the comments sidebar integration with the Editor component.
 * Covers toggle behavior, thread display, and dark mode support.
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

      const sidebar = screen.getByText('Comments').closest('.fixed')
      expect(sidebar).toHaveClass('translate-x-0')
    })

    it('should apply translate-x-full when closed', () => {
      render(<CommentsSidebar isOpen={false} onClose={jest.fn()} />)

      const sidebar = screen.getByText('Comments').closest('.fixed')
      expect(sidebar).toHaveClass('translate-x-full')
    })

    it('should render close button', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      // Close button has an X icon (path with "M6 18L18 6M6 6l12 12")
      const closeButton = document.querySelector('button path[d*="M6 18L18 6"]')?.closest('button')
      expect(closeButton).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Close Behavior
  // ==========================================================================

  describe('close behavior', () => {
    it('should call onClose when close button is clicked', () => {
      const onClose = jest.fn()
      render(<CommentsSidebar isOpen={true} onClose={onClose} />)

      const closeButton = document.querySelector('button path[d*="M6 18L18 6"]')?.closest('button')
      if (closeButton) {
        fireEvent.click(closeButton)
      }

      expect(onClose).toHaveBeenCalledTimes(1)
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
  })

  // ==========================================================================
  // Dark Mode Styling
  // ==========================================================================

  describe('dark mode styling', () => {
    it('should have dark mode background classes', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const sidebar = screen.getByText('Comments').closest('.fixed')
      expect(sidebar).toHaveClass('bg-white')
      expect(sidebar).toHaveClass('dark:bg-slate-900')
    })

    it('should have dark mode border classes', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const sidebar = screen.getByText('Comments').closest('.fixed')
      expect(sidebar).toHaveClass('border-slate-200')
      expect(sidebar).toHaveClass('dark:border-slate-800')
    })

    it('should have dark mode text classes for header', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const header = screen.getByText('Comments')
      expect(header).toHaveClass('text-slate-900')
      expect(header).toHaveClass('dark:text-slate-100')
    })
  })

  // ==========================================================================
  // Positioning and Layout
  // ==========================================================================

  describe('positioning and layout', () => {
    it('should be fixed positioned on the right', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const sidebar = screen.getByText('Comments').closest('.fixed')
      expect(sidebar).toHaveClass('fixed')
      expect(sidebar).toHaveClass('right-0')
    })

    it('should start below the header (top-16)', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const sidebar = screen.getByText('Comments').closest('.fixed')
      expect(sidebar).toHaveClass('top-16')
    })

    it('should have correct width (w-80)', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const sidebar = screen.getByText('Comments').closest('.fixed')
      expect(sidebar).toHaveClass('w-80')
    })

    it('should have z-40 for proper layering', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const sidebar = screen.getByText('Comments').closest('.fixed')
      expect(sidebar).toHaveClass('z-40')
    })

    it('should be scrollable', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const sidebar = screen.getByText('Comments').closest('.fixed')
      expect(sidebar).toHaveClass('overflow-y-auto')
    })
  })

  // ==========================================================================
  // Transition Animation
  // ==========================================================================

  describe('transition animation', () => {
    it('should have transition classes for smooth animation', () => {
      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />)

      const sidebar = screen.getByText('Comments').closest('.fixed')
      expect(sidebar).toHaveClass('transition-transform')
      expect(sidebar).toHaveClass('duration-300')
    })
  })
})
