import { describe, it, expect } from 'vitest'
import { generatePassword, analyzePassword } from '../src/security/passwordGenerator'
import type { GeneratorOptions } from '../src/shared/types'

const DEFAULT_OPTS: GeneratorOptions = {
  length: 20, uppercase: true, lowercase: true, numbers: true, symbols: true, excludeAmbiguous: false
}

describe('Password Generator', () => {
  it('generates a password of the specified length', () => {
    for (const len of [8, 12, 16, 20, 32, 64]) {
      const pw = generatePassword({ ...DEFAULT_OPTS, length: len })
      expect(pw.length).toBe(len)
    }
  })

  it('includes at least one uppercase when required', () => {
    for (let i = 0; i < 20; i++) {
      const pw = generatePassword({ ...DEFAULT_OPTS, lowercase: false, numbers: false, symbols: false })
      expect(/[A-Z]/.test(pw)).toBe(true)
    }
  })

  it('includes at least one lowercase when required', () => {
    for (let i = 0; i < 20; i++) {
      const pw = generatePassword({ ...DEFAULT_OPTS, uppercase: false, numbers: false, symbols: false })
      expect(/[a-z]/.test(pw)).toBe(true)
    }
  })

  it('includes at least one digit when required', () => {
    for (let i = 0; i < 20; i++) {
      const pw = generatePassword({ ...DEFAULT_OPTS, uppercase: false, lowercase: false, symbols: false })
      expect(/[0-9]/.test(pw)).toBe(true)
    }
  })

  it('includes at least one symbol when required', () => {
    for (let i = 0; i < 20; i++) {
      const pw = generatePassword({ ...DEFAULT_OPTS, uppercase: false, lowercase: false, numbers: false })
      expect(/[^A-Za-z0-9]/.test(pw)).toBe(true)
    }
  })

  it('generates unique passwords (no two identical)', () => {
    const pws = new Set(Array.from({ length: 50 }, () => generatePassword(DEFAULT_OPTS)))
    expect(pws.size).toBe(50)
  })

  it('excludes ambiguous characters when requested', () => {
    for (let i = 0; i < 20; i++) {
      const pw = generatePassword({ ...DEFAULT_OPTS, excludeAmbiguous: true, symbols: false })
      expect(/[0OIl1]/.test(pw)).toBe(false)
    }
  })

  it('throws if no character set selected', () => {
    expect(() => generatePassword({ ...DEFAULT_OPTS, uppercase: false, lowercase: false, numbers: false, symbols: false }))
      .toThrow()
  })
})

describe('Password Strength Analyzer', () => {
  it('rates very short passwords as very-weak', () => {
    expect(analyzePassword('abc').strength).toBe('very-weak')
  })

  it('rates long complex passwords as strong or very-strong', () => {
    const { strength } = analyzePassword('K9!xLm#2Pq$rT5@nWvYz')
    expect(['strong', 'very-strong']).toContain(strength)
  })

  it('rates common patterns as weak', () => {
    const { strength } = analyzePassword('password123')
    expect(['very-weak', 'weak', 'fair']).toContain(strength)
  })

  it('provides feedback for weak passwords', () => {
    const { feedback } = analyzePassword('abc')
    expect(feedback.length).toBeGreaterThan(0)
  })

  it('calculates positive entropy for non-empty passwords', () => {
    const { entropy } = analyzePassword('MyPass123!')
    expect(entropy).toBeGreaterThan(0)
  })

  it('handles empty string gracefully', () => {
    const { strength, score } = analyzePassword('')
    expect(strength).toBe('very-weak')
    expect(score).toBe(0)
  })
})
