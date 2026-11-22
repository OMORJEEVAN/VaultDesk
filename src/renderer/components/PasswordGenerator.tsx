import React, { useState, useCallback } from 'react'
import { RefreshCw, Copy, Check } from 'lucide-react'
import type { GeneratorOptions } from '@shared/types'
import { DEFAULT_GENERATOR_OPTIONS } from '@shared/types'
import { analyzePassword } from '@shared/passwordStrength'

interface Props {
  onGenerate?: (password: string) => void
  standalone?: boolean
}

export default function PasswordGenerator({ onGenerate, standalone }: Props) {
  const [opts, setOpts]     = useState<GeneratorOptions>({ ...DEFAULT_GENERATOR_OPTIONS })
  const [password, setPw]   = useState('Click generate to create a password')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const generate = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.vaultAPI.generatePassword(opts)
      if (result.success && result.password) {
        setPw(result.password)
        setCopied(false)
      }
    } catch {}
    setLoading(false)
  }, [opts])

  // Generate on mount
  React.useEffect(() => { generate() }, [])

  const copy = async () => {
    if (!password || password.startsWith('Click')) return
    await window.vaultAPI.writeClipboard(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const setOpt = <K extends keyof GeneratorOptions>(k: K, v: GeneratorOptions[K]) => {
    setOpts(o => ({ ...o, [k]: v }))
  }

  const { score, strength } = analyzePassword(password)

  return (
    <div className={`space-y-3 ${standalone ? '' : 'p-3 bg-[#0b0e11] rounded-xl border border-[#2b3139]'}`}>
      {/* Generated password display */}
      <div className="relative">
        <div className="font-mono text-sm bg-[#0b0e11] border border-[#2b3139] rounded-lg px-3 py-2.5 pr-20 text-white break-all min-h-[2.5rem]">
          {loading ? <span className="text-[#707a8a]">Generating...</span> : password}
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            className="p-1.5 rounded hover:bg-[#2b3139] text-[#707a8a] hover:text-[#fcd535]"
            onClick={generate} title="Regenerate" disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            className="p-1.5 rounded hover:bg-[#2b3139] text-[#707a8a] hover:text-[#0ecb81]"
            onClick={copy} title="Copy"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#0ecb81]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5 flex-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
              i < Math.ceil(score / 20) ?
                (strength === 'very-strong' || strength === 'strong' ? 'bg-[#0ecb81]' :
                 strength === 'fair' ? 'bg-[#fcd535]' : 'bg-[#f6465d]')
                : 'bg-[#2b3139]'
            }`} />
          ))}
        </div>
        <span className="text-xs text-[#707a8a] shrink-0 capitalize font-mono">{strength.replace('-', ' ')}</span>
      </div>

      {/* Controls */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-3">
          <label className="text-xs text-[#707a8a] w-16 shrink-0 font-mono">Length: {opts.length}</label>
          <input
            type="range" min={8} max={64} value={opts.length}
            className="flex-1 h-1 accent-[#fcd535]"
            onChange={e => setOpt('length', Number(e.target.value))}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {([
            ['uppercase', 'Uppercase (A-Z)'],
            ['lowercase', 'Lowercase (a-z)'],
            ['numbers',   'Numbers (0-9)'],
            ['symbols',   'Symbols (!@#...)'],
          ] as [keyof GeneratorOptions, string][]).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox" className="w-3.5 h-3.5 accent-[#fcd535]"
                checked={opts[k] as boolean}
                onChange={e => setOpt(k, e.target.checked)}
              />
              <span className="text-xs text-[#eaecef]">{label}</span>
            </label>
          ))}
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox" className="w-3.5 h-3.5 accent-[#fcd535]"
            checked={opts.excludeAmbiguous}
            onChange={e => setOpt('excludeAmbiguous', e.target.checked)}
          />
          <span className="text-xs text-[#eaecef]">Exclude ambiguous chars (0, O, l, 1)</span>
        </label>
      </div>

      <div className="flex gap-2">
        <button className="btn-ghost flex-1 text-sm py-1.5" onClick={generate} disabled={loading}>
          <RefreshCw className="w-3.5 h-3.5 inline mr-1" />Regenerate
        </button>
        {onGenerate && (
          <button className="btn-primary flex-1 text-sm py-1.5" onClick={() => onGenerate(password)}>
            Use This Password
          </button>
        )}
      </div>
    </div>
  )
}
