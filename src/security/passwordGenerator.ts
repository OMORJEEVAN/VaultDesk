// ============================================================
// VaultDesk – Cryptographically Secure Password Generator
// ============================================================
// Uses Node.js crypto.randomBytes (CSPRNG) exclusively.
// Never uses Math.random().
// ============================================================

import { randomBytes } from 'crypto'
import type { GeneratorOptions } from '../shared/types'

// Re-export analyzePassword from shared (renderer-safe, no Node.js deps)
export { analyzePassword } from '../shared/passwordStrength'

const UPPERCASE         = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWERCASE         = 'abcdefghijklmnopqrstuvwxyz'
const NUMBERS           = '0123456789'
const SYMBOLS           = '!@#$%^&*()_+-=[]{}|;:,.<>?'
const AMBIGUOUS_CHARS   = /[0OIl1]/g

/**
 * Generate a random password using a cryptographically secure RNG.
 * Uses rejection sampling to avoid modulo bias.
 */
export function generatePassword(options: GeneratorOptions): string {
  const { length, uppercase, lowercase, numbers, symbols, excludeAmbiguous } = options

  let charset = ''
  const required: string[] = []

  if (uppercase) {
    let chars = UPPERCASE
    if (excludeAmbiguous) chars = chars.replace(AMBIGUOUS_CHARS, '')
    charset += chars
    required.push(randomFromSet(chars))
  }
  if (lowercase) {
    let chars = LOWERCASE
    if (excludeAmbiguous) chars = chars.replace(AMBIGUOUS_CHARS, '')
    charset += chars
    required.push(randomFromSet(chars))
  }
  if (numbers) {
    let chars = NUMBERS
    if (excludeAmbiguous) chars = chars.replace(AMBIGUOUS_CHARS, '')
    charset += chars
    required.push(randomFromSet(chars))
  }
  if (symbols) {
    charset += SYMBOLS
    required.push(randomFromSet(SYMBOLS))
  }

  if (!charset) throw new Error('At least one character set must be selected.')
  if (length < required.length) throw new Error('Password length is too short for the selected options.')

  // Fill remaining characters
  const remaining: string[] = []
  for (let i = required.length; i < length; i++) {
    remaining.push(randomFromSet(charset))
  }

  // Shuffle required + remaining using Fisher-Yates with CSPRNG
  const all = [...required, ...remaining]
  cryptoShuffle(all)

  return all.join('')
}

/**
 * Pick one character from a set using rejection sampling (no modulo bias).
 */
function randomFromSet(charset: string): string {
  if (!charset) throw new Error('Empty charset')
  const max = Math.floor(256 / charset.length) * charset.length
  let byte: number
  do {
    byte = randomBytes(1)[0]
  } while (byte >= max)
  return charset[byte % charset.length]
}

/**
 * Fisher-Yates shuffle with CSPRNG.
 */
function cryptoShuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = cryptoRandomInt(0, i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

/**
 * Generate a random integer in [min, max) using rejection sampling.
 */
function cryptoRandomInt(min: number, max: number): number {
  const range = max - min
  if (range <= 0) throw new RangeError('max must be greater than min')
  const bytesNeeded = Math.ceil(Math.log2(range) / 8) || 1
  const maxValid = Math.floor(256 ** bytesNeeded / range) * range
  let value: number
  do {
    const bytes = randomBytes(bytesNeeded)
    value = bytes.reduce((acc, b) => acc * 256 + b, 0)
  } while (value >= maxValid)
  return min + (value % range)
}

// (analyzePassword is now in src/shared/passwordStrength.ts and re-exported above)
