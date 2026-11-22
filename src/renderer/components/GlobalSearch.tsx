import React, { useEffect, useState, useRef } from 'react'
import { Search, X } from 'lucide-react'
import type { Credential, SearchFilters } from '@shared/types'

interface Props {
  onSelect?: (cred: Credential) => void
}

export default function GlobalSearch({ onSelect }: Props) {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<Credential[]>([])
  const [open, setOpen]         = useState(false)
  const [allCreds, setAllCreds] = useState<Credential[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.vaultAPI.getCredentials().then(setAllCreds).catch(() => {})
  }, [])

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return }
    const q = query.toLowerCase()
    const filtered = allCreds.filter(c =>
      c.platformName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.username.toLowerCase().includes(q) ||
      c.websiteUrl.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.tags.some(t => t.toLowerCase().includes(q)) ||
      c.notes.toLowerCase().includes(q)
    ).slice(0, 8)
    setResults(filtered)
    setOpen(filtered.length > 0)
  }, [query, allCreds])

  const clear = () => { setQuery(''); setResults([]); setOpen(false) }

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') clear()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="relative flex-1 max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          className="input pl-9 pr-8 h-9 text-sm"
          placeholder="Search passwords... (Ctrl+K)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {query && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            onClick={clear}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 card border border-white/[0.1] shadow-glass z-50 overflow-hidden animate-slide-up">
          {results.map(cred => (
            <button
              key={cred.id}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/[0.05] text-left transition-colors"
              onClick={() => { onSelect?.(cred); clear() }}
            >
              <div className="w-8 h-8 rounded-lg bg-vault-500/20 flex items-center justify-center text-vault-400 font-bold text-sm shrink-0">
                {cred.platformName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{cred.platformName}</p>
                <p className="text-xs text-slate-500 truncate">{cred.email || cred.username}</p>
              </div>
              <span className="ml-auto text-xs text-slate-600 shrink-0">{cred.category}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
