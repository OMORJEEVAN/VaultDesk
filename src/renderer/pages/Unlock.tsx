import React, { useState } from 'react'
import { Shield, Eye, EyeOff, AlertCircle, Lock } from 'lucide-react'
import appLogo from '../assets/logo.png'

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
    <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-[#0b0e11] text-[#181a20] dark:text-[#eaecef] px-6 animate-fade-in">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <img src={appLogo} alt="VaultDesk" className="w-16 h-16 rounded-2xl object-contain shadow-sm border border-[#fcd535]/30 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#181a20] dark:text-white">Unlock VaultDesk</h2>
          <p className="text-[#707a8a] text-sm mt-1">Enter your master password to access your vault</p>
        </div>

        <div className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#181a20] dark:text-[#eaecef] mb-1.5">Master Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className={`input pr-10 font-mono ${error ? 'border-[#f6465d]/50 focus:ring-[#f6465d]/30' : ''}`}
                placeholder="Enter your master password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                autoFocus
                disabled={loading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#707a8a] hover:text-white"
                onClick={() => setShowPw(v => !v)}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#f6465d]/10 border border-[#f6465d]/20 text-[#f6465d] text-sm animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
              {attempts >= 3 && (
                <span className="ml-auto text-xs text-[#f6465d]/70">({attempts} attempts)</span>
              )}
            </div>
          )}

          <button
            className="btn-primary w-full py-3 font-semibold"
            onClick={handleUnlock}
            disabled={loading || !password}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#181a20]/30 border-t-[#181a20] rounded-full animate-spin" />
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

        <p className="text-center text-xs text-[#707a8a]">
          Forgot your master password? Unfortunately, the encrypted vault cannot be accessed without it.
        </p>
      </div>
    </div>
  )
}
