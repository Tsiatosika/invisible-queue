import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const ThemeContext = createContext({})

export const lightTheme = {
  dark: false,
  bg: '#f8f9fa',
  card: '#ffffff',
  header: '#4f46e5',
  headerText: '#ffffff',
  headerSub: '#c7d2fe',
  text: '#1a1a2e',
  subtext: '#666666',
  placeholder: '#999999',
  border: '#e5e7eb',
  separator: '#f3f4f6',
  countBar: '#ede9fe',
  countText: '#4f46e5',
  inputBg: '#f8f9fa',
  badge: '#ede9fe',
  badgeText: '#4f46e5',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  iconBg: '#ffffff',
  iconColor: '#4f46e5',
  shadow: '#000000',
}

export const darkTheme = {
  dark: true,
  bg: '#0f0f1a',
  card: '#1e1e2e',
  header: '#1e1b4b',
  headerText: '#ffffff',
  headerSub: '#818cf8',
  text: '#f1f5f9',
  subtext: '#94a3b8',
  placeholder: '#64748b',
  border: '#334155',
  separator: '#1e293b',
  countBar: '#1e1b4b',
  countText: '#818cf8',
  inputBg: '#1e293b',
  badge: '#1e1b4b',
  badgeText: '#818cf8',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  iconBg: '#312e81',
  iconColor: '#a5b4fc',
  shadow: '#000000',
}

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false)
  const theme = isDark ? darkTheme : lightTheme

  useEffect(() => {
    AsyncStorage.getItem('theme').then(val => {
      if (val === 'dark') setIsDark(true)
    })
  }, [])

  const toggleTheme = async () => {
    const next = !isDark
    setIsDark(next)
    await AsyncStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
