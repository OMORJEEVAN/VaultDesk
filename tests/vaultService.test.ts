import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  initDatabase, closeDatabase, getVaultSettings,
  getAllCredentialRows, getDatabasePath
} from '../src/main/database'
import {
  setupVault, unlockVault, lockVault, getVaultStatus,
  addCredential, getCredentials, updateCredential,
  deleteCredential, buildSecurityReport
} from '../src/main/vaultService'
import type { NewCredential } from '../src/shared/types'

const TEST_DIR = path.join(__dirname, 'test_vault_data')

describe('VaultService & SQLite Integration', () => {
  beforeEach(async () => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true })
    }
    fs.mkdirSync(TEST_DIR, { recursive: true })
    await initDatabase(TEST_DIR)
  })

  afterEach(() => {
    lockVault()
    closeDatabase()
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true })
    }
  })

  it('initializes as uninitialized', () => {
    expect(getVaultStatus()).toBe('uninitialized')
  })

  it('sets up master password with Argon2id and transitions to unlocked', async () => {
    const masterPassword = 'MyVaultPassword#2026'
    await setupVault(masterPassword)

    expect(getVaultStatus()).toBe('unlocked')

    const settings = getVaultSettings()
    expect(settings).not.toBeNull()
    expect(settings?.kdfAlgorithm).toBe('argon2id')
    expect(settings?.salt).toBeDefined()
    expect(settings?.keyCheckCiphertext).toBeDefined()
    expect(settings?.keyCheckAuthTag).toBeDefined()
    expect(settings?.keyCheckNonce).toBeDefined()
  })

  it('correctly locks and unlocks with master password', async () => {
    const masterPassword = 'CorrectMasterPassword!123'
    await setupVault(masterPassword)

    // Lock
    lockVault()
    expect(getVaultStatus()).toBe('locked')

    // Wrong password should fail
    const wrongAttempt = await unlockVault('WrongPassword!999')
    expect(wrongAttempt).toBe(false)
    expect(getVaultStatus()).toBe('locked')

    // Correct password should unlock
    const correctAttempt = await unlockVault(masterPassword)
    expect(correctAttempt).toBe(true)
    expect(getVaultStatus()).toBe('unlocked')
  })

  it('encrypts credentials with AES-256-GCM and stores NO plaintext in SQLite', async () => {
    const masterPassword = 'SecureMasterPass#456'
    await setupVault(masterPassword)

    const secretPassword = 'UltraSecretPassword789!@#'
    const secretNotes = 'Private Banking PIN is 4321'
    const newCred: NewCredential = {
      platformName: 'SwissBank',
      websiteUrl: 'https://swissbank.ch/login',
      email: 'user@swissbank.ch',
      username: 'swiss_user',
      password: secretPassword,
      category: 'Finance / Banking',
      tags: ['bank', 'swiss'],
      notes: secretNotes,
      isFavorite: true
    }

    const id = addCredential(newCred)
    expect(id).toBeGreaterThan(0)

    // Check in-memory decrypted access
    const creds = getCredentials()
    expect(creds.length).toBe(1)
    expect(creds[0].password).toBe(secretPassword)
    expect(creds[0].notes).toBe(secretNotes)

    // Read RAW SQLite file from disk
    const dbFilePath = getDatabasePath()
    const rawDbContent = fs.readFileSync(dbFilePath).toString('binary')

    // Verify raw SQLite disk file does NOT contain the sensitive strings!
    expect(rawDbContent.includes(secretPassword)).toBe(false)
    expect(rawDbContent.includes(secretNotes)).toBe(false)
    expect(rawDbContent.includes('SwissBank')).toBe(false)
    expect(rawDbContent.includes('user@swissbank.ch')).toBe(false)

    // Verify raw row in DB table is binary encrypted ciphertext
    const rows = getAllCredentialRows()
    expect(rows.length).toBe(1)
    expect(Buffer.isBuffer(rows[0].encrypted_data)).toBe(true)
    expect(rows[0].encrypted_data.toString('utf8').includes(secretPassword)).toBe(false)
  })

  it('detects duplicate accounts and reused passwords in security report', async () => {
    const masterPassword = 'MasterPassReporting#1'
    await setupVault(masterPassword)

    const sharedPass = 'SameReusedPassword123!'

    addCredential({
      platformName: 'Google',
      websiteUrl: 'https://accounts.google.com',
      email: 'alice@example.com',
      username: 'alice',
      password: sharedPass,
      category: 'Email',
      tags: [],
      notes: '',
      isFavorite: false
    })

    addCredential({
      platformName: 'GitHub',
      websiteUrl: 'https://github.com',
      email: 'alice@example.com',
      username: 'alice_dev',
      password: sharedPass, // Reused!
      category: 'Developer / Tech',
      tags: [],
      notes: '',
      isFavorite: true
    })

    addCredential({
      platformName: 'Google', // Duplicate platform + email!
      websiteUrl: 'https://mail.google.com',
      email: 'alice@example.com',
      username: 'alice_work',
      password: 'UniqueStrongPassword999$#@!',
      category: 'Email',
      tags: [],
      notes: '',
      isFavorite: false
    })

    const report = buildSecurityReport()
    expect(report.total).toBe(3)
    expect(report.reused).toBe(2) // 2 accounts reuse the same password
    expect(report.duplicateAccounts).toBe(1) // Google + alice@example.com duplicate
    expect(report.reusedGroups.length).toBe(1)
    expect(report.reusedGroups[0].password).toBe(sharedPass)
  })

  it('clears in-memory keys and decrypted records on lock', async () => {
    const masterPassword = 'MasterPasswordMemoryTest!1'
    await setupVault(masterPassword)

    addCredential({
      platformName: 'Netflix',
      websiteUrl: 'https://netflix.com',
      email: 'movie@example.com',
      username: 'moviefan',
      password: 'StreamMoviePass2026!',
      category: 'Entertainment',
      tags: [],
      notes: '',
      isFavorite: false
    })

    expect(getCredentials().length).toBe(1)

    // Lock vault
    lockVault()

    // Attempting to read credentials while locked MUST throw
    expect(() => getCredentials()).toThrow(/locked/i)
  })
})
