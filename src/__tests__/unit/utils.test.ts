/**
 * Unit Tests for Utility Functions
 *
 * Tests the cn() utility function used for className merging
 * with Tailwind CSS classes.
 */

import { cn } from '@/lib/utils';

describe('cn (className utility)', () => {
  // =========================================================================
  // Basic Functionality
  // =========================================================================

  describe('basic functionality', () => {
    it('should return an empty string when called with no arguments', () => {
      expect(cn()).toBe('');
    });

    it('should return the same class when passed a single string', () => {
      expect(cn('text-red-500')).toBe('text-red-500');
    });

    it('should join multiple class strings with spaces', () => {
      expect(cn('text-red-500', 'bg-white')).toBe('text-red-500 bg-white');
    });

    it('should handle multiple class names in a single string', () => {
      expect(cn('text-red-500 bg-white', 'p-4')).toBe('text-red-500 bg-white p-4');
    });
  });

  // =========================================================================
  // Conditional Classes (clsx behavior)
  // =========================================================================

  describe('conditional classes', () => {
    it('should include classes when condition is true', () => {
      const isActive = true;
      expect(cn('base', isActive && 'active')).toBe('base active');
    });

    it('should exclude classes when condition is false', () => {
      const isActive = false;
      expect(cn('base', isActive && 'active')).toBe('base');
    });

    it('should handle object syntax for conditionals', () => {
      expect(cn('base', { active: true, disabled: false })).toBe('base active');
    });

    it('should handle nested conditionals', () => {
      const state = { isActive: true, isDisabled: false, isHovered: true };
      expect(
        cn('base', {
          active: state.isActive,
          disabled: state.isDisabled,
          hovered: state.isHovered,
        })
      ).toBe('base active hovered');
    });

    it('should handle undefined and null values', () => {
      expect(cn('base', undefined, null, 'end')).toBe('base end');
    });

    it('should handle empty strings', () => {
      expect(cn('base', '', 'end')).toBe('base end');
    });
  });

  // =========================================================================
  // Tailwind CSS Conflict Resolution (tailwind-merge behavior)
  // =========================================================================

  describe('tailwind class conflict resolution', () => {
    it('should resolve conflicting padding classes (last wins)', () => {
      expect(cn('p-4', 'p-8')).toBe('p-8');
    });

    it('should resolve conflicting margin classes', () => {
      expect(cn('m-2', 'm-4', 'm-6')).toBe('m-6');
    });

    it('should resolve conflicting text color classes', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('should resolve conflicting background color classes', () => {
      expect(cn('bg-white', 'bg-gray-100')).toBe('bg-gray-100');
    });

    it('should keep non-conflicting classes', () => {
      expect(cn('p-4', 'm-4', 'text-red-500')).toBe('p-4 m-4 text-red-500');
    });

    it('should resolve padding-x and padding-y separately', () => {
      expect(cn('px-4', 'py-2', 'px-8')).toBe('py-2 px-8');
    });

    it('should resolve conflicting width classes', () => {
      expect(cn('w-full', 'w-1/2')).toBe('w-1/2');
    });

    it('should resolve conflicting height classes', () => {
      expect(cn('h-screen', 'h-full', 'h-64')).toBe('h-64');
    });

    it('should resolve conflicting flex direction classes', () => {
      expect(cn('flex-row', 'flex-col')).toBe('flex-col');
    });

    it('should resolve conflicting justify-content classes', () => {
      expect(cn('justify-start', 'justify-center', 'justify-end')).toBe('justify-end');
    });

    it('should resolve conflicting display classes', () => {
      expect(cn('block', 'flex', 'hidden')).toBe('hidden');
    });

    it('should resolve conflicting rounded classes', () => {
      expect(cn('rounded', 'rounded-lg', 'rounded-full')).toBe('rounded-full');
    });

    it('should resolve conflicting shadow classes', () => {
      expect(cn('shadow', 'shadow-md', 'shadow-lg')).toBe('shadow-lg');
    });
  });

  // =========================================================================
  // Array Input Handling
  // =========================================================================

  describe('array input handling', () => {
    it('should flatten and join array inputs', () => {
      expect(cn(['text-red-500', 'bg-white'])).toBe('text-red-500 bg-white');
    });

    it('should handle mixed array and string inputs', () => {
      expect(cn('base', ['middle'], 'end')).toBe('base middle end');
    });

    it('should handle nested arrays', () => {
      expect(cn(['a', ['b', 'c']], 'd')).toBe('a b c d');
    });

    it('should filter out falsy values in arrays', () => {
      expect(cn(['a', false, 'b', null, 'c', undefined])).toBe('a b c');
    });
  });

  // =========================================================================
  // Edge Cases and Boundary Conditions
  // =========================================================================

  describe('edge cases', () => {
    it('should handle a large number of classes', () => {
      const classes = Array.from({ length: 100 }, (_, i) => `class-${i}`);
      const result = cn(...classes);
      expect(result.split(' ').length).toBe(100);
    });

    it('should handle classes with special characters in values', () => {
      expect(cn('w-[100px]', 'h-[50vh]')).toBe('w-[100px] h-[50vh]');
    });

    it('should handle arbitrary value classes', () => {
      expect(cn('bg-[#ff0000]', 'text-[14px]')).toBe('bg-[#ff0000] text-[14px]');
    });

    it('should handle responsive prefixes', () => {
      expect(cn('md:p-4', 'lg:p-8')).toBe('md:p-4 lg:p-8');
    });

    it('should handle state prefixes', () => {
      expect(cn('hover:bg-gray-100', 'focus:ring-2')).toBe('hover:bg-gray-100 focus:ring-2');
    });

    it('should handle dark mode classes', () => {
      expect(cn('bg-white', 'dark:bg-gray-900')).toBe('bg-white dark:bg-gray-900');
    });

    it('should resolve conflicts within responsive prefixes', () => {
      expect(cn('md:p-4', 'md:p-8')).toBe('md:p-8');
    });

    it('should handle important modifier', () => {
      expect(cn('!p-4', '!p-8')).toBe('!p-8');
    });

    it('should handle negative values', () => {
      expect(cn('-mt-4', '-mt-8')).toBe('-mt-8');
    });

    it('should preserve group and peer classes', () => {
      expect(cn('group', 'peer')).toBe('group peer');
    });

    it('should handle transition classes', () => {
      expect(cn('transition', 'transition-all', 'transition-colors')).toBe('transition-colors');
    });

    it('should handle animation classes', () => {
      expect(cn('animate-spin', 'animate-pulse')).toBe('animate-pulse');
    });
  });

  // =========================================================================
  // Real-World Usage Patterns from ColabMD
  // =========================================================================

  describe('real-world usage patterns', () => {
    it('should handle LoginButton styling pattern', () => {
      const baseClasses =
        'flex items-center gap-3 rounded-lg bg-white px-6 py-3 text-gray-700 shadow-md transition-all hover:shadow-lg hover:bg-gray-50 font-medium';
      const customClass = 'mt-4';
      expect(cn(baseClasses, customClass)).toContain('mt-4');
      expect(cn(baseClasses, customClass)).toContain('flex');
    });

    it('should handle button disabled state pattern', () => {
      const isDisabled = true;
      const result = cn(
        'rounded-lg bg-indigo-600 px-4 py-2 text-white',
        isDisabled && 'opacity-50 cursor-not-allowed'
      );
      expect(result).toContain('opacity-50');
      expect(result).toContain('cursor-not-allowed');
    });

    it('should handle document card hover state pattern', () => {
      const isDeleting = true;
      const result = cn(
        'group relative rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md',
        isDeleting && 'opacity-50'
      );
      expect(result).toContain('opacity-50');
    });

    it('should handle editor prose styling', () => {
      const result = cn(
        'prose prose-slate max-w-none focus:outline-none',
        'min-h-[500px] px-8 py-6'
      );
      expect(result).toContain('prose');
      expect(result).toContain('min-h-[500px]');
    });

    it('should handle copied state button pattern', () => {
      const copied = true;
      const result = cn(
        'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
        copied
          ? 'bg-green-100 text-green-700'
          : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
      );
      expect(result).toContain('bg-green-100');
      expect(result).toContain('text-green-700');
      expect(result).not.toContain('bg-indigo-100');
    });

    it('should handle avatar ring color pattern', () => {
      const isCurrentUser = true;
      const result = cn(
        'h-8 w-8 rounded-full',
        isCurrentUser ? 'ring-2 ring-indigo-500' : 'ring-2 ring-white'
      );
      expect(result).toContain('ring-indigo-500');
      expect(result).not.toContain('ring-white');
    });
  });
});
