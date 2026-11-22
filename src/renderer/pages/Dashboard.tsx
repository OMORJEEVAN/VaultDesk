import React, { useEffect, useState } from 'react'
import { KeyRound, Heart, Tag, Shield, Clock, TrendingUp, Plus } from 'lucide-react'
import type { Credential } from '@shared/types'

type Page = 'dashboard' | 'all-passwords' | 'favorites' | 'categories' | 'recently-added' | 'security' | 'settings'

interface Props { onNavigate: (p: Page) => void }

export default function Dashboard({ onNavigate }: Props) {
  const [creds, setCreds] = useState<Credential[]>([])

  useEffect(() => {
    window.vaultAPI.getCredentials().then(setCreds).catch(() => {})
  }, [])

  const favorites  = creds.filter(c => c.isFavorite)
  const recent     = [...creds].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
  const categories = [...new Set(creds.map(c => c.category).filter(Boolean))]

  const StatCard = ({
    icon, label, value, onClick, color = 'yellow'
  }: {
    icon: React.ReactNode; label: string; value: number | string
    onClick?: () => void; color?: string
  }) => (
    <button
      onClick={onClick}
      className={`card p-5 text-left transition-all duration-150 hover:border-[#363d47] group w-full ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors
        ${color === 'red' ? 'bg-[#f6465d]/15 text-[#f6465d] group-hover:bg-[#f6465d]/25' :
          color === 'green' ? 'bg-[#0ecb81]/15 text-[#0ecb81] group-hover:bg-[#0ecb81]/25' :
          'bg-[#fcd535]/15 text-[#fcd535] group-hover:bg-[#fcd535]/25'}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold font-mono text-white mb-0.5">{value}</div>
      <div className="text-sm text-[#707a8a]">{label}</div>
    </button>
  )

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-[#707a8a] text-sm mt-0.5">Your vault at a glance</p>
        </div>
        <button
          className="btn-primary flex items-center gap-2 text-sm font-semibold"
          onClick={() => onNavigate('all-passwords')}
        >
          <Plus className="w-4 h-4" />
          Add Password
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<KeyRound className="w-5 h-5" />} label="Total Passwords" value={creds.length}      onClick={() => onNavigate('all-passwords')} color="yellow" />
        <StatCard icon={<Tag className="w-5 h-5" />}      label="Categories"      value={categories.length} onClick={() => onNavigate('categories')} color="yellow" />
        <StatCard icon={<Heart className="w-5 h-5" />}    label="Favorites"       value={favorites.length}  onClick={() => onNavigate('favorites')} color="red" />
        <StatCard icon={<Shield className="w-5 h-5" />}   label="Security Check"  value="View"              onClick={() => onNavigate('security')} color="green" />
      </div>

      {/* Recently added */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-[#707a8a]" />
            Recently Added
          </h2>
          <button className="text-xs text-[#fcd535] hover:text-[#f0b90b] font-medium transition-colors" onClick={() => onNavigate('recently-added')}>
            View all →
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="text-center py-8 text-[#707a8a]">
            <KeyRound className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No passwords yet. Add your first one!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {recent.map(cred => (
              <div
                key={cred.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#2b3139]/60 transition-colors cursor-default"
              >
                <div className="w-9 h-9 rounded-lg bg-[#fcd535]/15 flex items-center justify-center text-[#fcd535] font-bold text-sm shrink-0 font-mono">
                  {cred.platformName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{cred.platformName}</p>
                  <p className="text-xs text-[#707a8a] truncate">{cred.email || cred.username || '—'}</p>
                </div>
                <span className="badge text-xs shrink-0 font-mono">
                  {cred.category || 'Uncategorized'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick-start tip */}
      {creds.length === 0 && (
        <div className="card p-5 border-[#fcd535]/30 bg-[#fcd535]/5">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-[#fcd535] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white">Get started with VaultDesk</p>
              <p className="text-xs text-[#eaecef]/80 mt-1 leading-relaxed">
                Add your first password to unlock the security overview, detect reused passwords, and get personalised recommendations.
              </p>
              <button className="btn-primary text-xs mt-3 py-1.5 px-3" onClick={() => onNavigate('all-passwords')}>
                Add First Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
