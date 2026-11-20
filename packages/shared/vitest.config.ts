import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
        // Pure domain logic is held to full coverage (docs/testing/test-strategy.md).
        'src/domain/**/*.ts': { lines: 100, branches: 100, functions: 100, statements: 100 },
      },
    },
  },
});
