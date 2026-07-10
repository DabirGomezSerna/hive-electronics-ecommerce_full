/**
 * Unit tests — ProtectedRoute
 *
 * ProtectedRoute guards:
 * 1. Unauthenticated users → <Navigate to="/login" />
 * 2. Authenticated users with no role restriction → renders children
 * 3. Authenticated user whose role is NOT in allowedRoles → "Access denied"
 * 4. Authenticated user whose role IS in allowedRoles → renders children
 *
 * Uses MemoryRouter + Routes/Route so <Navigate> can actually redirect.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../../pages/ProtectedRoute';

// Mock userServices so we control isAuthenticated / getCurrentUser
vi.mock('../../services/userServices', () => ({
  isAuthenticated: vi.fn(),
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

import { isAuthenticated, getCurrentUser } from '../../services/userServices';

const renderWithRouter = (isAuth, user = null, allowedRoles = undefined) => {
  isAuthenticated.mockReturnValue(isAuth);
  getCurrentUser.mockReturnValue(user);

  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute allowedRoles={allowedRoles}>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
};

// ── unauthenticated ───────────────────────────────────────────────────────────
describe('ProtectedRoute — unauthenticated', () => {
  it('TC-UNIT-FE-074 — redirects to /login when not authenticated', () => {
    renderWithRouter(false);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});

// ── authenticated, no role restriction ───────────────────────────────────────
describe('ProtectedRoute — authenticated, no allowedRoles', () => {
  it('TC-UNIT-FE-075 — renders children when authenticated and no role restriction', () => {
    renderWithRouter(true, { role: 'customer' });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});

// ── role-based access ─────────────────────────────────────────────────────────
describe('ProtectedRoute — allowedRoles', () => {
  it('TC-UNIT-FE-076 — renders children when user role is in allowedRoles', () => {
    renderWithRouter(true, { role: 'admin' }, ['admin']);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-077 — shows "Access denied" when user role is NOT in allowedRoles', () => {
    renderWithRouter(true, { role: 'customer' }, ['admin']);
    expect(screen.getByText('Access denied')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('TC-UNIT-FE-078 — customer role accepted in customer-only route', () => {
    renderWithRouter(true, { role: 'customer' }, ['customer']);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
