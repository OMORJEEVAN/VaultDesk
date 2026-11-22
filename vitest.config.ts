import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@security': resolve(__dirname, 'src/security')
    }
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    // Use standalone tsconfig that doesn't reference electron-vite
    typecheck: {
      tsconfig: './tsconfig.test.json'
    }
  }
})
