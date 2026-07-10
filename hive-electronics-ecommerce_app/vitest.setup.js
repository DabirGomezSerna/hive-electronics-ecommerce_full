import * as matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';

// Set API URL before any module is imported so apiClient.js reads it at load time
process.env.REACT_APP_API_URL = 'http://localhost:4000/api';

expect.extend(matchers);

// Suppress localStorage warnings in test output
Object.defineProperty(window, 'localStorage', {
  value: (() => {
    let store = {};
    return {
      getItem: (key) => store[key] ?? null,
      setItem: (key, value) => { store[key] = String(value); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { store = {}; },
      get length() { return Object.keys(store).length; },
      key: (i) => Object.keys(store)[i] ?? null,
    };
  })(),
  writable: true,
});

// Stub window.location.reload
Object.defineProperty(window, 'location', {
  value: { ...window.location, reload: vi.fn() },
  writable: true,
});

// Reset localStorage before each test
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
