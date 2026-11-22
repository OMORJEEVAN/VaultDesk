import React, { useState } from 'react'
import { Shield, Eye, EyeOff, AlertCircle, Lock } from 'lucide-react'

interface Props { onUnlocked: () => void }

export default function Unlock({ onUnlocked }: Props): React.ReactElement {
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [attempts, setAttempts] = useState(0)

  const handleUnlock = async () => {
    if (!password) { setError('Please enter your master password.'); return }
    setError('')
    setLoading(true)
    const result = await window.vaultAPI.unlockVault(password)
    setLoading(false)
    if (result.success) {
      onUnlocked()
    } else {
      setAttempts(a => a + 1)
      setError(result.error ?? 'Incorrect master password.')
      setPassword('')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-surface-300 px-6 animate-fade-in">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-vault-500/20 flex items-center justify-center border border-vault-500/30 mx-auto mb-4">
            <Lock className="w-8 h-8 text-vault-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Unlock VaultDesk</h2>
          <p className="text-slate-400 text-sm mt-1">Enter your master password to access your vault</p>
        </div>

        <div className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Master Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className={`input pr-10 ${error ? 'border-red-500/50 focus:ring-red-500/30' : ''}`}
                placeholder="Enter your master password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                autoFocus
                disabled={loading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                onClick={() => setShowPw(v => !v)}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
              {attempts >= 3 && (
                <span className="ml-auto text-xs text-red-300/70">({attempts} attempts)</span>
              )}
            </div>
          )}

          <button
            className="btn-primary w-full py-3"
            onClick={handleUnlock}
            disabled={loading || !password}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Unlocking...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" />
                Unlock Vault
              </span>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-slate-600">
          Forgot your master password? Unfortunately, the encrypted vault cannot be accessed without it.
        </p>
      </div>
    </div>
  )
}
