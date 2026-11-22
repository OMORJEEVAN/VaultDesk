import { describe, it, expect } from 'vitest'
import { encrypt, decrypt, buildCredentialAAD, buildKeyCheckAAD, generateNonce } from '../src/security/encryption'
import { randomBytes } from 'crypto'

const KEY_32 = randomBytes(32)

describe('AES-256-GCM Encryption', () => {
  it('encrypts and decrypts a string correctly', () => {
    const plaintext = 'Hello, VaultDesk!'
    const { ciphertext, nonce, authTag } = encrypt(KEY_32, plaintext)
    const decrypted = decrypt(KEY_32, { ciphertext, nonce, authTag })
    expect(decrypted.toString('utf8')).toBe(plaintext)
  })

  it('encrypts and decrypts with AAD', () => {
    const aad = buildCredentialAAD(42, 1)
    const { ciphertext, nonce, authTag } = encrypt(KEY_32, 'secret', aad)
    const decrypted = decrypt(KEY_32, { ciphertext, nonce, authTag }, aad)
    expect(decrypted.toString('utf8')).toBe('secret')
  })

  it('rejects decryption with wrong key', () => {
    const { ciphertext, nonce, authTag } = encrypt(KEY_32, 'secret')
    const wrongKey = randomBytes(32)
    expect(() => decrypt(wrongKey, { ciphertext, nonce, authTag })).toThrow()
  })

  it('rejects tampered ciphertext (authentication tag fails)', () => {
    const { ciphertext, nonce, authTag } = encrypt(KEY_32, 'secret')
    ciphertext[0] ^= 0xFF  // flip a bit
    expect(() => decrypt(KEY_32, { ciphertext, nonce, authTag })).toThrow()
  })

  it('rejects tampered authentication tag', () => {
    const { ciphertext, nonce, authTag } = encrypt(KEY_32, 'secret')
    authTag[0] ^= 0xFF
    expect(() => decrypt(KEY_32, { ciphertext, nonce, authTag })).toThrow()
  })

  it('rejects decryption when AAD does not match', () => {
    const aad = buildCredentialAAD(1, 1)
    const wrongAad = buildCredentialAAD(2, 1)
    const { ciphertext, nonce, authTag } = encrypt(KEY_32, 'secret', aad)
    expect(() => decrypt(KEY_32, { ciphertext, nonce, authTag }, wrongAad)).toThrow()
  })

  it('generates unique nonces', () => {
    const nonces = new Set(Array.from({ length: 100 }, () => generateNonce().toString('hex')))
    expect(nonces.size).toBe(100)
  })

  it('produces different ciphertext for the same plaintext (due to random nonce)', () => {
    const r1 = encrypt(KEY_32, 'same input')
    const r2 = encrypt(KEY_32, 'same input')
    expect(r1.nonce.toString('hex')).not.toBe(r2.nonce.toString('hex'))
    expect(r1.ciphertext.toString('hex')).not.toBe(r2.ciphertext.toString('hex'))
  })

  it('rejects key with wrong length', () => {
    const shortKey = randomBytes(16)
    expect(() => encrypt(shortKey, 'test')).toThrow()
  })
})
