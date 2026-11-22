import React, { useState } from 'react'
import {
  LayoutDashboard, KeyRound, Heart, Tag, Clock, Shield, Settings,
  Lock, ChevronLeft, ChevronRight, Menu
} from 'lucide-react'
import Dashboard from '../pages/Dashboard'
import AllPasswords from '../pages/AllPasswords'
import Favorites from '../pages/Favorites'
import CategoriesPage from '../pages/CategoriesPage'
import RecentlyAdded from '../pages/RecentlyAdded'
import SecurityDashboard from '../pages/SecurityDashboard'
import SettingsPage from '../pages/SettingsPage'
import GlobalSearch from './GlobalSearch'

type Page = 'dashboard' | 'all-passwords' | 'favorites' | 'categories' | 'recently-added' | 'security' | 'settings'

interface Props {
  currentPage: Page
  onNavigate: (p: Page) => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onLock: () => void
}

const NAV_ITEMS: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard',      label: 'Dashboard',       icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'all-passwords',  label: 'All Passwords',   icon: <KeyRound className="w-4 h-4" /> },
  { id: 'favorites',      label: 'Favorites',       icon: <Heart className="w-4 h-4" /> },
  { id: 'categories',     label: 'Categories',      icon: <Tag className="w-4 h-4" /> },
  { id: 'recently-added', label: 'Recently Added',  icon: <Clock className="w-4 h-4" /> },
  { id: 'security',       label: 'Security',        icon: <Shield className="w-4 h-4" /> },
  { id: 'settings',       label: 'Settings',        icon: <Settings className="w-4 h-4" /> },
]

export default function MainLayout({ currentPage, onNavigate, theme, onToggleTheme, onLock }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':      return <Dashboard onNavigate={onNavigate} />
      case 'all-passwords':  return <AllPasswords />
      case 'favorites':      return <Favorites />
      case 'categories':     return <CategoriesPage />
      case 'recently-added': return <RecentlyAdded />
      case 'security':       return <SecurityDashboard />
      case 'settings':       return <SettingsPage theme={theme} onToggleTheme={onToggleTheme} onLock={onLock} />
      default:               return <Dashboard onNavigate={onNavigate} />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-300">
      {/* Sidebar */}
      <aside
        className={`flex flex-col shrink-0 border-r border-white/[0.06] bg-surface-100
                    transition-all duration-200 ${collapsed ? 'w-16' : 'w-56'}`}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/[0.06] ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-vault-500 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-white text-base tracking-tight">VaultDesk</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`sidebar-item w-full ${currentPage === item.id ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className={`px-2 py-3 border-t border-white/[0.06] space-y-1`}>
          <button
            className={`sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${collapsed ? 'justify-center px-2' : ''}`}
            onClick={onLock}
            title={collapsed ? 'Lock Vault' : undefined}
          >
            <Lock className="w-4 h-4" />
            {!collapsed && <span>Lock Vault</span>}
          </button>
          <button
            className={`sidebar-item w-full ${collapsed ? 'justify-center px-2' : ''}`}
            onClick={() => setCollapsed(c => !c)}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-6 py-3 border-b border-white/[0.06] bg-surface-100/50 backdrop-blur-sm shrink-0">
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            Vault unlocked
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
