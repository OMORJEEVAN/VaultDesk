import React from 'react'
import { analyzePassword } from '@shared/passwordStrength'
import type { PasswordStrength } from '@shared/types'

interface Props { password: string; className?: string }

const STRENGTH_CONFIG: Record<PasswordStrength, { label: string; color: string; bars: number }> = {
  'very-weak':   { label: 'Very Weak',   color: 'bg-red-500',    bars: 1 },
  'weak':        { label: 'Weak',        color: 'bg-orange-500', bars: 2 },
  'fair':        { label: 'Fair',        color: 'bg-yellow-500', bars: 3 },
  'strong':      { label: 'Strong',      color: 'bg-green-500',  bars: 4 },
  'very-strong': { label: 'Very Strong', color: 'bg-vault-500',  bars: 5 },
}

export default function PasswordStrengthBar({ password, className = '' }: Props) {
  if (!password) return null
  const { strength } = analyzePassword(password)
  const config = STRENGTH_CONFIG[strength]

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i < config.bars ? config.color : 'bg-white/[0.1]'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${
        strength === 'very-weak' ? 'text-red-400' :
        strength === 'weak'      ? 'text-orange-400' :
        strength === 'fair'      ? 'text-yellow-400' :
        strength === 'strong'    ? 'text-green-400' : 'text-vault-400'
      }`}>
        {config.label}
      </p>
    </div>
  )
}
