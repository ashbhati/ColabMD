/**
 * Unit Tests for AICommentBadge Component
 *
 * Tests the AI-generated comment badge functionality including:
 * - Badge rendering with different props
 * - Confidence score display and color coding
 * - Category labels
 * - Suggested action display
 * - Reasoning tooltip
 * - Dark mode styling
 */

import { render, screen } from '@testing-library/react'
import { AICommentBadge } from '@/components/Comments/AICommentBadge'

describe('AICommentBadge Component', () => {
  // ==========================================================================
  // Basic Rendering
  // ==========================================================================

  describe('basic rendering', () => {
    it('should render AI badge by default', () => {
      render(<AICommentBadge />)

      expect(screen.getByText('AI')).toBeInTheDocument()
    })

    it('should render with AI globe icon', () => {
      render(<AICommentBadge />)

      // Check for the globe/AI icon SVG
      const aiBadge = screen.getByText('AI').closest('span')
      const svg = aiBadge?.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should have purple styling for AI badge', () => {
      render(<AICommentBadge />)

      const aiBadge = screen.getByText('AI').closest('span')
      expect(aiBadge).toHaveClass('bg-purple-100')
      expect(aiBadge).toHaveClass('text-purple-700')
    })

    it('should have dark mode styling for AI badge', () => {
      render(<AICommentBadge />)

      const aiBadge = screen.getByText('AI').closest('span')
      expect(aiBadge).toHaveClass('dark:bg-purple-900')
      expect(aiBadge).toHaveClass('dark:text-purple-300')
    })
  })

  // ==========================================================================
  // Confidence Score Display
  // ==========================================================================

  describe('confidence score display', () => {
    it('should display confidence as percentage', () => {
      render(<AICommentBadge confidence={0.85} />)

      expect(screen.getByText('85%')).toBeInTheDocument()
    })

    it('should round confidence to nearest integer', () => {
      render(<AICommentBadge confidence={0.857} />)

      expect(screen.getByText('86%')).toBeInTheDocument()
    })

    it('should not render confidence badge when undefined', () => {
      render(<AICommentBadge />)

      // Only AI badge should be present
      expect(screen.queryByText('%')).not.toBeInTheDocument()
    })

    it('should handle 0% confidence', () => {
      render(<AICommentBadge confidence={0} />)

      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('should handle 100% confidence', () => {
      render(<AICommentBadge confidence={1} />)

      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('should have title with exact confidence value', () => {
      render(<AICommentBadge confidence={0.857} />)

      const confidenceBadge = screen.getByText('86%')
      expect(confidenceBadge).toHaveAttribute('title', 'Confidence: 86%')
    })
  })

  // ==========================================================================
  // Confidence Color Coding
  // ==========================================================================

  describe('confidence color coding', () => {
    it('should show green for high confidence (>= 0.8)', () => {
      render(<AICommentBadge confidence={0.85} />)

      const confidenceBadge = screen.getByText('85%')
      expect(confidenceBadge).toHaveClass('bg-green-100')
      expect(confidenceBadge).toHaveClass('text-green-700')
    })

    it('should show green dark mode styling for high confidence', () => {
      render(<AICommentBadge confidence={0.9} />)

      const confidenceBadge = screen.getByText('90%')
      expect(confidenceBadge).toHaveClass('dark:bg-green-900')
      expect(confidenceBadge).toHaveClass('dark:text-green-300')
    })

    it('should show yellow for medium confidence (>= 0.5, < 0.8)', () => {
      render(<AICommentBadge confidence={0.65} />)

      const confidenceBadge = screen.getByText('65%')
      expect(confidenceBadge).toHaveClass('bg-yellow-100')
      expect(confidenceBadge).toHaveClass('text-yellow-700')
    })

    it('should show yellow dark mode styling for medium confidence', () => {
      render(<AICommentBadge confidence={0.5} />)

      const confidenceBadge = screen.getByText('50%')
      expect(confidenceBadge).toHaveClass('dark:bg-yellow-900')
      expect(confidenceBadge).toHaveClass('dark:text-yellow-300')
    })

    it('should show red for low confidence (< 0.5)', () => {
      render(<AICommentBadge confidence={0.3} />)

      const confidenceBadge = screen.getByText('30%')
      expect(confidenceBadge).toHaveClass('bg-red-100')
      expect(confidenceBadge).toHaveClass('text-red-700')
    })

    it('should show red dark mode styling for low confidence', () => {
      render(<AICommentBadge confidence={0.2} />)

      const confidenceBadge = screen.getByText('20%')
      expect(confidenceBadge).toHaveClass('dark:bg-red-900')
      expect(confidenceBadge).toHaveClass('dark:text-red-300')
    })

    it('should handle boundary value 0.8 as high confidence', () => {
      render(<AICommentBadge confidence={0.8} />)

      const confidenceBadge = screen.getByText('80%')
      expect(confidenceBadge).toHaveClass('bg-green-100')
    })

    it('should handle boundary value 0.5 as medium confidence', () => {
      render(<AICommentBadge confidence={0.5} />)

      const confidenceBadge = screen.getByText('50%')
      expect(confidenceBadge).toHaveClass('bg-yellow-100')
    })

    it('should handle boundary value 0.49 as low confidence', () => {
      render(<AICommentBadge confidence={0.49} />)

      const confidenceBadge = screen.getByText('49%')
      expect(confidenceBadge).toHaveClass('bg-red-100')
    })

    it('should handle boundary value 0.79 as medium confidence', () => {
      render(<AICommentBadge confidence={0.79} />)

      const confidenceBadge = screen.getByText('79%')
      expect(confidenceBadge).toHaveClass('bg-yellow-100')
    })
  })

  // ==========================================================================
  // Category Labels
  // ==========================================================================

  describe('category labels', () => {
    it('should display Grammar category', () => {
      render(<AICommentBadge category="grammar" />)

      expect(screen.getByText('Grammar')).toBeInTheDocument()
    })

    it('should display Style category', () => {
      render(<AICommentBadge category="style" />)

      expect(screen.getByText('Style')).toBeInTheDocument()
    })

    it('should display Clarity category', () => {
      render(<AICommentBadge category="clarity" />)

      expect(screen.getByText('Clarity')).toBeInTheDocument()
    })

    it('should display Factual category', () => {
      render(<AICommentBadge category="factual" />)

      expect(screen.getByText('Factual')).toBeInTheDocument()
    })

    it('should display Suggestion category', () => {
      render(<AICommentBadge category="suggestion" />)

      expect(screen.getByText('Suggestion')).toBeInTheDocument()
    })

    it('should display Question category', () => {
      render(<AICommentBadge category="question" />)

      expect(screen.getByText('Question')).toBeInTheDocument()
    })

    it('should not render category badge when undefined', () => {
      render(<AICommentBadge />)

      // Check that none of the category labels are present
      expect(screen.queryByText('Grammar')).not.toBeInTheDocument()
      expect(screen.queryByText('Style')).not.toBeInTheDocument()
    })

    it('should have slate styling for category badge', () => {
      render(<AICommentBadge category="grammar" />)

      const categoryBadge = screen.getByText('Grammar')
      expect(categoryBadge).toHaveClass('bg-slate-100')
      expect(categoryBadge).toHaveClass('text-slate-600')
    })

    it('should have dark mode styling for category badge', () => {
      render(<AICommentBadge category="clarity" />)

      const categoryBadge = screen.getByText('Clarity')
      expect(categoryBadge).toHaveClass('dark:bg-slate-800')
      expect(categoryBadge).toHaveClass('dark:text-slate-400')
    })
  })

  // ==========================================================================
  // Suggested Action Display
  // ==========================================================================

  describe('suggested action display', () => {
    it('should display "Consider accepting" for accept action', () => {
      render(<AICommentBadge suggestedAction="accept" />)

      expect(screen.getByText('Consider accepting')).toBeInTheDocument()
    })

    it('should display "Consider rejecting" for reject action', () => {
      render(<AICommentBadge suggestedAction="reject" />)

      expect(screen.getByText('Consider rejecting')).toBeInTheDocument()
    })

    it('should display "Needs review" for review action', () => {
      render(<AICommentBadge suggestedAction="review" />)

      expect(screen.getByText('Needs review')).toBeInTheDocument()
    })

    it('should not display badge for none action', () => {
      render(<AICommentBadge suggestedAction="none" />)

      expect(screen.queryByText('Consider accepting')).not.toBeInTheDocument()
      expect(screen.queryByText('Consider rejecting')).not.toBeInTheDocument()
      expect(screen.queryByText('Needs review')).not.toBeInTheDocument()
    })

    it('should not render action badge when undefined', () => {
      render(<AICommentBadge />)

      expect(screen.queryByText('Consider')).not.toBeInTheDocument()
      expect(screen.queryByText('Needs review')).not.toBeInTheDocument()
    })

    it('should have indigo styling for action badge', () => {
      render(<AICommentBadge suggestedAction="accept" />)

      const actionBadge = screen.getByText('Consider accepting')
      expect(actionBadge).toHaveClass('bg-indigo-100')
      expect(actionBadge).toHaveClass('text-indigo-700')
    })

    it('should have dark mode styling for action badge', () => {
      render(<AICommentBadge suggestedAction="review" />)

      const actionBadge = screen.getByText('Needs review')
      expect(actionBadge).toHaveClass('dark:bg-indigo-900')
      expect(actionBadge).toHaveClass('dark:text-indigo-300')
    })
  })

  // ==========================================================================
  // Reasoning Tooltip
  // ==========================================================================

  describe('reasoning tooltip', () => {
    it('should render info icon when reasoning is provided', () => {
      render(<AICommentBadge reasoning="This is the reasoning behind the suggestion." />)

      // Should have an info icon (circle with i)
      const icons = document.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(1) // AI icon + info icon
    })

    it('should have title attribute with reasoning text', () => {
      const reasoning = 'The sentence contains a subject-verb agreement error.'
      render(<AICommentBadge reasoning={reasoning} />)

      const infoElement = document.querySelector('[title]')
      expect(infoElement).toHaveAttribute('title', reasoning)
    })

    it('should not render info icon when reasoning is undefined', () => {
      render(<AICommentBadge />)

      // Only the AI icon should be present
      const icons = document.querySelectorAll('svg')
      expect(icons.length).toBe(1)
    })

    it('should have cursor-help styling for reasoning icon', () => {
      render(<AICommentBadge reasoning="Some reasoning" />)

      const reasoningContainer = document.querySelector('.cursor-help')
      expect(reasoningContainer).toBeInTheDocument()
    })

    it('should have slate color for reasoning icon', () => {
      render(<AICommentBadge reasoning="Some reasoning" />)

      const reasoningContainer = document.querySelector('.cursor-help')
      expect(reasoningContainer).toHaveClass('text-slate-400')
    })

    it('should have dark mode styling for reasoning icon', () => {
      render(<AICommentBadge reasoning="Some reasoning" />)

      const reasoningContainer = document.querySelector('.cursor-help')
      expect(reasoningContainer).toHaveClass('dark:text-slate-500')
    })
  })

  // ==========================================================================
  // Combined Props Display
  // ==========================================================================

  describe('combined props display', () => {
    it('should display all badges when all props are provided', () => {
      render(
        <AICommentBadge
          confidence={0.85}
          category="grammar"
          suggestedAction="accept"
          reasoning="Grammar correction needed."
        />
      )

      expect(screen.getByText('AI')).toBeInTheDocument()
      expect(screen.getByText('85%')).toBeInTheDocument()
      expect(screen.getByText('Grammar')).toBeInTheDocument()
      expect(screen.getByText('Consider accepting')).toBeInTheDocument()
    })

    it('should display badges in correct order', () => {
      render(
        <AICommentBadge
          confidence={0.7}
          category="style"
          suggestedAction="review"
          reasoning="Style improvement."
        />
      )

      const container = screen.getByText('AI').closest('.flex')
      const badges = container?.querySelectorAll('span')

      // Order: AI badge, Confidence, Category, Action, Reasoning icon
      expect(badges?.[0]?.textContent).toContain('AI')
      expect(badges?.[1]?.textContent).toContain('70%')
      expect(badges?.[2]?.textContent).toContain('Style')
      expect(badges?.[3]?.textContent).toContain('Needs review')
    })

    it('should handle partial props gracefully', () => {
      render(
        <AICommentBadge
          confidence={0.9}
          category="factual"
          // No suggestedAction or reasoning
        />
      )

      expect(screen.getByText('AI')).toBeInTheDocument()
      expect(screen.getByText('90%')).toBeInTheDocument()
      expect(screen.getByText('Factual')).toBeInTheDocument()
      expect(screen.queryByText('Consider')).not.toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Custom className
  // ==========================================================================

  describe('custom className', () => {
    it('should apply custom className to container', () => {
      render(<AICommentBadge className="custom-class" />)

      const container = screen.getByText('AI').closest('.flex')
      expect(container).toHaveClass('custom-class')
    })

    it('should merge custom className with default classes', () => {
      render(<AICommentBadge className="my-custom-class" />)

      const container = screen.getByText('AI').closest('.flex')
      expect(container).toHaveClass('flex')
      expect(container).toHaveClass('flex-wrap')
      expect(container).toHaveClass('items-center')
      expect(container).toHaveClass('my-custom-class')
    })
  })

  // ==========================================================================
  // Layout and Styling
  // ==========================================================================

  describe('layout and styling', () => {
    it('should use flex container with wrapping', () => {
      render(<AICommentBadge />)

      const container = screen.getByText('AI').closest('.flex')
      expect(container).toHaveClass('flex')
      expect(container).toHaveClass('flex-wrap')
    })

    it('should have gap between badges', () => {
      render(<AICommentBadge confidence={0.8} category="grammar" />)

      const container = screen.getByText('AI').closest('.flex')
      expect(container).toHaveClass('gap-1.5')
    })

    it('should have margin bottom on container', () => {
      render(<AICommentBadge />)

      const container = screen.getByText('AI').closest('.flex')
      expect(container).toHaveClass('mb-2')
    })

    it('should use rounded-full for pill-shaped badges', () => {
      render(<AICommentBadge confidence={0.8} category="grammar" suggestedAction="accept" />)

      const badges = document.querySelectorAll('.rounded-full')
      expect(badges.length).toBeGreaterThanOrEqual(4) // AI, confidence, category, action
    })

    it('should use appropriate padding for badges', () => {
      render(<AICommentBadge />)

      const aiBadge = screen.getByText('AI').closest('span')
      expect(aiBadge).toHaveClass('px-2')
      expect(aiBadge).toHaveClass('py-0.5')
    })

    it('should use small text size for badges', () => {
      render(<AICommentBadge />)

      const aiBadge = screen.getByText('AI').closest('span')
      expect(aiBadge).toHaveClass('text-xs')
    })

    it('should use medium font weight for badges', () => {
      render(<AICommentBadge />)

      const aiBadge = screen.getByText('AI').closest('span')
      expect(aiBadge).toHaveClass('font-medium')
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle very long reasoning text', () => {
      const longReasoning = 'A'.repeat(500)
      render(<AICommentBadge reasoning={longReasoning} />)

      const infoElement = document.querySelector('[title]')
      expect(infoElement).toHaveAttribute('title', longReasoning)
    })

    it('should handle empty string reasoning', () => {
      render(<AICommentBadge reasoning="" />)

      // Empty reasoning should not render the icon
      const reasoningContainer = document.querySelector('.cursor-help')
      expect(reasoningContainer).not.toBeInTheDocument()
    })

    it('should handle confidence at exact boundaries', () => {
      // Test 0.5 (yellow) vs 0.49 (red - rounds to 49%)
      const { rerender } = render(<AICommentBadge confidence={0.5} />)
      expect(screen.getByText('50%')).toHaveClass('bg-yellow-100')

      // 0.49 rounds to 49% which is red (< 0.5)
      rerender(<AICommentBadge confidence={0.49} />)
      expect(screen.getByText('49%')).toHaveClass('bg-red-100')

      // Test 0.8 (green) vs 0.79 (yellow - rounds to 79%)
      rerender(<AICommentBadge confidence={0.8} />)
      expect(screen.getByText('80%')).toHaveClass('bg-green-100')

      // 0.79 rounds to 79% which is yellow (< 0.8)
      rerender(<AICommentBadge confidence={0.79} />)
      expect(screen.getByText('79%')).toHaveClass('bg-yellow-100')
    })

    it('should handle invalid category gracefully', () => {
      // @ts-expect-error - Testing invalid category
      render(<AICommentBadge category="invalid" />)

      // Should not crash, category should not be rendered
      expect(screen.queryByText('invalid')).not.toBeInTheDocument()
    })

    it('should handle invalid suggestedAction gracefully', () => {
      // @ts-expect-error - Testing invalid action
      render(<AICommentBadge suggestedAction="invalid" />)

      // Should not crash, action should not be rendered
      expect(screen.queryByText('Consider')).not.toBeInTheDocument()
    })
  })
})
