/**
 * Unit tests — userServices
 *
 * Services now call apiClient which makes real fetch() calls to the backend.
 * apiClient is mocked at the module level so no real network calls are made.
 *
 * Auth data flow (post-connection):
 *   login()  → apiClient('/login') → decodes JWT → stores token + userData in localStorage
 *   logout() → removes authToken, refreshToken, userData
 *   isAuthenticated() → checks localStorage('authToken') !== null
 *   getCurrentUser() → JSON.parse(localStorage('userData'))
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  login,
  logout,
  register,
  getCurrentUser,
  isAuthenticated,
} from '../../services/userServices';

vi.mock('../../services/apiClient', () => ({
  default: vi.fn(),
}));

import apiClient from '../../services/apiClient';

// A minimal JWT with a decodable payload (header.payload.sig)
const makeJwt = (payload) =>
  `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify(payload))}.sig`;

const mockToken = makeJwt({ userId: 'u1', name: 'John Doe', role: 'customer' });
const mockRefreshToken = 'refresh-token-abc';

beforeEach(() => {
  apiClient.mockReset();
  localStorage.clear();
});

// ── login() ───────────────────────────────────────────────────────────────────
describe('login()', () => {
  it('TC-UNIT-FE-001 — valid credentials return success:true', async () => {
    apiClient.mockResolvedValue({ token: mockToken, refreshToken: mockRefreshToken });

    const result = await login('john@email.com', 'john123');

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('john@email.com');
  });

  it('TC-UNIT-FE-002 — valid login stores authToken in localStorage', async () => {
    apiClient.mockResolvedValue({ token: mockToken, refreshToken: mockRefreshToken });

    await login('john@email.com', 'john123');

    expect(localStorage.getItem('authToken')).toBe(mockToken);
  });

  it('TC-UNIT-FE-003 — valid login stores userData (JSON) in localStorage', async () => {
    apiClient.mockResolvedValue({ token: mockToken, refreshToken: mockRefreshToken });

    await login('john@email.com', 'john123');

    const stored = JSON.parse(localStorage.getItem('userData'));
    expect(stored).not.toBeNull();
    expect(stored.email).toBe('john@email.com');
    expect(stored.loginDate).toBeDefined();
  });

  it('TC-UNIT-FE-004 — apiClient error returns success:false without touching localStorage', async () => {
    apiClient.mockRejectedValue(new Error('Incorrect email or password'));

    const result = await login('john@email.com', 'wrongpassword');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Incorrect email or password');
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('TC-UNIT-FE-005 — network error returns success:false', async () => {
    apiClient.mockRejectedValue(new Error('Network error'));

    const result = await login('nobody@example.com', 'anypassword');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('TC-UNIT-FE-006 — calls apiClient with POST /login and correct body', async () => {
    apiClient.mockResolvedValue({ token: mockToken, refreshToken: mockRefreshToken });

    await login('john@email.com', 'john123');

    expect(apiClient).toHaveBeenCalledWith('/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'john@email.com', password: 'john123' }),
    });
  });

  it('TC-UNIT-FE-007 — stores refreshToken in localStorage', async () => {
    apiClient.mockResolvedValue({ token: mockToken, refreshToken: mockRefreshToken });

    await login('john@email.com', 'john123');

    expect(localStorage.getItem('refreshToken')).toBe(mockRefreshToken);
  });
});

// ── register() ────────────────────────────────────────────────────────────────
describe('register()', () => {
  it('TC-UNIT-FE-REG-001 — calls apiClient with POST /register', async () => {
    apiClient.mockResolvedValue({ _id: 'u1', displayName: 'Jane', email: 'jane@email.com', role: 'customer' });

    await register('Jane', 'jane@email.com', 'pass123');

    expect(apiClient).toHaveBeenCalledWith('/register', {
      method: 'POST',
      body: JSON.stringify({ displayName: 'Jane', email: 'jane@email.com', password: 'pass123' }),
    });
  });

  it('TC-UNIT-FE-REG-002 — returns success:true with user on success', async () => {
    const user = { _id: 'u1', displayName: 'Jane', email: 'jane@email.com', role: 'customer' };
    apiClient.mockResolvedValue(user);

    const result = await register('Jane', 'jane@email.com', 'pass123');

    expect(result.success).toBe(true);
    expect(result.user).toEqual(user);
  });

  it('TC-UNIT-FE-REG-003 — returns success:false on API error', async () => {
    apiClient.mockRejectedValue(new Error('Email already in use'));

    const result = await register('Jane', 'jane@email.com', 'pass123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Email already in use');
  });
});

// ── logout() ──────────────────────────────────────────────────────────────────
describe('logout()', () => {
  it('TC-UNIT-FE-008 — removes authToken from localStorage', async () => {
    apiClient.mockResolvedValue({ token: mockToken, refreshToken: mockRefreshToken });
    await login('john@email.com', 'john123');

    logout();

    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('TC-UNIT-FE-009 — removes userData from localStorage', async () => {
    apiClient.mockResolvedValue({ token: mockToken, refreshToken: mockRefreshToken });
    await login('john@email.com', 'john123');

    logout();

    expect(localStorage.getItem('userData')).toBeNull();
  });

  it('TC-UNIT-FE-010 — removes refreshToken from localStorage', async () => {
    apiClient.mockResolvedValue({ token: mockToken, refreshToken: mockRefreshToken });
    await login('john@email.com', 'john123');

    logout();

    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('TC-UNIT-FE-010b — is safe to call when not logged in (no error)', () => {
    expect(() => logout()).not.toThrow();
  });
});

// ── isAuthenticated() ─────────────────────────────────────────────────────────
describe('isAuthenticated()', () => {
  it('TC-UNIT-FE-011 — returns true when authToken is in localStorage', () => {
    localStorage.setItem('authToken', mockToken);
    expect(isAuthenticated()).toBe(true);
  });

  it('TC-UNIT-FE-012 — returns false when authToken is absent', () => {
    expect(isAuthenticated()).toBe(false);
  });

  it('TC-UNIT-FE-013 — returns false after logout()', async () => {
    apiClient.mockResolvedValue({ token: mockToken, refreshToken: mockRefreshToken });
    await login('john@email.com', 'john123');

    logout();

    expect(isAuthenticated()).toBe(false);
  });
});

// ── getCurrentUser() ──────────────────────────────────────────────────────────
describe('getCurrentUser()', () => {
  it('TC-UNIT-FE-014 — returns null when not logged in', () => {
    expect(getCurrentUser()).toBeNull();
  });

  it('TC-UNIT-FE-015 — returns the logged-in user object with email and loginDate', async () => {
    apiClient.mockResolvedValue({ token: mockToken, refreshToken: mockRefreshToken });
    await login('john@email.com', 'john123');

    const user = getCurrentUser();

    expect(user).not.toBeNull();
    expect(user.email).toBe('john@email.com');
    expect(user.loginDate).toBeDefined();
  });

  it('TC-UNIT-FE-016 — returns null after logout()', async () => {
    apiClient.mockResolvedValue({ token: mockToken, refreshToken: mockRefreshToken });
    await login('john@email.com', 'john123');

    logout();

    expect(getCurrentUser()).toBeNull();
  });
});
