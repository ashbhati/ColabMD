'use client'

import { useState, useRef, useEffect, useId, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  shortcut?: string
  delay?: number
  position?: 'top' | 'bottom'
}

export function Tooltip({
  content,
  children,
  shortcut,
  delay = 200,
  position = 'bottom'
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)
  const tooltipId = useId()

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsVisible(false)
  }

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // Dismiss on Escape key
  useEffect(() => {
    if (!isVisible) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hideTooltip()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isVisible])

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      <span aria-describedby={isVisible ? tooltipId : undefined}>
        {children}
      </span>
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={cn(
            'absolute z-50 px-2 py-1 text-xs font-medium text-white bg-slate-900 dark:bg-slate-700 rounded shadow-lg whitespace-nowrap pointer-events-none',
            'animate-in fade-in-0 zoom-in-95 duration-100',
            position === 'bottom'
              ? 'top-full mt-1.5 left-1/2 -translate-x-1/2'
              : 'bottom-full mb-1.5 left-1/2 -translate-x-1/2'
          )}
        >
          <div className="flex items-center gap-2">
            <span>{content}</span>
            {shortcut && (
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 dark:bg-slate-600 rounded border border-slate-700 dark:border-slate-500">
                {shortcut}
              </kbd>
            )}
          </div>
          {/* Tooltip arrow */}
          <div
            className={cn(
              'absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-slate-900 dark:bg-slate-700',
              position === 'bottom' ? '-top-1' : '-bottom-1'
            )}
          />
        </div>
      )}
    </div>
  )
}
