/**
 * Unit Tests for Thread Component Props (Issues #3 and #4 Fix)
 *
 * Tests the fixes for:
 * - Issue #3: Emoji/reaction button not working (showReactions prop)
 * - Issue #4: "..." overflow menu empty (showActions and showResolveAction props)
 *
 * These tests verify that the Thread component receives the correct props
 * to enable reactions, actions menu, and resolve functionality.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

// ============================================================================
// Mock Setup
// ============================================================================

// Track props passed to Thread component
const capturedThreadProps: Array<{
  thread: { id: string };
  showActions?: boolean;
  showComposer?: string;
  showResolveAction?: boolean;
  showReactions?: boolean;
}> = [];

// Mock Liveblocks Thread component to capture props
jest.mock('@liveblocks/react-ui', () => ({
  Thread: (props: {
    thread: { id: string };
    showActions?: boolean;
    showComposer?: string;
    showResolveAction?: boolean;
    showReactions?: boolean;
  }) => {
    capturedThreadProps.push(props);
    return (
      <div
        data-testid={`thread-${props.thread.id}`}
        data-show-actions={props.showActions}
        data-show-composer={props.showComposer}
        data-show-resolve-action={props.showResolveAction}
        data-show-reactions={props.showReactions}
      >
        Thread: {props.thread.id}
      </div>
    );
  },
}));

// Mock threads data
let mockThreads: Array<{
  id: string;
  metadata?: {
    resolved?: boolean;
    aiGenerated?: boolean;
    aiConfidence?: number;
    aiCategory?: string;
    aiSuggestedAction?: string;
    aiReasoning?: string;
  };
}> = [];

jest.mock('../../../liveblocks.config', () => ({
  useThreads: () => ({ threads: mockThreads }),
}));

// Import component after mocks
import { CommentsSidebar } from '@/components/Comments';

describe('Thread Component Props (Issues #3 and #4 Fix)', () => {
  beforeEach(() => {
    capturedThreadProps.length = 0;
    mockThreads = [];
  });

  // ==========================================================================
  // Issue #3: Emoji/Reaction Button (showReactions prop)
  // ==========================================================================

  describe('Issue #3: showReactions prop for emoji/reaction button', () => {
    it('should pass showReactions={true} to Thread component', () => {
      mockThreads = [
        { id: 'thread-1', metadata: { resolved: false } },
      ];

      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />);

      const threadEl = screen.getByTestId('thread-thread-1');
      expect(threadEl).toHaveAttribute('data-show-reactions', 'true');
    });

    it('should enable reactions for multiple unresolved threads', () => {
      mockThreads = [
        { id: 'thread-1', metadata: { resolved: false } },
        { id: 'thread-2', metadata: { resolved: false } },
        { id: 'thread-3', metadata: { resolved: false } },
      ];

      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />);

      const threads = screen.getAllByTestId(/^thread-thread-/);
      threads.forEach((thread) => {
        expect(thread).toHaveAttribute('data-show-reactions', 'true');
      });
    });

    it('should enable reactions for resolved threads', () => {
      mockThreads = [
        { id: 'resolved-1', metadata: { resolved: true } },
      ];

      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />);

      const threadEl = screen.getByTestId('thread-resolved-1');
      expect(threadEl).toHaveAttribute('data-show-reactions', 'true');
    });

    it('should enable reactions for AI-generated threads', () => {
      mockThreads = [
        {
          id: 'ai-thread-1',
          metadata: {
            resolved: false,
            aiGenerated: true,
            aiConfidence: 0.9,
            aiCategory: 'grammar',
          },
        },
      ];

      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />);

      const threadEl = screen.getByTestId('thread-ai-thread-1');
      expect(threadEl).toHaveAttribute('data-show-reactions', 'true');
    });

    it('should capture showReactions in props object', () => {
      mockThreads = [
        { id: 'capture-test', metadata: { resolved: false } },
      ];

      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />);

      expect(capturedThreadProps.length).toBeGreaterThan(0);
      const props = capturedThreadProps.find(p => p.thread.id === 'capture-test');
      expect(props?.showReactions).toBe(true);
    });
  });

  // ==========================================================================
  // Issue #4: Actions Menu (showActions prop)
  // ==========================================================================

  describe('Issue #4: showActions prop for overflow menu', () => {
    it('should pass showActions={true} to Thread component', () => {
      mockThreads = [
        { id: 'thread-1', metadata: { resolved: false } },
      ];

      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />);

      const threadEl = screen.getByTestId('thread-thread-1');
      expect(threadEl).toHaveAttribute('data-show-actions', 'true');
    });

    it('should enable actions for all threads regardless of state', () => {
      mockThreads = [
        { id: 'unresolved-1', metadata: { resolved: false } },
        { id: 'resolved-1', metadata: { resolved: true } },
        { id: 'no-metadata' },
        { id: 'ai-thread', metadata: { resolved: false, aiGenerated: true } },
      ];

      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />);

      // All threads should have showActions enabled
      capturedThreadProps.forEach((props) => {
        expect(props.showActions).toBe(true);
      });
    });

    it('should capture showActions as explicit true in props', () => {
      mockThreads = [
        { id: 'explicit-test', metadata: { resolved: false } },
      ];

      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />);

      const props = capturedThreadProps.find(p => p.thread.id === 'explicit-test');
      // Must be explicitly true, not just truthy
      expect(props?.showActions).toBe(true);
      expect(typeof props?.showActions).toBe('boolean');
    });
  });

  // ==========================================================================
  // Issue #4: Resolve Action (showResolveAction prop)
  // ==========================================================================

  describe('Issue #4: showResolveAction prop for resolve button', () => {
    it('should pass showResolveAction to Thread component', () => {
      mockThreads = [
        { id: 'thread-1', metadata: { resolved: false } },
      ];

      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />);

      const threadEl = screen.getByTestId('thread-thread-1');
      expect(threadEl).toHaveAttribute('data-show-resolve-action', 'true');
    });

    it('should enable resolve action for unresolved threads', () => {
      mockThreads = [
        { id: 'unresolved-1', metadata: { resolved: false } },
        { id: 'unresolved-2', metadata: { resolved: false } },
      ];

      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />);

      const unresolvedThreads = capturedThreadProps.filter(
        p => !p.thread.id.includes('resolved') || p.thread.id.includes('unresolved')
      );
      unresolvedThreads.forEach((props) => {
        expect(props.showResolveAction).toBe(true);
      });
    });

    it('should also show resolve action for resolved threads (to unresolve)', () => {
      mockThreads = [
        { id: 'resolved-thread', metadata: { resolved: true } },
      ];

      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />);

      const props = capturedThreadProps.find(p => p.thread.id === 'resolved-thread');
      expect(props?.showResolveAction).toBe(true);
    });
  });

  // ==========================================================================
  // Composer Configuration (showComposer prop)
  // ==========================================================================

  describe('showComposer prop configuration', () => {
    it('should set showComposer to "collapsed"', () => {
      mockThreads = [
        { id: 'thread-1', metadata: { resolved: false } },
      ];

      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />);

      const threadEl = screen.getByTestId('thread-thread-1');
      expect(threadEl).toHaveAttribute('data-show-composer', 'collapsed');
    });

    it('should use collapsed composer for all threads', () => {
      mockThreads = [
        { id: 'thread-1', metadata: { resolved: false } },
        { id: 'thread-2', metadata: { resolved: true } },
        { id: 'thread-3', metadata: { resolved: false, aiGenerated: true } },
      ];

      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />);

      capturedThreadProps.forEach((props) => {
        expect(props.showComposer).toBe('collapsed');
      });
    });
  });

  // ==========================================================================
  // Combined Props Verification
  // ==========================================================================

  describe('combined props verification', () => {
    it('should pass all required props to Thread component', () => {
      mockThreads = [
        { id: 'complete-thread', metadata: { resolved: false } },
      ];

      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />);

      const props = capturedThreadProps.find(p => p.thread.id === 'complete-thread');

      // Verify all fix-related props are present
      expect(props).toEqual(expect.objectContaining({
        thread: expect.objectContaining({ id: 'complete-thread' }),
        showActions: true,
        showComposer: 'collapsed',
        showResolveAction: true,
        showReactions: true,
      }));
    });

    it('should maintain consistent props across unresolved and resolved threads', () => {
      mockThreads = [
        { id: 'unresolved', metadata: { resolved: false } },
        { id: 'resolved', metadata: { resolved: true } },
      ];

      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />);

      const unresolvedProps = capturedThreadProps.find(p => p.thread.id === 'unresolved');
      const resolvedProps = capturedThreadProps.find(p => p.thread.id === 'resolved');

      // Both should have same prop configuration
      expect(unresolvedProps?.showActions).toBe(resolvedProps?.showActions);
      expect(unresolvedProps?.showReactions).toBe(resolvedProps?.showReactions);
      expect(unresolvedProps?.showResolveAction).toBe(resolvedProps?.showResolveAction);
      expect(unresolvedProps?.showComposer).toBe(resolvedProps?.showComposer);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle thread with undefined metadata', () => {
      mockThreads = [
        { id: 'no-metadata-thread' },
      ];

      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />);

      const props = capturedThreadProps.find(p => p.thread.id === 'no-metadata-thread');
      expect(props?.showActions).toBe(true);
      expect(props?.showReactions).toBe(true);
      expect(props?.showResolveAction).toBe(true);
    });

    it('should handle thread with null metadata values', () => {
      mockThreads = [
        // @ts-expect-error - Testing null metadata edge case
        { id: 'null-metadata', metadata: null },
      ];

      // Should not throw
      expect(() => {
        render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />);
      }).not.toThrow();
    });

    it('should handle large number of threads', () => {
      mockThreads = Array.from({ length: 100 }, (_, i) => ({
        id: `thread-${i}`,
        metadata: { resolved: i % 2 === 0 },
      }));

      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />);

      // All 100 threads should have proper props
      expect(capturedThreadProps.length).toBe(100);
      capturedThreadProps.forEach((props) => {
        expect(props.showActions).toBe(true);
        expect(props.showReactions).toBe(true);
      });
    });

    it('should render threads in correct order', () => {
      mockThreads = [
        { id: 'first', metadata: { resolved: false } },
        { id: 'second', metadata: { resolved: false } },
        { id: 'third', metadata: { resolved: false } },
      ];

      render(<CommentsSidebar isOpen={true} onClose={jest.fn()} />);

      // Check order of captured props
      const unresolvedIds = capturedThreadProps
        .filter(p => mockThreads.find(t => t.id === p.thread.id && !t.metadata?.resolved))
        .map(p => p.thread.id);

      expect(unresolvedIds[0]).toBe('first');
      expect(unresolvedIds[1]).toBe('second');
      expect(unresolvedIds[2]).toBe('third');
    });
  });
});
