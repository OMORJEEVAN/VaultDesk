import { describe, it, expect } from 'vitest'
import { validateMasterPassword, validateCredential, validateCategoryName, sanitizeString } from '../src/shared/validation'

describe('Input Validation', () => {
  describe('validateMasterPassword', () => {
    it('accepts a strong password', () => {
      const { valid } = validateMasterPassword('MyStr0ng!Pass#2024')
      expect(valid).toBe(true)
    })
    it('rejects short passwords', () => {
      const { valid, errors } = validateMasterPassword('Short1!')
      expect(valid).toBe(false)
      expect(errors.some(e => e.includes('12 characters'))).toBe(true)
    })
    it('rejects passwords without uppercase', () => {
      const { valid } = validateMasterPassword('nouppercase123!!')
      expect(valid).toBe(false)
    })
    it('rejects passwords without special characters', () => {
      const { valid } = validateMasterPassword('NoSpecialChar123')
      expect(valid).toBe(false)
    })
  })

  describe('validateCredential', () => {
    it('accepts valid credential', () => {
      const { valid } = validateCredential({ platformName: 'Google', password: 'pass123' })
      expect(valid).toBe(true)
    })
    it('rejects missing platform name', () => {
      const { valid } = validateCredential({ platformName: '', password: 'pass123' })
      expect(valid).toBe(false)
    })
    it('rejects missing password', () => {
      const { valid } = validateCredential({ platformName: 'Google', password: '' })
      expect(valid).toBe(false)
    })
    it('rejects invalid email', () => {
      const { valid } = validateCredential({ platformName: 'Google', password: 'p', email: 'notanemail' })
      expect(valid).toBe(false)
    })
    it('rejects invalid URL', () => {
      const { valid } = validateCredential({ platformName: 'Google', password: 'p', websiteUrl: 'not-a-url' })
      expect(valid).toBe(false)
    })
  })

  describe('sanitizeString', () => {
    it('removes null bytes', () => {
      expect(sanitizeString('hello\x00world')).toBe('helloworld')
    })
    it('truncates to maxLength', () => {
      expect(sanitizeString('a'.repeat(200), 100)).toHaveLength(100)
    })
    it('returns empty string for non-string input', () => {
      expect(sanitizeString(123)).toBe('')
    })
  })
})
