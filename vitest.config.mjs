import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.spec.mjs'],
    coverage: {
      provider: 'v8',
      reporter: ['lcovonly', 'html', 'text-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.js'],
      all: true
    },
    clearMocks: true,
    restoreMocks: true,
    environment: 'node'
  }
})

