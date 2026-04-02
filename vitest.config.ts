import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // yahoo-finance2가 내부에서 'node' export condition을 쓰므로 명시적으로 추가
    conditions: ['node', 'import', 'module', 'browser', 'default'],
  },
  test: {
    environment: 'node',
    globals: true,
    server: {
      deps: {
        // yahoo-finance2를 Vitest가 직접 번들로 처리하도록 강제
        inline: ['yahoo-finance2'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
