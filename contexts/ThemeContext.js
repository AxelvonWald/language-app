// contexts/ThemeContext.js
'use client'
import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark') // Default to dark
  const [mounted, setMounted] = useState(false)

  // Load saved theme on mount
  useEffect(() => {
    const getInitialTheme = () => {
      // Check localStorage first
      const saved = localStorage.getItem('theme')
      if (saved && (saved === 'light' || saved === 'dark')) {
        return saved
      }
      
      // Fall back to system preference
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches 
          ? 'dark' 
          : 'light'
      }
      
      return 'dark' // Final fallback
    }

    const initialTheme = getInitialTheme()
    setTheme(initialTheme)
    setMounted(true)
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', initialTheme)
  }, [])

  // Save theme changes to localStorage
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return children
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}