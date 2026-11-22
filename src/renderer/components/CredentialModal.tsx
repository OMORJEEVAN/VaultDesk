import React, { useState, useEffect } from 'react'
import { X, Eye, EyeOff, RefreshCw, Plus, Minus, AlertCircle } from 'lucide-react'
import type { Credential, NewCredential, GeneratorOptions } from '@shared/types'
import { DEFAULT_GENERATOR_OPTIONS } from '@shared/types'
import PasswordStrengthBar from './PasswordStrengthBar'
import PasswordGenerator from './PasswordGenerator'

interface Props {
  initial?: Credential | null
  onSave: (data: NewCredential) => Promise<void>
  onClose: () => void
  existingEmails: string[]
  categories: string[]
}

const EMPTY: NewCredential = {
  platformName: '', websiteUrl: '', email: '', username: '',
  password: '', category: '', tags: [], notes: '', isFavorite: false
}

export default function CredentialModal({ initial, onSave, onClose, existingEmails, categories }: Props) {
  const [form, setForm]       = useState<NewCredential>(initial ? { ...initial } : { ...EMPTY })
  const [showPw, setShowPw]   = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [showGen, setShowGen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState<string[]>([])
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([])
  const [showEmailSugg, setShowEmailSugg] = useState(false)

  // Email autocomplete
  useEffect(() => {
    if (!form.email) { setEmailSuggestions([]); return }
    const q = form.email.toLowerCase()
    setEmailSuggestions(existingEmails.filter(e => e.toLowerCase().includes(q) && e !== form.email))
    setShowEmailSugg(true)
  }, [form.email, existingEmails])

  const set = (k: keyof NewCredential, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const addTag = () => {
    const t = tagInput.trim()
    if (!t || form.tags.includes(t) || form.tags.length >= 10) return
    set('tags', [...form.tags, t])
    setTagInput('')
  }

  const removeTag = (t: string) => set('tags', form.tags.filter(x => x !== t))

  const handleSave = async () => {
    setErrors([])
    const errs: string[] = []
    if (!form.platformName.trim()) errs.push('Platform name is required.')
    if (!form.password) errs.push('Password is required.')
    if (errs.length) { setErrors(errs); return }
    setLoading(true)
    await onSave(form)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#1e2329] rounded-2xl border border-[#2b3139] shadow-card-dark flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2b3139] shrink-0">
          <h2 className="text-lg font-semibold text-white">{initial ? 'Edit Password' : 'Add Password'}</h2>
          <button className="p-1.5 rounded-lg hover:bg-[#2b3139] text-[#707a8a] hover:text-white" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-4 space-y-4 flex-1">
          {/* Platform */}
          <div>
            <label className="block text-xs font-medium text-[#707a8a] mb-1">Platform / Service *</label>
            <input className="input h-9 text-sm" placeholder="e.g. Google, GitHub" value={form.platformName} onChange={e => set('platformName', e.target.value)} />
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs font-medium text-[#707a8a] mb-1">Website URL</label>
            <input className="input h-9 text-sm" placeholder="https://example.com" value={form.websiteUrl} onChange={e => set('websiteUrl', e.target.value)} />
          </div>

          {/* Email */}
          <div className="relative">
            <label className="block text-xs font-medium text-[#707a8a] mb-1">Email Address</label>
            <input
              className="input h-9 text-sm"
              placeholder="your@email.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              onBlur={() => setTimeout(() => setShowEmailSugg(false), 150)}
              autoComplete="off"
            />
            {showEmailSugg && emailSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1e2329] border border-[#2b3139] rounded-lg overflow-hidden z-10 shadow-card-dark">
                {emailSuggestions.map(e => (
                  <button key={e} className="w-full text-left px-3 py-2 text-sm hover:bg-[#2b3139] text-[#eaecef]" onClick={() => { set('email', e); setShowEmailSugg(false) }}>
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-[#707a8a] mb-1">Username</label>
            <input className="input h-9 text-sm" placeholder="Username" value={form.username} onChange={e => set('username', e.target.value)} />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-[#707a8a] mb-1">Password *</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className="input h-9 text-sm pr-20 font-mono"
                placeholder="Password"
                value={form.password}
                onChange={e => set('password', e.target.value)}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button type="button" className="p-1 text-[#707a8a] hover:text-white" onClick={() => setShowPw(v => !v)}>
                  {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button type="button" className="p-1 text-[#707a8a] hover:text-[#fcd535]" title="Generate password" onClick={() => setShowGen(v => !v)}>
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {form.password && <PasswordStrengthBar password={form.password} className="mt-2" />}
          </div>

          {/* Generator */}
          {showGen && (
            <PasswordGenerator
              onGenerate={(pw) => { set('password', pw); setShowGen(false) }}
            />
          )}

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-[#707a8a] mb-1">Category</label>
            <select className="input h-9 text-sm" value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-[#707a8a] mb-1">Tags</label>
            <div className="flex gap-2">
              <input
                className="input h-9 text-sm flex-1"
                placeholder="Add tag..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              />
              <button className="btn-ghost h-9 px-3 text-sm" onClick={addTag}><Plus className="w-4 h-4" /></button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map(t => (
                  <span key={t} className="badge bg-[#fcd535]/12 text-[#fcd535] border border-[#fcd535]/25 flex items-center gap-1 pl-2 pr-1 font-mono">
                    {t}
                    <button onClick={() => removeTag(t)} className="hover:text-[#f6465d]"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-[#707a8a] mb-1">Notes</label>
            <textarea
              className="input h-20 text-sm resize-none"
              placeholder="Optional personal notes..."
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </div>

          {/* Favorite */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded accent-[#fcd535]" checked={form.isFavorite} onChange={e => set('isFavorite', e.target.checked)} />
            <span className="text-sm text-[#eaecef]">Mark as favorite</span>
          </label>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-3 rounded-lg bg-[#f6465d]/10 border border-[#f6465d]/25 space-y-1">
              {errors.map((e, i) => (
                <p key={i} className="text-xs text-[#f6465d] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />{e}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-[#2b3139] shrink-0">
          <button className="btn-ghost flex-1 text-sm" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1 text-sm font-semibold" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : initial ? 'Save Changes' : 'Add Password'}
          </button>
        </div>
      </div>
    </div>
  )
}
