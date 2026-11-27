import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // The smoke test, and every test after it, uses test/expect without importing them.
    globals: true,
    include: ['api/**/*.test.ts', 'infra/**/*.test.ts', 'tools/**/*.test.mjs'],
  },
})
