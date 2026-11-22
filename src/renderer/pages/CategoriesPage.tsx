import React, { useEffect, useState } from 'react'
import { Tag, Plus, Trash2, KeyRound } from 'lucide-react'
import type { Category, Credential } from '@shared/types'
import ConfirmDialog from '../components/ConfirmDialog'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [creds, setCreds]           = useState<Credential[]>([])
  const [newName, setNewName]       = useState('')
  const [deleteId, setDeleteId]     = useState<number | null>(null)
  const [error, setError]           = useState('')

  const load = async () => {
    const [cats, c] = await Promise.all([
      window.vaultAPI.getCategories(),
      window.vaultAPI.getCredentials()
    ])
    setCategories(cats)
    setCreds(c)
  }

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    const name = newName.trim()
    if (!name) return
    const r = await window.vaultAPI.addCategory(name)
    if (r.success) { setNewName(''); load() }
    else setError(r.error ?? 'Failed to add category.')
  }

  const countForCategory = (name: string) => creds.filter(c => c.category === name).length

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center gap-3">
        <Tag className="w-5 h-5 text-[#d9a206] dark:text-[#fcd535]" />
        <h1 className="text-2xl font-bold text-[#181a20] dark:text-white">Categories</h1>
      </div>

      {/* Add */}
      <div className="card p-4 flex gap-3">
        <input
          className="input flex-1 h-9 text-sm"
          placeholder="New category name..."
          value={newName}
          onChange={e => { setNewName(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button className="btn-primary h-9 px-4 text-sm flex items-center gap-1 font-semibold" onClick={handleAdd}>
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      {error && <p className="text-xs text-[#f6465d]">{error}</p>}

      {/* List */}
      <div className="space-y-2">
        {categories.map(cat => (
          <div key={cat.id} className="card p-4 flex items-center gap-3 hover:border-[#cdd1d6] dark:hover:border-[#363d47] transition-colors">
            <Tag className="w-4 h-4 text-[#d9a206] dark:text-[#fcd535] shrink-0" />
            <span className="flex-1 text-sm font-medium text-[#181a20] dark:text-white">{cat.name}</span>
            <span className="badge text-xs font-mono">
              <KeyRound className="w-3 h-3 inline mr-1" />
              {countForCategory(cat.name)} passwords
            </span>
            <button
              className="p-1.5 rounded hover:bg-[#f6465d]/20 text-[#707a8a] hover:text-[#f6465d] transition-colors"
              onClick={() => setDeleteId(cat.id)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Category"
        message="Delete this category? Passwords in this category will not be deleted."
        confirmLabel="Delete"
        onConfirm={async () => { await window.vaultAPI.deleteCategory(deleteId!); setDeleteId(null); load() }}
        onCancel={() => setDeleteId(null)}
        danger
      />
    </div>
  )
}
