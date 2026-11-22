import React from 'react'
import { analyzePassword } from '@shared/passwordStrength'
import type { PasswordStrength } from '@shared/types'

interface Props { password: string; className?: string }

const STRENGTH_CONFIG: Record<PasswordStrength, { label: string; color: string; bars: number }> = {
  'very-weak':   { label: 'Very Weak',   color: 'bg-[#f6465d]', bars: 1 },
  'weak':        { label: 'Weak',        color: 'bg-[#f6465d]', bars: 2 },
  'fair':        { label: 'Fair',        color: 'bg-[#fcd535]', bars: 3 },
  'strong':      { label: 'Strong',      color: 'bg-[#0ecb81]', bars: 4 },
  'very-strong': { label: 'Very Strong', color: 'bg-[#0ecb81]', bars: 5 },
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
              i < config.bars ? config.color : 'bg-[#2b3139]'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium font-mono ${
        strength === 'very-weak' ? 'text-[#f6465d]' :
        strength === 'weak'      ? 'text-[#f6465d]' :
        strength === 'fair'      ? 'text-[#fcd535]' :
        strength === 'strong'    ? 'text-[#0ecb81]' : 'text-[#0ecb81]'
      }`}>
        {config.label}
      </p>
    </div>
  )
}
