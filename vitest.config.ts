// vitest.config.js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // Optional: If you're using a specific setup file
    // setupFiles: './src/setupTests.js',
  },
});
