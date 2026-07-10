/**
 * Unit tests — orderServices
 *
 * apiClient is mocked — no real network calls are made.
 *
 * Functions under test:
 *   createOrder(payload)  → POST /orders
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createOrder } from '../../services/orderServices';

vi.mock('../../services/apiClient', () => ({
  default: vi.fn(),
}));

import apiClient from '../../services/apiClient';

const mockOrderPayload = {
  user: 'user1',
  products: [{ product: 'prod1', quantity: 2, price: 99.99 }],
  address: 'addr1',
  paymentMethod: 'pm1',
  shippingCost: 350,
};

const mockOrderResponse = {
  _id: 'ord1',
  user: { _id: 'user1', displayName: 'John Doe' },
  products: [{ product: { _id: 'prod1', name: 'Widget' }, quantity: 2, price: 99.99 }],
  address: 'addr1',
  paymentMethod: 'pm1',
  shippingCost: 350,
  taxAmount: 31.9968,
  totalPrice: 581.99,
  status: 'pending',
  paymentStatus: 'pending',
};

beforeEach(() => {
  apiClient.mockReset();
});

// ── createOrder() ─────────────────────────────────────────────────────────────
describe('createOrder()', () => {
  it('TC-UNIT-FE-SVC-ORD-001 — calls POST /orders with the payload', async () => {
    apiClient.mockResolvedValue(mockOrderResponse);

    await createOrder(mockOrderPayload);

    expect(apiClient).toHaveBeenCalledWith('/orders', {
      method: 'POST',
      body: JSON.stringify(mockOrderPayload),
    });
  });

  it('TC-UNIT-FE-SVC-ORD-002 — returns the order object from the API', async () => {
    apiClient.mockResolvedValue(mockOrderResponse);

    const order = await createOrder(mockOrderPayload);

    expect(order._id).toBe('ord1');
    expect(order.status).toBe('pending');
    expect(order.paymentStatus).toBe('pending');
    expect(order.totalPrice).toBe(581.99);
  });

  it('TC-UNIT-FE-SVC-ORD-003 — propagates error when apiClient throws', async () => {
    apiClient.mockRejectedValue(new Error('Validation failed'));

    await expect(createOrder({})).rejects.toThrow('Validation failed');
  });
});
