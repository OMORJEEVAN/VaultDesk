import React, { useState } from 'react'
import { Shield, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { validateMasterPassword } from '@shared/validation'
import PasswordStrengthBar from '../components/PasswordStrengthBar'

interface Props { onComplete: () => void }

export default function Setup({ onComplete }: Props): React.ReactElement {
  const [step, setStep]           = useState<'welcome' | 'create'>('welcome')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [showCf, setShowCf]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const validation = validateMasterPassword(password)
  const match = password === confirm && confirm.length > 0

  const handleCreate = async () => {
    setError('')
    if (!validation.valid) { setError(validation.errors[0]); return }
    if (!match) { setError('Passwords do not match.'); return }
    setLoading(true)
    const result = await window.vaultAPI.setupVault(password)
    setLoading(false)
    if (result.success) {
      onComplete()
    } else {
      setError(result.error ?? 'Setup failed.')
    }
  }

  if (step === 'welcome') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-[#0b0e11] text-[#181a20] dark:text-[#eaecef] px-6 animate-fade-in">
        <div className="flex flex-col items-center gap-6 max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl bg-[#fcd535]/15 flex items-center justify-center border border-[#fcd535]/30">
            <Shield className="w-10 h-10 text-[#fcd535]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#181a20] dark:text-white mb-2">Welcome to VaultDesk</h1>
            <p className="text-[#707a8a] text-base leading-relaxed">
              Your secure, completely offline password vault. All data is encrypted on your device — nothing ever leaves your computer.
            </p>
          </div>
          <div className="w-full bg-[#fafafa] dark:bg-[#1e2329] rounded-xl border border-[#eaecef] dark:border-[#2b3139] p-4 text-left space-y-2.5">
            {[
              'AES-256-GCM encryption for all stored credentials',
              'Argon2id key derivation — never stores your master password',
              'Fully offline — no cloud, no telemetry, no accounts',
              'Open source security layer'
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm text-[#181a20] dark:text-[#eaecef]">
                <CheckCircle className="w-4 h-4 text-[#fcd535] shrink-0" />
                {f}
              </div>
            ))}
          </div>
          <button className="btn-primary w-full py-3 text-base font-semibold" onClick={() => setStep('create')}>
            Create My Vault
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-[#0b0e11] text-[#181a20] dark:text-[#eaecef] px-6 animate-fade-in">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-xl bg-[#fcd535]/15 flex items-center justify-center border border-[#fcd535]/30 mx-auto mb-4">
            <Shield className="w-7 h-7 text-[#fcd535]" />
          </div>
          <h2 className="text-2xl font-bold text-[#181a20] dark:text-white">Create Master Password</h2>
          <p className="text-[#707a8a] text-sm mt-1">This password encrypts your entire vault. If you forget it, your data cannot be recovered.</p>
        </div>

        <div className="card p-6 space-y-4">
          {/* Password field */}
          <div>
            <label className="block text-sm font-medium text-[#181a20] dark:text-[#eaecef] mb-1.5">Master Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className="input pr-10 font-mono"
                placeholder="Create a strong master password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#707a8a] hover:text-[#181a20] dark:hover:text-white"
                onClick={() => setShowPw(v => !v)}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {password && <PasswordStrengthBar password={password} className="mt-2" />}
          </div>

          {/* Requirements */}
          {password && !validation.valid && (
            <ul className="space-y-1">
              {validation.errors.map((e, i) => (
                <li key={i} className="flex items-center gap-1.5 text-xs text-[#fcd535]">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {e}
                </li>
              ))}
            </ul>
          )}

          {/* Confirm field */}
          <div>
            <label className="block text-sm font-medium text-[#181a20] dark:text-[#eaecef] mb-1.5">Confirm Master Password</label>
            <div className="relative">
              <input
                type={showCf ? 'text' : 'password'}
                className={`input pr-10 font-mono ${confirm && !match ? 'border-[#f6465d]/50 focus:ring-[#f6465d]/30' : ''}`}
                placeholder="Repeat your master password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#707a8a] hover:text-white"
                onClick={() => setShowCf(v => !v)}
              >
                {showCf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirm && !match && (
              <p className="text-xs text-[#f6465d] mt-1 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3 h-3" /> Passwords do not match
              </p>
            )}
            {confirm && match && (
              <p className="text-xs text-[#0ecb81] mt-1 flex items-center gap-1 font-mono">
                <CheckCircle className="w-3 h-3" /> Passwords match
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#f6465d]/10 border border-[#f6465d]/20 text-[#f6465d] text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Warning */}
          <div className="p-3 rounded-lg bg-[#fcd535]/10 border border-[#fcd535]/25">
            <p className="text-xs text-[#fcd535] leading-relaxed">
              ⚠️ <strong>Important:</strong> There is no password reset. If you forget your master password, your vault data cannot be recovered.
            </p>
          </div>

          <button
            className="btn-primary w-full py-3 font-semibold"
            onClick={handleCreate}
            disabled={loading || !validation.valid || !match}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#181a20]/30 border-t-[#181a20] rounded-full animate-spin" />
                Creating vault...
              </span>
            ) : 'Create Vault'}
          </button>
        </div>
      </div>
    </div>
  )
}
