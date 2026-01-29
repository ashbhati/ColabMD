'use client'

import Link from 'next/link'
import { UserMenu } from '@/components/Auth'

interface HeaderProps {
  showBackButton?: boolean
  documentTitle?: string
}

export function Header({ showBackButton, documentTitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Link
              href="/"
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Back</span>
            </Link>
          )}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">
              CM
            </div>
            {!documentTitle && (
              <span className="text-xl font-semibold text-gray-900">ColabMD</span>
            )}
          </Link>
          {documentTitle && (
            <span className="text-lg font-medium text-gray-700">{documentTitle}</span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
