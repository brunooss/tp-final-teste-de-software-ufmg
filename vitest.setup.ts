// This file can be used to set up global mocks or configurations for Vitest.
// For example, mocking a global function or a library.
import { vi } from 'vitest';

// Example: Mocking the 'next/navigation' module
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  redirect: (path: string) => {
    console.log(`Mock redirect to: ${path}`);
  }
}));
