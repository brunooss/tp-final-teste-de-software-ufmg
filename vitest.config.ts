/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  // This is a workaround for the following issue:
  // https://github.com/vitest-dev/vitest/issues/4513
  // It's required for the tests to run correctly.
  resolve: {
    alias: {
      'react/jsx-dev-runtime': 'react/jsx-dev-runtime.js',
    },
  },
});
