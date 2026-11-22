import React, { useEffect, useState, useCallback } from 'react'
import {
  Plus, Search, Eye, EyeOff, Copy, ExternalLink, Heart, Trash2,
  Edit3, ChevronDown, Filter, SortAsc, X, Check, Tag
} from 'lucide-react'
import type { Credential, NewCredential, SearchFilters } from '@shared/types'
import CredentialModal from '../components/CredentialModal'
import ConfirmDialog from '../components/ConfirmDialog'
import { analyzePassword } from '@shared/passwordStrength'

export default function AllPasswords() {
  const [creds, setCreds]         = useState<Credential[]>([])
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [filters, setFilters]     = useState<SearchFilters>({
    query: '', sortBy: 'created', sortDir: 'desc'
  })
  const [showModal, setShowModal] = useState(false)
  const [editCred, setEditCred]   = useState<Credential | null>(null)
  const [deleteId, setDeleteId]   = useState<number | null>(null)
  const [visiblePws, setVisiblePws] = useState<Set<number>>(new Set())
  const [copiedId, setCopiedId]   = useState<number | null>(null)
  const [loading, setLoading]     = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [c, cats] = await Promise.all([
      window.vaultAPI.getCredentials(),
      window.vaultAPI.getCategories()
    ])
    setCreds(c)
    setCategories(cats)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ---- Filtering & sorting ----
  const filtered = creds
    .filter(c => {
      const q = filters.query.toLowerCase()
      if (q && ![c.platformName, c.email, c.username, c.websiteUrl, c.category, ...c.tags, c.notes]
        .some(f => f?.toLowerCase().includes(q))) return false
      if (filters.category && c.category !== filters.category) return false
      if (filters.favoritesOnly && !c.isFavorite) return false
      return true
    })
    .sort((a, b) => {
      let cmp = 0
      if (filters.sortBy === 'name')    cmp = a.platformName.localeCompare(b.platformName)
      if (filters.sortBy === 'created') cmp = a.createdAt.localeCompare(b.createdAt)
      if (filters.sortBy === 'updated') cmp = a.updatedAt.localeCompare(b.updatedAt)
      return filters.sortDir === 'asc' ? cmp : -cmp
    })

  const copy = async (text: string, id: number) => {
    await window.vaultAPI.writeClipboard(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const togglePw = (id: number) => setVisiblePws(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const handleFavorite = async (cred: Credential) => {
    await window.vaultAPI.toggleFavorite(cred.id, !cred.isFavorite)
    loadData()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await window.vaultAPI.deleteCredential(deleteId)
    setDeleteId(null)
    loadData()
  }

  const handleSave = async (data: NewCredential) => {
    if (editCred) {
      await window.vaultAPI.updateCredential({ ...data, id: editCred.id })
    } else {
      await window.vaultAPI.addCredential(data)
    }
    setShowModal(false)
    setEditCred(null)
    loadData()
  }

  const strengthColor = (pw: string) => {
    const { strength } = analyzePassword(pw)
    if (strength === 'very-strong' || strength === 'strong') return 'text-[#0ecb81]'
    if (strength === 'fair') return 'text-[#fcd535]'
    return 'text-[#f6465d]'
  }

  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#181a20] dark:text-white">All Passwords</h1>
        <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => { setEditCred(null); setShowModal(true) }}>
          <Plus className="w-4 h-4" /> Add Password
        </button>
      </div>

      {/* Search & filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#707a8a]" />
          <input
            className="input pl-9 h-9 text-sm"
            placeholder="Filter passwords..."
            value={filters.query}
            onChange={e => setFilters(f => ({ ...f, query: e.target.value }))}
          />
        </div>
        <select
          className="input h-9 text-sm w-40"
          value={filters.category ?? ''}
          onChange={e => setFilters(f => ({ ...f, category: e.target.value || undefined }))}
        >
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <select
          className="input h-9 text-sm w-40"
          value={`${filters.sortBy}-${filters.sortDir}`}
          onChange={e => {
            const [by, dir] = e.target.value.split('-') as [SearchFilters['sortBy'], SearchFilters['sortDir']]
            setFilters(f => ({ ...f, sortBy: by, sortDir: dir }))
          }}
        >
          <option value="created-desc">Newest first</option>
          <option value="created-asc">Oldest first</option>
          <option value="updated-desc">Recently updated</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
        </select>
        <button
          className={`btn-ghost h-9 text-sm flex items-center gap-1.5 ${filters.favoritesOnly ? 'text-[#f6465d] bg-[#f6465d]/10 border-[#f6465d]/30' : ''}`}
          onClick={() => setFilters(f => ({ ...f, favoritesOnly: !f.favoritesOnly }))}
        >
          <Heart className="w-4 h-4" /> Favorites
        </button>
      </div>

      {/* Count */}
      <p className="text-xs text-[#707a8a]">
        {filtered.length} of {creds.length} passwords
      </p>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#fcd535] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-[#707a8a]">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{creds.length === 0 ? 'No passwords yet. Click "Add Password" to get started.' : 'No passwords match your filters.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(cred => {
            const pwVisible = visiblePws.has(cred.id)
            return (
              <div key={cred.id} className="card p-4 flex items-center gap-4 hover:border-[#363d47] transition-all duration-150 group">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-lg bg-[#fcd535]/15 flex items-center justify-center text-[#fcd535] font-bold shrink-0 font-mono">
                  {cred.platformName.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#181a20] dark:text-white text-sm truncate">{cred.platformName}</span>
                    {cred.isFavorite && <Heart className="w-3.5 h-3.5 text-[#f6465d] fill-[#f6465d] shrink-0" />}
                    {cred.category && (
                      <span className="badge text-[#d9a206] dark:text-[#fcd535] bg-[#fcd535]/12 border-[#fcd535]/30 shrink-0 font-mono">
                        {cred.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#707a8a] truncate mt-0.5">{cred.email || cred.username || '—'}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`font-mono text-xs ${strengthColor(cred.password)}`}>
                      {pwVisible ? cred.password : '•'.repeat(Math.min(cred.password.length, 16))}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 rounded hover:bg-[#f5f5f5] dark:hover:bg-[#2b3139] text-[#707a8a] hover:text-[#181a20] dark:hover:text-white" title="Toggle password" onClick={() => togglePw(cred.id)}>
                    {pwVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button className="p-1.5 rounded hover:bg-[#f5f5f5] dark:hover:bg-[#2b3139] text-[#707a8a] hover:text-[#0ecb81]" title="Copy password" onClick={() => copy(cred.password, cred.id)}>
                    {copiedId === cred.id ? <Check className="w-4 h-4 text-[#0ecb81]" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button className="p-1.5 rounded hover:bg-[#f5f5f5] dark:hover:bg-[#2b3139] text-[#707a8a] hover:text-[#181a20] dark:hover:text-white" title="Copy email" onClick={() => copy(cred.email || cred.username, cred.id * -1)}>
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {cred.websiteUrl && (
                    <button className="p-1.5 rounded hover:bg-[#f5f5f5] dark:hover:bg-[#2b3139] text-[#707a8a] hover:text-[#181a20] dark:hover:text-white" title="Open URL" onClick={() => window.open(cred.websiteUrl)}>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                  <button className="p-1.5 rounded hover:bg-[#f5f5f5] dark:hover:bg-[#2b3139] text-[#707a8a] hover:text-[#f6465d]" title="Favorite" onClick={() => handleFavorite(cred)}>
                    <Heart className={`w-4 h-4 ${cred.isFavorite ? 'fill-[#f6465d] text-[#f6465d]' : ''}`} />
                  </button>
                  <button className="p-1.5 rounded hover:bg-[#f5f5f5] dark:hover:bg-[#2b3139] text-[#707a8a] hover:text-[#d9a206] dark:hover:text-[#fcd535]" title="Edit" onClick={() => { setEditCred(cred); setShowModal(true) }}>
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 rounded hover:bg-[#f6465d]/20 text-[#707a8a] hover:text-[#f6465d]" title="Delete" onClick={() => setDeleteId(cred.id)}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit modal */}
      {showModal && (
        <CredentialModal
          initial={editCred}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditCred(null) }}
          existingEmails={[...new Set(creds.map(c => c.email).filter(Boolean))]}
          categories={categories.map(c => c.name)}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Password"
        message="Are you sure you want to permanently delete this password? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        danger
      />
    </div>
  )
}
