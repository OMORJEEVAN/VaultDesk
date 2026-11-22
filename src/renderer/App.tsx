import React, { useEffect, useState } from 'react'
import type { VaultStatus } from '@shared/types'
import Setup from './pages/Setup'
import Unlock from './pages/Unlock'
import MainLayout from './components/MainLayout'

type Page = 'dashboard' | 'all-passwords' | 'favorites' | 'categories' | 'recently-added' | 'security' | 'settings'

export default function App(): React.ReactElement {
  const [status, setStatus]       = useState<VaultStatus | null>(null)
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [theme, setTheme]         = useState<'dark' | 'light'>('dark')

  // ---- Load vault status ----
  useEffect(() => {
    window.vaultAPI.getVaultStatus().then(setStatus)
    window.vaultAPI.getSettings().then(s => {
      const t = s.theme === 'light' ? 'light' : 'dark'
      setTheme(t)
      if (t === 'light') {
        document.documentElement.classList.add('light')
        document.documentElement.classList.remove('dark')
      } else {
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
      }
    })
  }, [])

  // ---- Auto-lock event ----
  useEffect(() => {
    const unsubLock = window.vaultAPI.onLockVault(() => {
      setStatus('locked')
    })
    return unsubLock
  }, [])

  // ---- Activity tracking → reset inactivity timer ----
  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    const reset = () => window.vaultAPI.writeClipboard('').catch(() => {})  // placeholder
    // Actually send activity signal
    const signalActivity = () => {
      // We use a no-arg IPC instead of writeClipboard
      ;(window as unknown as { vaultAPI: { writeClipboard: (s: string) => Promise<void> } })
        .vaultAPI.writeClipboard('')
        .catch(() => {})
    }
    events.forEach(e => window.addEventListener(e, signalActivity, { passive: true }))
    return () => events.forEach(e => window.removeEventListener(e, signalActivity))
  }, [])

  const handleUnlocked = () => setStatus('unlocked')
  const handleSetupComplete = () => setStatus('unlocked')

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    if (next === 'light') {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    }
    window.vaultAPI.saveSettings({ theme: next })
  }

  if (status === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0b0e11]">
        <div className="w-8 h-8 border-2 border-[#fcd535] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (status === 'uninitialized') {
    return <Setup onComplete={handleSetupComplete} />
  }

  if (status === 'locked') {
    return <Unlock onUnlocked={handleUnlocked} />
  }

  return (
    <MainLayout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      theme={theme}
      onToggleTheme={toggleTheme}
      onLock={() => {
        window.vaultAPI.lockVault()
        setStatus('locked')
      }}
    />
  )
}

// Global type declaration for the preload API
declare global {
  interface Window {
    vaultAPI: import('@shared/types').VaultAPI
  }
}
