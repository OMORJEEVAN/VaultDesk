// ============================================================
// VaultDesk – Password Strength Analysis (Renderer-safe)
// ============================================================
// Pure TypeScript — no Node.js APIs. Can run in both main and renderer.
// ============================================================

import type { PasswordAnalysis, PasswordStrength } from './types'

/**
 * Analyse password strength locally (no network calls, no Node APIs).
 */
export function analyzePassword(password: string): PasswordAnalysis {
  const feedback: string[] = []
  let score = 0

  if (!password) {
    return { strength: 'very-weak', score: 0, feedback: ['Password is empty.'], entropy: 0 }
  }

  // Length scoring
  if (password.length >= 20)      score += 30
  else if (password.length >= 16) score += 22
  else if (password.length >= 12) score += 15
  else if (password.length >= 8)  score += 8
  else { score += 2; feedback.push('Use at least 12 characters.') }

  // Character variety
  const hasUpper  = /[A-Z]/.test(password)
  const hasLower  = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSymbol = /[^A-Za-z0-9]/.test(password)

  if (hasUpper)  score += 10; else feedback.push('Add uppercase letters.')
  if (hasLower)  score += 10; else feedback.push('Add lowercase letters.')
  if (hasNumber) score += 10; else feedback.push('Add numbers.')
  if (hasSymbol) score += 15; else feedback.push('Add special characters.')

  // Pattern penalties
  if (/(.)\1{2,}/.test(password))  { score -= 10; feedback.push('Avoid repeated characters.') }
  if (/^[A-Za-z]+$/.test(password)) { score -= 5;  feedback.push('Mix in numbers and symbols.') }
  if (/^[0-9]+$/.test(password))   { score -= 10; feedback.push('Do not use only numbers.') }

  // Common patterns
  const common = ['password', '123456', 'qwerty', 'abc123', 'letmein', 'admin', 'login', 'welcome']
  if (common.some(p => password.toLowerCase().includes(p))) {
    score -= 20
    feedback.push('Avoid common words or patterns.')
  }

  // Entropy estimate
  let charsetSize = 0
  if (hasLower)  charsetSize += 26
  if (hasUpper)  charsetSize += 26
  if (hasNumber) charsetSize += 10
  if (hasSymbol) charsetSize += 32
  const entropy = password.length * Math.log2(charsetSize || 1)

  score = Math.max(0, Math.min(100, score))

  let strength: PasswordStrength
  if (score >= 80)      strength = 'very-strong'
  else if (score >= 60) strength = 'strong'
  else if (score >= 40) strength = 'fair'
  else if (score >= 20) strength = 'weak'
  else                  strength = 'very-weak'

  return { strength, score, feedback, entropy: Math.round(entropy) }
}
