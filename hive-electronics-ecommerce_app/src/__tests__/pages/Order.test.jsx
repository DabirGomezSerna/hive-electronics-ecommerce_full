/**
 * Unit tests — Order (confirmation) page
 *
 * Order.jsx reads location.state.order to display confirmation details.
 * If location.state has no order, it redirects to '/'.
 *
 * No service calls are made — data arrives via router state.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Order from '../../pages/Order/Order';

const mockOrder = {
  _id: 'ord123',
  createdAt: '2026-07-08T10:00:00.000Z',
  status: 'pending',
  products: [
    { _id: 'p1', name: 'RGB Keyboard', price: 99.99, quantity: 2, subtotal: 199.98 },
  ],
  subtotal: 199.98,
  tax: 32.00,
  shipping: 350,
  total: 581.98,
  shippingAddress: {
    name: 'Home',
    address1: '123 Main St',
    city: 'CDMX',
    postalCode: '06600',
    country: 'MX',
  },
  paymentMethod: {
    type: 'cash_on_delivery',
  },
};

const renderWithState = (state) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/order-confirmation', state }]}>
      <Routes>
        <Route path="/order-confirmation" element={<Order />} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  );

// ── rendering with valid order ─────────────────────────────────────────────────
describe('Order — rendering with valid order', () => {
  it('TC-UNIT-FE-ORDER-001 — renders the order confirmation container', () => {
    renderWithState({ order: mockOrder });

    expect(screen.getByTestId('order-confirmation')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-ORDER-002 — displays the order ID', () => {
    renderWithState({ order: mockOrder });

    expect(screen.getByText(/#ord123/)).toBeInTheDocument();
  });

  it('TC-UNIT-FE-ORDER-003 — displays the product name', () => {
    renderWithState({ order: mockOrder });

    expect(screen.getByText(/RGB Keyboard/i)).toBeInTheDocument();
  });

  it('TC-UNIT-FE-ORDER-003b — displays formatted totals (shipping address)', () => {
    renderWithState({ order: mockOrder });

    expect(screen.getByText(/123 Main St/i)).toBeInTheDocument();
    expect(screen.getByText(/CDMX/i)).toBeInTheDocument();
  });

  it('TC-UNIT-FE-ORDER-004 — displays the payment method label', () => {
    renderWithState({ order: mockOrder });

    expect(screen.getByText(/cash on delivery/i)).toBeInTheDocument();
  });
});

// ── redirect when no order ─────────────────────────────────────────────────────
describe('Order — no order in state', () => {
  it('TC-UNIT-FE-ORDER-002 — redirects to / when location.state has no order', () => {
    renderWithState(null);

    // Should render the home page route instead of the order confirmation
    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByTestId('order-confirmation')).not.toBeInTheDocument();
  });

  it('TC-UNIT-FE-ORDER-002b — redirects to / when state.order is undefined', () => {
    renderWithState({ order: undefined });

    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });
});
