/**
 * Unit tests — Login page
 *
 * Login is a pure delegation wrapper: it renders only the LoginForm component
 * with no props, no state, and no direct service calls of its own.
 *
 * Mocks:
 *   - LoginForm: replaced with a lightweight stub that renders a detectable
 *     element. This prevents LoginForm's real dependencies (userServices,
 *     useNavigate, Input, Button, ErrorMessage) from being exercised here —
 *     those are covered in their own dedicated test files.
 *
 * MemoryRouter is included because LoginForm (even when mocked) exists in the
 * same module graph where react-router-dom may be resolved.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../pages/Login/Login';

vi.mock('../../components/LoginForm/LoginForm', () => ({
  default: () => <div data-testid="login-form" />,
}));

describe('Login page — rendering', () => {
  it('TC-UNIT-FE-LOGIN-PAGE-001: renders the LoginForm component', () => {
    // Arrange
    // Act
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
  });
});
