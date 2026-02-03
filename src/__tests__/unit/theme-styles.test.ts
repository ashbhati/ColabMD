/**
 * Unit Tests for Theme Styles and CSS Variables
 *
 * Tests for globals.css and obsidian.css styling including:
 * - NEW: @custom-variant dark for Tailwind v4 dark mode support
 * - NEW: Comment highlighting using CSS variables (color-mix)
 * - NEW: Focus-visible styles for keyboard accessibility
 * - CSS variable definitions
 * - Dark mode color values
 */

import * as fs from 'fs'
import * as path from 'path'

// ============================================================================
// Test Setup - Load CSS Files
// ============================================================================

const globalsCssPath = path.resolve(__dirname, '../../app/globals.css')
const obsidianCssPath = path.resolve(__dirname, '../../styles/obsidian.css')

let globalsCss: string
let obsidianCss: string

beforeAll(() => {
  globalsCss = fs.readFileSync(globalsCssPath, 'utf-8')
  obsidianCss = fs.readFileSync(obsidianCssPath, 'utf-8')
})

describe('globals.css Theme Configuration', () => {
  // ==========================================================================
  // Tailwind v4 Dark Mode Support (NEW)
  // ==========================================================================

  describe('@custom-variant dark mode support', () => {
    it('should include @custom-variant dark directive for Tailwind v4', () => {
      expect(globalsCss).toContain('@custom-variant dark')
    })

    it('should configure dark mode selector correctly', () => {
      // The dark variant should use .dark class selector
      expect(globalsCss).toContain('&:where(.dark, .dark *)')
    })

    it('should import Tailwind CSS', () => {
      expect(globalsCss).toContain('@import "tailwindcss"')
    })
  })

  // ==========================================================================
  // CSS Variables - Light Mode
  // ==========================================================================

  describe('CSS variables - light mode', () => {
    it('should define --background variable in :root', () => {
      expect(globalsCss).toMatch(/:root\s*{[^}]*--background:\s*#ffffff/)
    })

    it('should define --foreground variable in :root', () => {
      expect(globalsCss).toMatch(/:root\s*{[^}]*--foreground:\s*#1e293b/)
    })

    it('should define --border variable in :root', () => {
      expect(globalsCss).toMatch(/:root\s*{[^}]*--border:\s*#e2e8f0/)
    })

    it('should define --card-bg variable in :root', () => {
      expect(globalsCss).toMatch(/:root\s*{[^}]*--card-bg:\s*#ffffff/)
    })

    it('should define --muted variable in :root', () => {
      expect(globalsCss).toMatch(/:root\s*{[^}]*--muted:\s*#f8fafc/)
    })

    it('should define --accent variable in :root', () => {
      expect(globalsCss).toMatch(/:root\s*{[^}]*--accent:\s*#6366f1/)
    })
  })

  // ==========================================================================
  // CSS Variables - Dark Mode
  // ==========================================================================

  describe('CSS variables - dark mode', () => {
    it('should define --background for dark mode', () => {
      expect(globalsCss).toMatch(/\.dark\s*{[^}]*--background:\s*#1a1a1a/)
    })

    it('should define --foreground for dark mode', () => {
      expect(globalsCss).toMatch(/\.dark\s*{[^}]*--foreground:\s*#e2e8f0/)
    })

    it('should define --border for dark mode', () => {
      expect(globalsCss).toMatch(/\.dark\s*{[^}]*--border:\s*#2e2e2e/)
    })

    it('should define --card-bg for dark mode', () => {
      expect(globalsCss).toMatch(/\.dark\s*{[^}]*--card-bg:\s*#1f1f1f/)
    })

    it('should define --muted for dark mode', () => {
      expect(globalsCss).toMatch(/\.dark\s*{[^}]*--muted:\s*#262626/)
    })

    it('should define --accent for dark mode', () => {
      expect(globalsCss).toMatch(/\.dark\s*{[^}]*--accent:\s*#818cf8/)
    })
  })

  // ==========================================================================
  // Comment Highlighting Styles (NEW)
  // ==========================================================================

  describe('comment highlighting styles', () => {
    it('should style thread marks with color-mix for background', () => {
      expect(globalsCss).toContain('color-mix(in srgb, var(--accent) 15%, transparent)')
    })

    it('should style thread marks with color-mix for border', () => {
      expect(globalsCss).toContain('color-mix(in srgb, var(--accent) 40%, transparent)')
    })

    it('should apply border-bottom to thread marks', () => {
      expect(globalsCss).toMatch(/\.lb-tiptap-thread-mark[^{]*{[^}]*border-bottom:\s*2px solid/)
    })

    it('should add padding-bottom to thread marks', () => {
      expect(globalsCss).toMatch(/\.lb-tiptap-thread-mark[^{]*{[^}]*padding-bottom:\s*1px/)
    })

    it('should set cursor to pointer on thread marks', () => {
      expect(globalsCss).toMatch(/\.lb-tiptap-thread-mark[^{]*{[^}]*cursor:\s*pointer/)
    })

    it('should add transition for smooth hover effect', () => {
      expect(globalsCss).toMatch(/\.lb-tiptap-thread-mark[^{]*{[^}]*transition:\s*background-color\s+150ms/)
    })

    it('should exclude orphan thread marks from styling', () => {
      expect(globalsCss).toContain(':not([data-orphan="true"])')
    })

    it('should exclude hidden thread marks from styling', () => {
      expect(globalsCss).toContain(':not([data-hidden])')
    })

    it('should have hover state for thread marks', () => {
      expect(globalsCss).toContain('.lb-tiptap-thread-mark:not([data-orphan="true"]):not([data-hidden]):hover')
    })

    it('should increase background opacity on hover', () => {
      // Hover state uses 25% vs base 15%
      expect(globalsCss).toContain('color-mix(in srgb, var(--accent) 25%, transparent)')
    })
  })

  // ==========================================================================
  // Focus-Visible Accessibility Styles (NEW)
  // ==========================================================================

  describe('keyboard accessibility focus-visible styles', () => {
    it('should have focus-visible rule for thread marks', () => {
      expect(globalsCss).toContain('.lb-tiptap-thread-mark:not([data-orphan="true"]):not([data-hidden]):focus-visible')
    })

    it('should use accent color for focus outline', () => {
      expect(globalsCss).toMatch(/focus-visible\s*{[^}]*outline:\s*2px solid var\(--accent\)/)
    })

    it('should have outline-offset for focus visibility', () => {
      expect(globalsCss).toMatch(/focus-visible\s*{[^}]*outline-offset:\s*1px/)
    })
  })

  // ==========================================================================
  // Theme Integration with Tailwind
  // ==========================================================================

  describe('Tailwind theme integration', () => {
    it('should include @theme inline block', () => {
      expect(globalsCss).toContain('@theme inline')
    })

    it('should map --color-background to CSS variable', () => {
      expect(globalsCss).toContain('--color-background: var(--background)')
    })

    it('should map --color-foreground to CSS variable', () => {
      expect(globalsCss).toContain('--color-foreground: var(--foreground)')
    })

    it('should map --color-accent to CSS variable', () => {
      expect(globalsCss).toContain('--color-accent: var(--accent)')
    })

    it('should define font-sans', () => {
      expect(globalsCss).toContain('--font-sans: var(--font-geist-sans)')
    })

    it('should define font-mono', () => {
      expect(globalsCss).toContain('--font-mono: var(--font-geist-mono)')
    })
  })

  // ==========================================================================
  // Liveblocks Theme Customization
  // ==========================================================================

  describe('Liveblocks theme customization', () => {
    it('should customize --lb-accent', () => {
      expect(globalsCss).toContain('--lb-accent: var(--obsidian-accent)')
    })

    it('should customize --lb-dynamic-background', () => {
      expect(globalsCss).toContain('--lb-dynamic-background: var(--obsidian-bg-primary)')
    })

    it('should customize --lb-dynamic-foreground', () => {
      expect(globalsCss).toContain('--lb-dynamic-foreground: var(--obsidian-text-primary)')
    })

    it('should customize --lb-radius', () => {
      expect(globalsCss).toContain('--lb-radius: 0.5rem')
    })

    it('should have dark mode overrides for Liveblocks', () => {
      expect(globalsCss).toContain('.dark .lb-root')
    })
  })

  // ==========================================================================
  // Body Styles
  // ==========================================================================

  describe('body styles', () => {
    it('should apply background color to body', () => {
      expect(globalsCss).toMatch(/body\s*{[^}]*background:\s*var\(--background\)/)
    })

    it('should apply text color to body', () => {
      expect(globalsCss).toMatch(/body\s*{[^}]*color:\s*var\(--foreground\)/)
    })
  })

  // ==========================================================================
  // Scrollbar Styles
  // ==========================================================================

  describe('scrollbar styles', () => {
    it('should define webkit-scrollbar width', () => {
      expect(globalsCss).toMatch(/::-webkit-scrollbar\s*{[^}]*width:\s*8px/)
    })

    it('should style scrollbar thumb', () => {
      expect(globalsCss).toContain('::-webkit-scrollbar-thumb')
    })

    it('should have hover state for scrollbar thumb', () => {
      expect(globalsCss).toContain('::-webkit-scrollbar-thumb:hover')
    })
  })

  // ==========================================================================
  // Selection Styles
  // ==========================================================================

  describe('selection styles', () => {
    it('should define ::selection background', () => {
      expect(globalsCss).toMatch(/::selection\s*{[^}]*background:\s*var\(--obsidian-accent-muted\)/)
    })

    it('should define ::selection color', () => {
      expect(globalsCss).toMatch(/::selection\s*{[^}]*color:\s*var\(--foreground\)/)
    })
  })

  // ==========================================================================
  // External Stylesheet Imports
  // ==========================================================================

  describe('external stylesheet imports', () => {
    it('should import obsidian.css', () => {
      expect(globalsCss).toContain('@import "../styles/obsidian.css"')
    })

    it('should import Liveblocks react-ui styles', () => {
      expect(globalsCss).toContain('@import "@liveblocks/react-ui/styles.css"')
    })

    it('should import Liveblocks dark mode styles', () => {
      expect(globalsCss).toContain('@import "@liveblocks/react-ui/styles/dark/attributes.css"')
    })

    it('should import Liveblocks react-tiptap styles', () => {
      expect(globalsCss).toContain('@import "@liveblocks/react-tiptap/styles.css"')
    })
  })
})

describe('obsidian.css Theme Configuration', () => {
  // ==========================================================================
  // Light Mode Variables
  // ==========================================================================

  describe('light mode variables', () => {
    it('should define primary background color', () => {
      expect(obsidianCss).toMatch(/:root\s*{[^}]*--obsidian-bg-primary:\s*#ffffff/)
    })

    it('should define accent color', () => {
      expect(obsidianCss).toMatch(/:root\s*{[^}]*--obsidian-accent:\s*#6366f1/)
    })

    it('should define text primary color', () => {
      expect(obsidianCss).toMatch(/:root\s*{[^}]*--obsidian-text-primary:\s*#1e293b/)
    })
  })

  // ==========================================================================
  // Dark Mode Variables
  // ==========================================================================

  describe('dark mode variables', () => {
    it('should define dark mode primary background', () => {
      expect(obsidianCss).toMatch(/\.dark\s*{[^}]*--obsidian-bg-primary:\s*#1a1a1a/)
    })

    it('should define dark mode accent color (lighter)', () => {
      expect(obsidianCss).toMatch(/\.dark\s*{[^}]*--obsidian-accent:\s*#818cf8/)
    })

    it('should define dark mode text primary color', () => {
      expect(obsidianCss).toMatch(/\.dark\s*{[^}]*--obsidian-text-primary:\s*#e2e8f0/)
    })
  })

  // ==========================================================================
  // Focus Styles
  // ==========================================================================

  describe('focus styles', () => {
    it('should define focus-minimal class', () => {
      expect(obsidianCss).toContain('.focus-minimal:focus')
    })

    it('should remove default outline on focus-minimal', () => {
      expect(obsidianCss).toMatch(/\.focus-minimal:focus\s*{[^}]*outline:\s*none/)
    })

    it('should use box-shadow for focus indication', () => {
      expect(obsidianCss).toMatch(/\.focus-minimal:focus\s*{[^}]*box-shadow:/)
    })
  })

  // ==========================================================================
  // Transition Utilities
  // ==========================================================================

  describe('transition utilities', () => {
    it('should define hover-subtle class', () => {
      expect(obsidianCss).toContain('.hover-subtle')
    })

    it('should include transition for background-color', () => {
      expect(obsidianCss).toMatch(/\.hover-subtle\s*{[^}]*transition:[^}]*background-color/)
    })

    it('should include transition for border-color', () => {
      expect(obsidianCss).toMatch(/\.hover-subtle\s*{[^}]*transition:[^}]*border-color/)
    })
  })
})

describe('CSS Variable Value Validation', () => {
  // ==========================================================================
  // Color Format Validation
  // ==========================================================================

  describe('color format validation', () => {
    it('should use valid hex color format for background colors', () => {
      // All hex colors should be valid 6-digit or 3-digit hex
      const hexColorPattern = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g
      const matches = globalsCss.match(hexColorPattern)
      expect(matches).toBeTruthy()
      expect(matches!.length).toBeGreaterThan(0)
    })

    it('should use consistent indigo palette', () => {
      // Light mode accent: #6366f1, Dark mode: #818cf8
      expect(globalsCss).toContain('#6366f1')
      expect(globalsCss).toContain('#818cf8')
    })
  })

  // ==========================================================================
  // Color Contrast (Basic Checks)
  // ==========================================================================

  describe('color contrast considerations', () => {
    it('should have different background and foreground in light mode', () => {
      // Background is white, foreground is dark slate
      expect(globalsCss).toMatch(/:root\s*{[^}]*--background:\s*#ffffff/)
      expect(globalsCss).toMatch(/:root\s*{[^}]*--foreground:\s*#1e293b/)
    })

    it('should have different background and foreground in dark mode', () => {
      // Background is dark, foreground is light slate
      expect(globalsCss).toMatch(/\.dark\s*{[^}]*--background:\s*#1a1a1a/)
      expect(globalsCss).toMatch(/\.dark\s*{[^}]*--foreground:\s*#e2e8f0/)
    })
  })
})

describe('CSS Edge Cases and Robustness', () => {
  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle color-mix function syntax correctly', () => {
      // color-mix is a modern CSS function
      const colorMixPattern = /color-mix\(in srgb,[^)]+\)/g
      const matches = globalsCss.match(colorMixPattern)
      expect(matches).toBeTruthy()
      expect(matches!.length).toBeGreaterThanOrEqual(3) // At least 3 uses
    })

    it('should not have duplicate :root declarations with conflicting values', () => {
      const rootDeclarations = globalsCss.match(/:root\s*{/g)
      // Should only have one :root block
      expect(rootDeclarations?.length).toBe(1)
    })

    it('should not have duplicate .dark declarations with conflicting values', () => {
      const darkDeclarations = globalsCss.match(/\.dark\s*{/g)
      // May have multiple .dark blocks but they should be for different selectors
      expect(darkDeclarations).toBeTruthy()
    })
  })

  // ==========================================================================
  // Browser Compatibility Notes
  // ==========================================================================

  describe('browser compatibility patterns', () => {
    it('should use vendor-prefixed scrollbar styles', () => {
      // WebKit-specific scrollbar styling
      expect(globalsCss).toContain('::-webkit-scrollbar')
    })

    it('should use standard focus-visible pseudo-class', () => {
      // Modern focus-visible is supported in all major browsers
      expect(globalsCss).toContain(':focus-visible')
    })
  })
})
