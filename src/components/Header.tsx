'use client'

import Link from 'next/link'
import { UserMenu } from '@/components/Auth'
import { ThemeToggle } from '@/components/ThemeToggle'

interface HeaderProps {
  showBackButton?: boolean
  documentTitle?: string
}

export function Header({ showBackButton, documentTitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Link
              href="/"
              className="flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Back</span>
            </Link>
          )}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-white font-semibold text-xs">
              CM
            </div>
            {!documentTitle && (
              <span className="text-lg font-semibold text-slate-800 dark:text-slate-200">ColabMD</span>
            )}
          </Link>
          {documentTitle && (
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{documentTitle}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
