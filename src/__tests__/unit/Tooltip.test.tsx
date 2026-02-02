/**
 * Unit Tests for Tooltip Component
 *
 * Tests the custom Tooltip component used throughout the editor UI.
 * Covers visibility timing, keyboard shortcut display, positioning,
 * and edge cases like rapid hover/unhover interactions.
 */

import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { Tooltip } from '@/components/ui/Tooltip'

// ============================================================================
// Test Setup
// ============================================================================

// Helper to advance timers safely
const advanceTimersByTime = async (ms: number) => {
  await act(async () => {
    jest.advanceTimersByTime(ms)
  })
}

describe('Tooltip Component', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  // ==========================================================================
  // Basic Rendering
  // ==========================================================================

  describe('basic rendering', () => {
    it('should render children without tooltip initially', () => {
      render(
        <Tooltip content="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      )

      expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument()
      expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument()
    })

    it('should render tooltip content as text', async () => {
      render(
        <Tooltip content="Bold text formatting">
          <button>Bold</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      fireEvent.mouseEnter(button.parentElement!)

      await advanceTimersByTime(200)

      expect(screen.getByText('Bold text formatting')).toBeInTheDocument()
    })

    it('should render tooltip content as ReactNode', async () => {
      render(
        <Tooltip content={<span data-testid="custom-content">Custom content</span>}>
          <button>Action</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      fireEvent.mouseEnter(button.parentElement!)

      await advanceTimersByTime(200)

      expect(screen.getByTestId('custom-content')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Visibility and Timing
  // ==========================================================================

  describe('visibility and timing', () => {
    it('should show tooltip after default 200ms delay on hover', async () => {
      render(
        <Tooltip content="Delayed tooltip">
          <button>Hover me</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      fireEvent.mouseEnter(button.parentElement!)

      // Should not be visible immediately
      expect(screen.queryByText('Delayed tooltip')).not.toBeInTheDocument()

      // Should not be visible at 100ms
      await advanceTimersByTime(100)
      expect(screen.queryByText('Delayed tooltip')).not.toBeInTheDocument()

      // Should be visible at 200ms
      await advanceTimersByTime(100)
      expect(screen.getByText('Delayed tooltip')).toBeInTheDocument()
    })

    it('should show tooltip after custom delay', async () => {
      render(
        <Tooltip content="Custom delay" delay={500}>
          <button>Hover me</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      fireEvent.mouseEnter(button.parentElement!)

      // Should not be visible at 200ms (default)
      await advanceTimersByTime(200)
      expect(screen.queryByText('Custom delay')).not.toBeInTheDocument()

      // Should not be visible at 400ms
      await advanceTimersByTime(200)
      expect(screen.queryByText('Custom delay')).not.toBeInTheDocument()

      // Should be visible at 500ms
      await advanceTimersByTime(100)
      expect(screen.getByText('Custom delay')).toBeInTheDocument()
    })

    it('should show tooltip immediately with delay=0', async () => {
      render(
        <Tooltip content="Instant tooltip" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      fireEvent.mouseEnter(button.parentElement!)

      // Even with delay=0, we need to advance by 0ms to trigger setTimeout
      await advanceTimersByTime(0)
      expect(screen.getByText('Instant tooltip')).toBeInTheDocument()
    })

    it('should hide tooltip immediately on mouse leave', async () => {
      render(
        <Tooltip content="Hide test">
          <button>Hover me</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      const wrapper = button.parentElement!

      // Show the tooltip
      fireEvent.mouseEnter(wrapper)
      await advanceTimersByTime(200)
      expect(screen.getByText('Hide test')).toBeInTheDocument()

      // Hide immediately on mouse leave
      fireEvent.mouseLeave(wrapper)
      expect(screen.queryByText('Hide test')).not.toBeInTheDocument()
    })

    it('should cancel show timeout if mouse leaves before delay completes', async () => {
      render(
        <Tooltip content="Cancelled tooltip">
          <button>Hover me</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      const wrapper = button.parentElement!

      // Start hovering
      fireEvent.mouseEnter(wrapper)
      await advanceTimersByTime(100)

      // Leave before delay completes
      fireEvent.mouseLeave(wrapper)

      // Complete the remaining time
      await advanceTimersByTime(100)

      // Tooltip should never have appeared
      expect(screen.queryByText('Cancelled tooltip')).not.toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Keyboard Shortcut Display
  // ==========================================================================

  describe('keyboard shortcut display', () => {
    it('should display keyboard shortcut when provided', async () => {
      render(
        <Tooltip content="Bold" shortcut="Cmd+B">
          <button>B</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      fireEvent.mouseEnter(button.parentElement!)
      await advanceTimersByTime(200)

      expect(screen.getByText('Bold')).toBeInTheDocument()
      expect(screen.getByText('Cmd+B')).toBeInTheDocument()
    })

    it('should render shortcut in kbd element for semantic markup', async () => {
      render(
        <Tooltip content="Italic" shortcut="Cmd+I">
          <button>I</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      fireEvent.mouseEnter(button.parentElement!)
      await advanceTimersByTime(200)

      const kbdElement = screen.getByText('Cmd+I')
      expect(kbdElement.tagName.toLowerCase()).toBe('kbd')
    })

    it('should not render shortcut element when not provided', async () => {
      render(
        <Tooltip content="No shortcut">
          <button>Click</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      fireEvent.mouseEnter(button.parentElement!)
      await advanceTimersByTime(200)

      // Check there are no kbd elements
      const tooltipContent = screen.getByText('No shortcut')
      expect(tooltipContent.closest('div')?.querySelector('kbd')).toBeNull()
    })

    it('should display Mac-style shortcuts correctly', async () => {
      const shortcuts = ['Cmd+B', 'Cmd+I', 'Cmd+Shift+Z', 'Cmd+Alt+1']

      for (const shortcut of shortcuts) {
        const { unmount } = render(
          <Tooltip content="Action" shortcut={shortcut}>
            <button>Btn</button>
          </Tooltip>
        )

        const button = screen.getByRole('button')
        fireEvent.mouseEnter(button.parentElement!)
        await advanceTimersByTime(200)

        expect(screen.getByText(shortcut)).toBeInTheDocument()
        unmount()
      }
    })
  })

  // ==========================================================================
  // Positioning
  // ==========================================================================

  describe('positioning', () => {
    it('should position tooltip at bottom by default', async () => {
      render(
        <Tooltip content="Bottom tooltip">
          <button>Trigger</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      fireEvent.mouseEnter(button.parentElement!)
      await advanceTimersByTime(200)

      // Get the tooltip container (has role="tooltip")
      const tooltip = screen.getByRole('tooltip')
      expect(tooltip).toHaveClass('top-full')
      expect(tooltip).toHaveClass('mt-1.5')
    })

    it('should position tooltip at top when specified', async () => {
      render(
        <Tooltip content="Top tooltip" position="top">
          <button>Trigger</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      fireEvent.mouseEnter(button.parentElement!)
      await advanceTimersByTime(200)

      const tooltip = screen.getByRole('tooltip')
      expect(tooltip).toHaveClass('bottom-full')
      expect(tooltip).toHaveClass('mb-1.5')
    })

    it('should center tooltip horizontally', async () => {
      render(
        <Tooltip content="Centered">
          <button>Trigger</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      fireEvent.mouseEnter(button.parentElement!)
      await advanceTimersByTime(200)

      const tooltip = screen.getByRole('tooltip')
      expect(tooltip).toHaveClass('left-1/2')
      expect(tooltip).toHaveClass('-translate-x-1/2')
    })

    it('should render arrow pointing up for bottom position', async () => {
      render(
        <Tooltip content="Bottom with arrow" position="bottom">
          <button>Trigger</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      fireEvent.mouseEnter(button.parentElement!)
      await advanceTimersByTime(200)

      const tooltip = screen.getByRole('tooltip')
      // Arrow is a sibling div inside the tooltip
      const arrow = tooltip.querySelector('div.rotate-45')
      expect(arrow).toBeInTheDocument()
      expect(arrow).toHaveClass('-top-1')
    })

    it('should render arrow pointing down for top position', async () => {
      render(
        <Tooltip content="Top with arrow" position="top">
          <button>Trigger</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      fireEvent.mouseEnter(button.parentElement!)
      await advanceTimersByTime(200)

      const tooltip = screen.getByRole('tooltip')
      const arrow = tooltip.querySelector('div.rotate-45')
      expect(arrow).toBeInTheDocument()
      expect(arrow).toHaveClass('-bottom-1')
    })
  })

  // ==========================================================================
  // Styling and Themes
  // ==========================================================================

  describe('styling and themes', () => {
    it('should have dark mode background classes', async () => {
      render(
        <Tooltip content="Dark mode ready">
          <button>Trigger</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      fireEvent.mouseEnter(button.parentElement!)
      await advanceTimersByTime(200)

      const tooltip = screen.getByRole('tooltip')
      expect(tooltip).toHaveClass('bg-slate-900')
      expect(tooltip).toHaveClass('dark:bg-slate-700')
    })

    it('should have animation classes for smooth appearance', async () => {
      render(
        <Tooltip content="Animated">
          <button>Trigger</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      fireEvent.mouseEnter(button.parentElement!)
      await advanceTimersByTime(200)

      const tooltip = screen.getByRole('tooltip')
      expect(tooltip).toHaveClass('animate-in')
      expect(tooltip).toHaveClass('fade-in-0')
      expect(tooltip).toHaveClass('zoom-in-95')
    })

    it('should have pointer-events-none to prevent interaction interference', async () => {
      render(
        <Tooltip content="Non-interactive">
          <button>Trigger</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      fireEvent.mouseEnter(button.parentElement!)
      await advanceTimersByTime(200)

      const tooltip = screen.getByRole('tooltip')
      expect(tooltip).toHaveClass('pointer-events-none')
    })

    it('should have z-50 for proper layering', async () => {
      render(
        <Tooltip content="High z-index">
          <button>Trigger</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      fireEvent.mouseEnter(button.parentElement!)
      await advanceTimersByTime(200)

      const tooltip = screen.getByRole('tooltip')
      expect(tooltip).toHaveClass('z-50')
    })
  })

  // ==========================================================================
  // Edge Cases and Rapid Interactions
  // ==========================================================================

  describe('edge cases and rapid interactions', () => {
    it('should handle rapid hover/unhover without errors', async () => {
      render(
        <Tooltip content="Rapid test">
          <button>Trigger</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      const wrapper = button.parentElement!

      // Rapidly hover and unhover multiple times
      for (let i = 0; i < 10; i++) {
        fireEvent.mouseEnter(wrapper)
        await advanceTimersByTime(50)
        fireEvent.mouseLeave(wrapper)
        await advanceTimersByTime(50)
      }

      // Tooltip should not be visible after rapid interactions
      expect(screen.queryByText('Rapid test')).not.toBeInTheDocument()
    })

    it('should handle re-hover before fully hidden', async () => {
      render(
        <Tooltip content="Re-hover test">
          <button>Trigger</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      const wrapper = button.parentElement!

      // Show tooltip
      fireEvent.mouseEnter(wrapper)
      await advanceTimersByTime(200)
      expect(screen.getByText('Re-hover test')).toBeInTheDocument()

      // Leave and immediately re-enter
      fireEvent.mouseLeave(wrapper)
      fireEvent.mouseEnter(wrapper)
      await advanceTimersByTime(200)

      // Should show again after delay
      expect(screen.getByText('Re-hover test')).toBeInTheDocument()
    })

    it('should handle empty content gracefully', async () => {
      render(
        <Tooltip content="">
          <button>Empty tooltip</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      fireEvent.mouseEnter(button.parentElement!)
      await advanceTimersByTime(200)

      // Should still render but with empty content
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should handle multiple tooltips on page independently', async () => {
      render(
        <div>
          <Tooltip content="Tooltip A">
            <button>Button A</button>
          </Tooltip>
          <Tooltip content="Tooltip B">
            <button>Button B</button>
          </Tooltip>
        </div>
      )

      const buttonA = screen.getByRole('button', { name: 'Button A' })
      const buttonB = screen.getByRole('button', { name: 'Button B' })

      // Hover A
      fireEvent.mouseEnter(buttonA.parentElement!)
      await advanceTimersByTime(200)
      expect(screen.getByText('Tooltip A')).toBeInTheDocument()
      expect(screen.queryByText('Tooltip B')).not.toBeInTheDocument()

      // Leave A, hover B
      fireEvent.mouseLeave(buttonA.parentElement!)
      fireEvent.mouseEnter(buttonB.parentElement!)
      await advanceTimersByTime(200)
      expect(screen.queryByText('Tooltip A')).not.toBeInTheDocument()
      expect(screen.getByText('Tooltip B')).toBeInTheDocument()
    })

    it('should cleanup timeout on unmount', async () => {
      const { unmount } = render(
        <Tooltip content="Unmount test">
          <button>Trigger</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      fireEvent.mouseEnter(button.parentElement!)
      await advanceTimersByTime(100)

      // Unmount before delay completes
      unmount()

      // Advancing timers should not cause errors
      await advanceTimersByTime(200)
    })

    it('should handle very long tooltip content', async () => {
      const longContent = 'This is a very long tooltip content that might wrap to multiple lines in some scenarios'

      render(
        <Tooltip content={longContent}>
          <button>Long content</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      fireEvent.mouseEnter(button.parentElement!)
      await advanceTimersByTime(200)

      expect(screen.getByText(longContent)).toBeInTheDocument()
      const tooltip = screen.getByRole('tooltip')
      expect(tooltip).toHaveClass('whitespace-nowrap')
    })

    it('should handle special characters in content', async () => {
      const specialContent = '<script>alert("xss")</script>'

      render(
        <Tooltip content={specialContent}>
          <button>Special chars</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      fireEvent.mouseEnter(button.parentElement!)
      await advanceTimersByTime(200)

      // Content should be escaped/rendered as text, not executed
      expect(screen.getByText(specialContent)).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Wrapper Element Behavior
  // ==========================================================================

  describe('wrapper element behavior', () => {
    it('should wrap children in inline-flex container', () => {
      render(
        <Tooltip content="Wrapper test">
          <button>Child</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      // Button is inside a span (for aria-describedby) inside the relative inline-flex div
      const wrapper = button.closest('.relative.inline-flex')
      expect(wrapper).toBeInTheDocument()
      expect(wrapper).toHaveClass('relative')
      expect(wrapper).toHaveClass('inline-flex')
    })

    it('should allow button clicks through the tooltip wrapper', async () => {
      const handleClick = jest.fn()

      render(
        <Tooltip content="Clickable">
          <button onClick={handleClick}>Click me</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should maintain focus on child elements', async () => {
      render(
        <Tooltip content="Focusable">
          <button>Focus me</button>
        </Tooltip>
      )

      const button = screen.getByRole('button')
      button.focus()

      expect(document.activeElement).toBe(button)
    })
  })
})
