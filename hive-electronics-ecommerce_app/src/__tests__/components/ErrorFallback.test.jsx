/**
 * Unit tests — ErrorFallback + its wiring into react-error-boundary
 *
 * react-error-boundary's own catch mechanics (getDerivedStateFromError,
 * componentDidCatch, resetKeys diffing) are the library's responsibility and
 * are not re-tested here. These tests cover OUR code: the fallback UI,
 * hiding error detail in production, the onError → logger wiring, and that
 * resetKeys actually clears our fallback when used as documented.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from '../../components/common/ErrorFallback/ErrorFallback';

vi.mock('../../services/logger', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import logger from '../../services/logger';

// A child that throws until `shouldThrow.current` is flipped off — lets a
// "Try again" click prove the boundary actually re-renders the subtree.
const makeThrowingChild = (shouldThrowRef) =>
  function ThrowingChild() {
    if (shouldThrowRef.current) {
      throw new Error('boom');
    }
    return <div data-testid="recovered">recovered</div>;
  };

describe('ErrorFallback — component', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('TC-UNIT-FE-EF-001 — renders the fallback heading and description', () => {
    render(<ErrorFallback error={new Error('boom')} resetErrorBoundary={() => {}} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-EF-002 — shows the error detail outside production', () => {
    process.env.NODE_ENV = 'development';

    render(<ErrorFallback error={new Error('boom detail')} resetErrorBoundary={() => {}} />);

    expect(screen.getByText('boom detail')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-EF-003 — hides the error detail in production', () => {
    process.env.NODE_ENV = 'production';

    render(<ErrorFallback error={new Error('boom detail')} resetErrorBoundary={() => {}} />);

    expect(screen.queryByText('boom detail')).not.toBeInTheDocument();
  });

  it('TC-UNIT-FE-EF-004 — "Try again" invokes resetErrorBoundary', () => {
    const resetErrorBoundary = vi.fn();
    render(<ErrorFallback error={new Error('boom')} resetErrorBoundary={resetErrorBoundary} />);

    fireEvent.click(screen.getByText('Try again'));

    expect(resetErrorBoundary).toHaveBeenCalledTimes(1);
  });

  it('TC-UNIT-FE-EF-005 — "Go to main page" navigates to /', () => {
    const assignSpy = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, assign: assignSpy },
      writable: true,
    });

    render(<ErrorFallback error={new Error('boom')} resetErrorBoundary={() => {}} />);
    fireEvent.click(screen.getByText('Go to main page'));

    expect(assignSpy).toHaveBeenCalledWith('/');

    Object.defineProperty(window, 'location', { value: originalLocation, writable: true });
  });
});

describe('ErrorFallback — wired into react-error-boundary', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    // React's default onCaughtError still logs to console.error; keep test
    // output clean without hiding a real assertion failure.
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error.mockClear();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('TC-UNIT-FE-EF-006 — renders children unchanged when nothing throws', () => {
    render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <div data-testid="ok-child">ok</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('ok-child')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('TC-UNIT-FE-EF-007 — a throwing child renders the fallback and calls onError', () => {
    const shouldThrow = { current: true };
    const Thrower = makeThrowingChild(shouldThrow);
    const onError = vi.fn((error, info) =>
      logger.error('Unhandled render error', {
        scope: 'test',
        componentStack: info?.componentStack,
        error,
      })
    );

    render(
      <ErrorBoundary FallbackComponent={ErrorFallback} onError={onError}>
        <Thrower />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(onError).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'Unhandled render error',
      expect.objectContaining({ scope: 'test', error: expect.any(Error) })
    );
  });

  it('TC-UNIT-FE-EF-008 — "Try again" re-renders the subtree once the failure clears', () => {
    const shouldThrow = { current: true };
    const Thrower = makeThrowingChild(shouldThrow);

    render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Thrower />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    shouldThrow.current = false;
    fireEvent.click(screen.getByText('Try again'));

    expect(screen.getByTestId('recovered')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('TC-UNIT-FE-EF-009 — changing resetKeys clears the fallback without a click', () => {
    const shouldThrow = { current: true };
    const Thrower = makeThrowingChild(shouldThrow);

    const { rerender } = render(
      <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={['a']}>
        <Thrower />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    shouldThrow.current = false;
    rerender(
      <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={['b']}>
        <Thrower />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('recovered')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });
});
