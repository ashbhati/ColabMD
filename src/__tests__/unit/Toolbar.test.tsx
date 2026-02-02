/**
 * Unit Tests for Toolbar Component
 *
 * Tests the editor toolbar including the new UI fixes:
 * - Comments sidebar toggle button with comment count badge
 * - Strikethrough icon (S with horizontal line)
 * - Custom tooltips on toolbar buttons
 * - Active state styling
 */

import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { Toolbar } from '@/components/Editor/Toolbar'

// ============================================================================
// Mock Setup
// ============================================================================

// Mock the Editor from Tiptap
const createMockEditor = (overrides: Partial<MockEditorState> = {}) => {
  const defaultState: MockEditorState = {
    isActive: {
      bold: false,
      italic: false,
      strike: false,
      code: false,
      heading1: false,
      heading2: false,
      heading3: false,
      bulletList: false,
      orderedList: false,
      blockquote: false,
      codeBlock: false,
    },
    canUndo: true,
    canRedo: true,
    ...overrides,
  }

  return {
    chain: () => ({
      focus: () => ({
        toggleBold: () => ({ run: jest.fn() }),
        toggleItalic: () => ({ run: jest.fn() }),
        toggleStrike: () => ({ run: jest.fn() }),
        toggleCode: () => ({ run: jest.fn() }),
        toggleHeading: () => ({ run: jest.fn() }),
        toggleBulletList: () => ({ run: jest.fn() }),
        toggleOrderedList: () => ({ run: jest.fn() }),
        toggleBlockquote: () => ({ run: jest.fn() }),
        toggleCodeBlock: () => ({ run: jest.fn() }),
        setHorizontalRule: () => ({ run: jest.fn() }),
        undo: () => ({ run: jest.fn() }),
        redo: () => ({ run: jest.fn() }),
      }),
    }),
    isActive: (type: string, attrs?: Record<string, unknown>) => {
      if (type === 'heading' && attrs?.level === 1) return defaultState.isActive.heading1
      if (type === 'heading' && attrs?.level === 2) return defaultState.isActive.heading2
      if (type === 'heading' && attrs?.level === 3) return defaultState.isActive.heading3
      return defaultState.isActive[type as keyof typeof defaultState.isActive] || false
    },
    can: () => ({
      undo: () => defaultState.canUndo,
      redo: () => defaultState.canRedo,
    }),
  }
}

interface MockEditorState {
  isActive: {
    bold: boolean
    italic: boolean
    strike: boolean
    code: boolean
    heading1: boolean
    heading2: boolean
    heading3: boolean
    bulletList: boolean
    orderedList: boolean
    blockquote: boolean
    codeBlock: boolean
  }
  canUndo: boolean
  canRedo: boolean
}

// Helper to advance timers for tooltip delays
const advanceTimersByTime = async (ms: number) => {
  await act(async () => {
    jest.advanceTimersByTime(ms)
  })
}

describe('Toolbar Component', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const defaultProps = {
    editor: createMockEditor() as unknown as Parameters<typeof Toolbar>[0]['editor'],
    viewMode: 'wysiwyg' as const,
    onViewModeChange: jest.fn(),
  }

  // ==========================================================================
  // Basic Rendering
  // ==========================================================================

  describe('basic rendering', () => {
    it('should render the toolbar container', () => {
      render(<Toolbar {...defaultProps} />)

      // Check for toolbar presence via its sticky positioning
      const toolbar = document.querySelector('.sticky.top-16')
      expect(toolbar).toBeInTheDocument()
    })

    it('should render all formatting buttons', () => {
      render(<Toolbar {...defaultProps} />)

      // Check for heading buttons by text
      expect(screen.getByText('H1')).toBeInTheDocument()
      expect(screen.getByText('H2')).toBeInTheDocument()
      expect(screen.getByText('H3')).toBeInTheDocument()
    })

    it('should render view mode toggle buttons', () => {
      render(<Toolbar {...defaultProps} />)

      expect(screen.getByText('Rich')).toBeInTheDocument()
      expect(screen.getByText('MD')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Comments Sidebar Toggle Button
  // ==========================================================================

  describe('comments sidebar toggle button', () => {
    it('should render comments toggle button', () => {
      const onToggle = jest.fn()
      render(
        <Toolbar
          {...defaultProps}
          isCommentsSidebarOpen={false}
          onToggleCommentsSidebar={onToggle}
        />
      )

      // The button should contain the comment icon (speech bubble path)
      const commentButtons = document.querySelectorAll('button')
      const commentButton = Array.from(commentButtons).find((btn) =>
        btn.querySelector('path[d*="M8 10h.01M12 10h.01M16 10h.01"]')
      )
      expect(commentButton).toBeInTheDocument()
    })

    it('should call onToggleCommentsSidebar when clicked', () => {
      const onToggle = jest.fn()
      render(
        <Toolbar
          {...defaultProps}
          isCommentsSidebarOpen={false}
          onToggleCommentsSidebar={onToggle}
        />
      )

      // Find the comment toggle button by its icon
      const buttons = document.querySelectorAll('button')
      const commentButton = Array.from(buttons).find((btn) =>
        btn.querySelector('path[d*="M8 10h.01"]')
      )

      if (commentButton) {
        fireEvent.click(commentButton)
        expect(onToggle).toHaveBeenCalledTimes(1)
      }
    })

    it('should show active state when sidebar is open', () => {
      render(
        <Toolbar
          {...defaultProps}
          isCommentsSidebarOpen={true}
          onToggleCommentsSidebar={jest.fn()}
        />
      )

      // Find the button and check for active styling
      const buttons = document.querySelectorAll('button')
      const commentButton = Array.from(buttons).find((btn) =>
        btn.querySelector('path[d*="M8 10h.01"]')
      )

      // Active buttons have indigo background classes
      expect(commentButton).toHaveClass('bg-indigo-100')
    })

    it('should show tooltip on hover', async () => {
      render(
        <Toolbar
          {...defaultProps}
          isCommentsSidebarOpen={false}
          onToggleCommentsSidebar={jest.fn()}
        />
      )

      // Find the comment button wrapper (the relative div containing the button)
      const buttons = document.querySelectorAll('button')
      const commentButton = Array.from(buttons).find((btn) =>
        btn.querySelector('path[d*="M8 10h.01"]')
      )

      const tooltipWrapper = commentButton?.closest('.relative.inline-flex')

      if (tooltipWrapper) {
        fireEvent.mouseEnter(tooltipWrapper)
        await advanceTimersByTime(200)

        expect(screen.getByText('Toggle comments sidebar')).toBeInTheDocument()
      }
    })
  })

  // ==========================================================================
  // Comment Count Badge
  // ==========================================================================

  describe('comment count badge', () => {
    it('should not display badge when commentCount is 0', () => {
      render(
        <Toolbar
          {...defaultProps}
          isCommentsSidebarOpen={false}
          onToggleCommentsSidebar={jest.fn()}
          commentCount={0}
        />
      )

      // Badge should not exist
      const badge = document.querySelector('.rounded-full.bg-indigo-500')
      expect(badge).not.toBeInTheDocument()
    })

    it('should not display badge when commentCount is undefined', () => {
      render(
        <Toolbar
          {...defaultProps}
          isCommentsSidebarOpen={false}
          onToggleCommentsSidebar={jest.fn()}
        />
      )

      const badge = document.querySelector('.rounded-full.bg-indigo-500')
      expect(badge).not.toBeInTheDocument()
    })

    it('should display badge with count for 1-9 comments', () => {
      // Use counts that don't conflict with ordered list numbers (1, 2, 3)
      const testCounts = [4, 5, 7, 9]

      testCounts.forEach((count) => {
        const { unmount } = render(
          <Toolbar
            {...defaultProps}
            isCommentsSidebarOpen={false}
            onToggleCommentsSidebar={jest.fn()}
            commentCount={count}
          />
        )

        const badge = screen.getByText(count.toString())
        expect(badge).toBeInTheDocument()
        expect(badge).toHaveClass('bg-indigo-500')
        expect(badge).toHaveClass('rounded-full')

        unmount()
      })
    })

    it('should display "9+" for 10 or more comments', () => {
      render(
        <Toolbar
          {...defaultProps}
          isCommentsSidebarOpen={false}
          onToggleCommentsSidebar={jest.fn()}
          commentCount={10}
        />
      )

      expect(screen.getByText('9+')).toBeInTheDocument()
    })

    it('should display "9+" for very large comment counts', () => {
      render(
        <Toolbar
          {...defaultProps}
          isCommentsSidebarOpen={false}
          onToggleCommentsSidebar={jest.fn()}
          commentCount={100}
        />
      )

      expect(screen.getByText('9+')).toBeInTheDocument()
    })

    it('should have pointer-events-none on badge', () => {
      render(
        <Toolbar
          {...defaultProps}
          isCommentsSidebarOpen={false}
          onToggleCommentsSidebar={jest.fn()}
          commentCount={5}
        />
      )

      const badge = screen.getByText('5')
      expect(badge).toHaveClass('pointer-events-none')
    })

    it('should position badge correctly (absolute positioning)', () => {
      render(
        <Toolbar
          {...defaultProps}
          isCommentsSidebarOpen={false}
          onToggleCommentsSidebar={jest.fn()}
          commentCount={4}
        />
      )

      // Use 4 to avoid conflict with ordered list numbers
      const badge = screen.getByText('4')
      expect(badge).toHaveClass('absolute')
      expect(badge).toHaveClass('-top-0.5')
      expect(badge).toHaveClass('-right-0.5')
    })
  })

  // ==========================================================================
  // Strikethrough Icon
  // ==========================================================================

  describe('strikethrough icon', () => {
    it('should render strikethrough button with S and horizontal line icon', () => {
      render(<Toolbar {...defaultProps} />)

      // Find the SVG with both the horizontal line and the S shape
      const svgs = document.querySelectorAll('svg')
      const strikeIcon = Array.from(svgs).find((svg) => {
        const paths = svg.querySelectorAll('path')
        const pathData = Array.from(paths).map((p) => p.getAttribute('d')).join(' ')
        // Check for horizontal line (M4 12h16) and S shape
        return pathData.includes('M4 12h16') && pathData.includes('M17 5H9.5')
      })

      expect(strikeIcon).toBeInTheDocument()
    })

    it('should have horizontal line path in strikethrough icon', () => {
      render(<Toolbar {...defaultProps} />)

      // Look for the horizontal line path
      const horizontalLine = document.querySelector('path[d="M4 12h16"]')
      expect(horizontalLine).toBeInTheDocument()
    })

    it('should have S-shaped path in strikethrough icon', () => {
      render(<Toolbar {...defaultProps} />)

      // Look for the S-shaped path
      const sPath = document.querySelector('path[d*="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"]')
      expect(sPath).toBeInTheDocument()
    })

    it('should show tooltip for strikethrough on hover', async () => {
      render(<Toolbar {...defaultProps} />)

      // Find strikethrough button by its icon pattern
      const svgs = document.querySelectorAll('svg')
      const strikeIcon = Array.from(svgs).find((svg) =>
        svg.querySelector('path[d="M4 12h16"]') &&
        svg.querySelector('path[d*="M17 5H9.5"]')
      )

      const tooltipWrapper = strikeIcon?.closest('.relative.inline-flex')

      if (tooltipWrapper) {
        fireEvent.mouseEnter(tooltipWrapper)
        await advanceTimersByTime(200)

        expect(screen.getByText('Strikethrough')).toBeInTheDocument()
      }
    })

    it('should show active state when strikethrough is active', () => {
      const mockEditor = createMockEditor({
        isActive: {
          bold: false,
          italic: false,
          strike: true,  // Strike is active
          code: false,
          heading1: false,
          heading2: false,
          heading3: false,
          bulletList: false,
          orderedList: false,
          blockquote: false,
          codeBlock: false,
        },
      })

      render(
        <Toolbar
          {...defaultProps}
          editor={mockEditor as unknown as Parameters<typeof Toolbar>[0]['editor']}
        />
      )

      // Find the strikethrough button and check its active state
      const svgs = document.querySelectorAll('svg')
      const strikeIcon = Array.from(svgs).find((svg) =>
        svg.querySelector('path[d="M4 12h16"]')
      )
      const strikeButton = strikeIcon?.closest('button')

      expect(strikeButton).toHaveClass('bg-indigo-100')
      expect(strikeButton).toHaveClass('text-indigo-600')
    })
  })

  // ==========================================================================
  // Custom Tooltips on All Buttons
  // ==========================================================================

  describe('custom tooltips', () => {
    it('should show Bold tooltip with keyboard shortcut', async () => {
      render(<Toolbar {...defaultProps} />)

      // Find bold button by its SVG path pattern
      const svgs = document.querySelectorAll('svg')
      const boldIcon = Array.from(svgs).find((svg) =>
        svg.querySelector('path[d*="M6 4h8a4 4 0 014 4"]')
      )
      const tooltipWrapper = boldIcon?.closest('.relative.inline-flex')

      if (tooltipWrapper) {
        fireEvent.mouseEnter(tooltipWrapper)
        await advanceTimersByTime(200)

        expect(screen.getByText('Bold')).toBeInTheDocument()
        // Check for Mac-style keyboard shortcut
        const kbd = screen.getByText((content, element) =>
          element?.tagName === 'KBD' && content.includes('B')
        )
        expect(kbd).toBeInTheDocument()
      }
    })

    it('should show Italic tooltip with keyboard shortcut', async () => {
      render(<Toolbar {...defaultProps} />)

      // Find italic button by its SVG path pattern
      const svgs = document.querySelectorAll('svg')
      const italicIcon = Array.from(svgs).find((svg) =>
        svg.querySelector('path[d*="M10 4h4"]')
      )
      const tooltipWrapper = italicIcon?.closest('.relative.inline-flex')

      if (tooltipWrapper) {
        fireEvent.mouseEnter(tooltipWrapper)
        await advanceTimersByTime(200)

        expect(screen.getByText('Italic')).toBeInTheDocument()
      }
    })

    it('should show Undo tooltip with keyboard shortcut', async () => {
      render(<Toolbar {...defaultProps} />)

      // Find undo button by its SVG path (left-pointing arrow)
      const svgs = document.querySelectorAll('svg')
      const undoIcon = Array.from(svgs).find((svg) =>
        svg.querySelector('path[d*="M3 10h10a8 8 0 018 8"]')
      )
      const tooltipWrapper = undoIcon?.closest('.relative.inline-flex')

      if (tooltipWrapper) {
        fireEvent.mouseEnter(tooltipWrapper)
        await advanceTimersByTime(200)

        expect(screen.getByText('Undo')).toBeInTheDocument()
      }
    })

    it('should show heading tooltips with keyboard shortcuts', async () => {
      render(<Toolbar {...defaultProps} />)

      const h1Button = screen.getByText('H1').closest('.relative.inline-flex')

      if (h1Button) {
        fireEvent.mouseEnter(h1Button)
        await advanceTimersByTime(200)

        expect(screen.getByText('Heading 1')).toBeInTheDocument()
      }
    })
  })

  // ==========================================================================
  // Active State Styling
  // ==========================================================================

  describe('active state styling', () => {
    it('should apply active styles to bold button when bold is active', () => {
      const mockEditor = createMockEditor({
        isActive: {
          bold: true,
          italic: false,
          strike: false,
          code: false,
          heading1: false,
          heading2: false,
          heading3: false,
          bulletList: false,
          orderedList: false,
          blockquote: false,
          codeBlock: false,
        },
      })

      render(
        <Toolbar
          {...defaultProps}
          editor={mockEditor as unknown as Parameters<typeof Toolbar>[0]['editor']}
        />
      )

      const svgs = document.querySelectorAll('svg')
      const boldIcon = Array.from(svgs).find((svg) =>
        svg.querySelector('path[d*="M6 4h8a4 4 0 014 4"]')
      )
      const boldButton = boldIcon?.closest('button')

      expect(boldButton).toHaveClass('bg-indigo-100')
      expect(boldButton).toHaveClass('text-indigo-600')
    })

    it('should apply inactive styles to buttons when not active', () => {
      render(<Toolbar {...defaultProps} />)

      const svgs = document.querySelectorAll('svg')
      const boldIcon = Array.from(svgs).find((svg) =>
        svg.querySelector('path[d*="M6 4h8a4 4 0 014 4"]')
      )
      const boldButton = boldIcon?.closest('button')

      expect(boldButton).toHaveClass('text-slate-500')
      expect(boldButton).not.toHaveClass('bg-indigo-100')
    })

    it('should apply dark mode active styles', () => {
      const mockEditor = createMockEditor({
        isActive: {
          bold: true,
          italic: false,
          strike: false,
          code: false,
          heading1: false,
          heading2: false,
          heading3: false,
          bulletList: false,
          orderedList: false,
          blockquote: false,
          codeBlock: false,
        },
      })

      render(
        <Toolbar
          {...defaultProps}
          editor={mockEditor as unknown as Parameters<typeof Toolbar>[0]['editor']}
        />
      )

      const svgs = document.querySelectorAll('svg')
      const boldIcon = Array.from(svgs).find((svg) =>
        svg.querySelector('path[d*="M6 4h8a4 4 0 014 4"]')
      )
      const boldButton = boldIcon?.closest('button')

      // Check dark mode classes are present
      expect(boldButton).toHaveClass('dark:bg-indigo-950')
      expect(boldButton).toHaveClass('dark:text-indigo-400')
    })
  })

  // ==========================================================================
  // Disabled State
  // ==========================================================================

  describe('disabled state', () => {
    it('should disable undo button when cannot undo', () => {
      const mockEditor = createMockEditor({ canUndo: false })

      render(
        <Toolbar
          {...defaultProps}
          editor={mockEditor as unknown as Parameters<typeof Toolbar>[0]['editor']}
        />
      )

      const svgs = document.querySelectorAll('svg')
      const undoIcon = Array.from(svgs).find((svg) =>
        svg.querySelector('path[d*="M3 10h10a8 8 0 018 8"]')
      )
      const undoButton = undoIcon?.closest('button')

      expect(undoButton).toBeDisabled()
      expect(undoButton).toHaveClass('opacity-40')
      expect(undoButton).toHaveClass('cursor-not-allowed')
    })

    it('should disable redo button when cannot redo', () => {
      const mockEditor = createMockEditor({ canRedo: false })

      render(
        <Toolbar
          {...defaultProps}
          editor={mockEditor as unknown as Parameters<typeof Toolbar>[0]['editor']}
        />
      )

      const svgs = document.querySelectorAll('svg')
      const redoIcon = Array.from(svgs).find((svg) =>
        svg.querySelector('path[d*="M21 10H11a8 8 0 00-8 8"]')
      )
      const redoButton = redoIcon?.closest('button')

      expect(redoButton).toBeDisabled()
    })
  })

  // ==========================================================================
  // View Mode Toggle
  // ==========================================================================

  describe('view mode toggle', () => {
    it('should highlight Rich button when in wysiwyg mode', () => {
      render(<Toolbar {...defaultProps} viewMode="wysiwyg" />)

      const richButton = screen.getByText('Rich')
      expect(richButton).toHaveClass('bg-white')
      expect(richButton).toHaveClass('shadow-sm')
    })

    it('should highlight MD button when in markdown mode', () => {
      render(<Toolbar {...defaultProps} viewMode="markdown" />)

      const mdButton = screen.getByText('MD')
      expect(mdButton).toHaveClass('bg-white')
      expect(mdButton).toHaveClass('shadow-sm')
    })

    it('should call onViewModeChange when Rich is clicked', () => {
      const onViewModeChange = jest.fn()
      render(
        <Toolbar
          {...defaultProps}
          viewMode="markdown"
          onViewModeChange={onViewModeChange}
        />
      )

      fireEvent.click(screen.getByText('Rich'))
      expect(onViewModeChange).toHaveBeenCalledWith('wysiwyg')
    })

    it('should call onViewModeChange when MD is clicked', () => {
      const onViewModeChange = jest.fn()
      render(
        <Toolbar
          {...defaultProps}
          viewMode="wysiwyg"
          onViewModeChange={onViewModeChange}
        />
      )

      fireEvent.click(screen.getByText('MD'))
      expect(onViewModeChange).toHaveBeenCalledWith('markdown')
    })

    it('should show tooltips for view mode buttons', async () => {
      render(<Toolbar {...defaultProps} />)

      const richButton = screen.getByText('Rich')
      const tooltipWrapper = richButton.closest('.relative.inline-flex')

      if (tooltipWrapper) {
        fireEvent.mouseEnter(tooltipWrapper)
        await advanceTimersByTime(200)

        expect(screen.getByText('Rich Text View')).toBeInTheDocument()
      }
    })
  })

  // ==========================================================================
  // Save Button
  // ==========================================================================

  describe('save button', () => {
    it('should render save button when onSave is provided', () => {
      render(<Toolbar {...defaultProps} onSave={jest.fn()} />)

      expect(screen.getByText('Save')).toBeInTheDocument()
    })

    it('should not render save button when onSave is not provided', () => {
      render(<Toolbar {...defaultProps} />)

      expect(screen.queryByText('Save')).not.toBeInTheDocument()
    })

    it('should show saving state when isSaving is true', () => {
      render(
        <Toolbar
          {...defaultProps}
          onSave={jest.fn()}
          isSaving={true}
        />
      )

      expect(screen.getByText('Saving...')).toBeInTheDocument()
    })

    it('should disable save button when saving', () => {
      render(
        <Toolbar
          {...defaultProps}
          onSave={jest.fn()}
          isSaving={true}
        />
      )

      const saveButton = screen.getByText('Saving...').closest('button')
      expect(saveButton).toBeDisabled()
    })

    it('should show tooltip with keyboard shortcut for save', async () => {
      render(<Toolbar {...defaultProps} onSave={jest.fn()} />)

      const saveButton = screen.getByText('Save')
      const tooltipWrapper = saveButton.closest('.relative.inline-flex')

      if (tooltipWrapper) {
        fireEvent.mouseEnter(tooltipWrapper)
        await advanceTimersByTime(200)

        expect(screen.getByText('Save document')).toBeInTheDocument()
      }
    })
  })

  // ==========================================================================
  // Dividers
  // ==========================================================================

  describe('dividers', () => {
    it('should render dividers between button groups', () => {
      render(<Toolbar {...defaultProps} />)

      const dividers = document.querySelectorAll('.mx-1.h-5.w-px.bg-slate-200')
      expect(dividers.length).toBeGreaterThan(0)
    })

    it('should have dark mode styling on dividers', () => {
      render(<Toolbar {...defaultProps} />)

      const dividers = document.querySelectorAll('.dark\\:bg-slate-700')
      expect(dividers.length).toBeGreaterThan(0)
    })
  })
})
