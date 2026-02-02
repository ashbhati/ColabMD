'use client'
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme
    if (stored) setTheme(stored)
  }, [])

  useEffect(() => {
    localStorage.setItem('theme', theme)

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      setResolvedTheme(systemTheme)
      document.documentElement.classList.toggle('dark', systemTheme === 'dark')
      document.documentElement.setAttribute('data-theme', systemTheme)
    } else {
      setResolvedTheme(theme)
      document.documentElement.classList.toggle('dark', theme === 'dark')
      document.documentElement.setAttribute('data-theme', theme)
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
