import { describe, it, expect } from 'vitest'
import { deriveKey, generateSalt, KDF_PARAMS, verifyDerivedKey } from '../src/security/keyDerivation'

describe('Argon2id Key Derivation', () => {
  it('derives a 32-byte key from a master password', async () => {
    const salt = generateSalt()
    const key = await deriveKey('MyStrongPassword123!', salt)
    expect(key).toBeInstanceOf(Buffer)
    expect(key.length).toBe(32)
  })

  it('derives the same key from the same password and salt', async () => {
    const salt = generateSalt()
    const key1 = await deriveKey('MyPassword!123', salt)
    const key2 = await deriveKey('MyPassword!123', salt)
    expect(key1.toString('hex')).toBe(key2.toString('hex'))
  })

  it('derives a different key for different passwords', async () => {
    const salt = generateSalt()
    const key1 = await deriveKey('Password1!', salt)
    const key2 = await deriveKey('Password2!', salt)
    expect(key1.toString('hex')).not.toBe(key2.toString('hex'))
  })

  it('derives a different key for different salts', async () => {
    const salt1 = generateSalt()
    const salt2 = generateSalt()
    const key1 = await deriveKey('SamePassword1!', salt1)
    const key2 = await deriveKey('SamePassword1!', salt2)
    expect(key1.toString('hex')).not.toBe(key2.toString('hex'))
  })

  it('verifyDerivedKey returns true for correct password', async () => {
    const salt = generateSalt()
    const expected = await deriveKey('CorrectPass!123', salt)
    const result = await verifyDerivedKey('CorrectPass!123', salt, expected)
    expect(result).toBe(true)
  })

  it('verifyDerivedKey returns false for wrong password', async () => {
    const salt = generateSalt()
    const expected = await deriveKey('CorrectPass!123', salt)
    const result = await verifyDerivedKey('WrongPassword!', salt, expected)
    expect(result).toBe(false)
  })

  it('generates unique salts', () => {
    const salts = new Set(Array.from({ length: 50 }, () => generateSalt().toString('hex')))
    expect(salts.size).toBe(50)
  })
})
