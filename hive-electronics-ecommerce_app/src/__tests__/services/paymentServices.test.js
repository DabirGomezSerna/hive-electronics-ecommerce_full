/**
 * Unit tests — paymentServices
 *
 * apiClient is mocked — no real network calls are made.
 * userServices.getCurrentUser is mocked to return a predictable user.
 *
 * Functions under test:
 *   getPaymentMethods(userId)            → GET /payment-methods/user/:id
 *   createPaymentMethod(formData)        → POST /payment-methods (user from getCurrentUser())
 *   updatePaymentMethod(id, formData)    → PUT /payment-methods/:id
 *   deletePaymentMethod(id)              → DELETE /payment-methods/:id
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from '../../services/paymentServices';

vi.mock('../../services/apiClient', () => ({
  default: vi.fn(),
}));

vi.mock('../../services/userServices', () => ({
  getCurrentUser: vi.fn(() => ({ userId: 'user1', email: 'john@email.com', role: 'customer' })),
  isAuthenticated: vi.fn(() => true),
}));

import apiClient from '../../services/apiClient';

const mockMethods = [
  { _id: 'pm1', user: 'user1', type: 'cash_on_delivery', isDefault: true, isActive: true },
  { _id: 'pm2', user: 'user1', type: 'credit_card', cardNumber: '4111111111111111', isDefault: false, isActive: true },
];

beforeEach(() => {
  apiClient.mockReset();
});

// ── getPaymentMethods() ───────────────────────────────────────────────────────
describe('getPaymentMethods()', () => {
  it('TC-UNIT-FE-SVC-PAY-001 — calls GET /payment-methods/user/:id', async () => {
    apiClient.mockResolvedValue(mockMethods);

    const result = await getPaymentMethods('user1');

    expect(apiClient).toHaveBeenCalledWith('/payment-methods/user/user1');
    expect(result).toEqual(mockMethods);
  });

  it('TC-UNIT-FE-SVC-PAY-001b — returns array of payment methods', async () => {
    apiClient.mockResolvedValue(mockMethods);

    const result = await getPaymentMethods('user1');

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
  });
});

// ── createPaymentMethod() ─────────────────────────────────────────────────────
describe('createPaymentMethod()', () => {
  const formData = {
    type: 'credit_card',
    cardNumber: '4111111111111111',
    cardHolderName: 'John Doe',
    expiryDate: '12/27',
    cvv: '123',
    isDefault: false,
  };

  it('TC-UNIT-FE-SVC-PAY-002 — calls POST /payment-methods with user from getCurrentUser()', async () => {
    apiClient.mockResolvedValue({ _id: 'pm3', ...formData, user: 'user1' });

    await createPaymentMethod(formData);

    expect(apiClient).toHaveBeenCalledWith('/payment-methods', {
      method: 'POST',
      body: JSON.stringify({
        user: 'user1',
        type: formData.type,
        cardNumber: formData.cardNumber,
        cardHolderName: formData.cardHolderName,
        expiryDate: formData.expiryDate,
        cvv: formData.cvv,
        paypalEmail: undefined,
        bankName: undefined,
        accountNumber: undefined,
        isDefault: false,
      }),
    });
  });

  it('TC-UNIT-FE-SVC-PAY-002b — returns the created payment method', async () => {
    const created = { _id: 'pm3', ...formData, user: 'user1' };
    apiClient.mockResolvedValue(created);

    const result = await createPaymentMethod(formData);

    expect(result._id).toBe('pm3');
    expect(result.type).toBe('credit_card');
  });

  it('TC-UNIT-FE-SVC-PAY-002c — defaults isDefault to false when not provided', async () => {
    apiClient.mockResolvedValue({ _id: 'pm3', type: 'paypal', user: 'user1', isDefault: false });

    await createPaymentMethod({ type: 'paypal' });

    const callBody = JSON.parse(apiClient.mock.calls[0][1].body);
    expect(callBody.isDefault).toBe(false);
  });
});

// ── updatePaymentMethod() ─────────────────────────────────────────────────────
describe('updatePaymentMethod()', () => {
  it('TC-UNIT-FE-SVC-PAY-003 — calls PUT /payment-methods/:id', async () => {
    const updated = { ...mockMethods[1], cardHolderName: 'Jane Doe' };
    apiClient.mockResolvedValue(updated);

    await updatePaymentMethod('pm2', { cardHolderName: 'Jane Doe' });

    expect(apiClient).toHaveBeenCalledWith('/payment-methods/pm2', expect.objectContaining({
      method: 'PUT',
    }));
  });

  it('TC-UNIT-FE-SVC-PAY-003b — returns the updated payment method', async () => {
    const updated = { ...mockMethods[1], cardHolderName: 'Jane Doe' };
    apiClient.mockResolvedValue(updated);

    const result = await updatePaymentMethod('pm2', { cardHolderName: 'Jane Doe' });

    expect(result.cardHolderName).toBe('Jane Doe');
  });
});

// ── deletePaymentMethod() ─────────────────────────────────────────────────────
describe('deletePaymentMethod()', () => {
  it('TC-UNIT-FE-SVC-PAY-004 — calls DELETE /payment-methods/:id', async () => {
    apiClient.mockResolvedValue(null); // 204 → null

    await deletePaymentMethod('pm1');

    expect(apiClient).toHaveBeenCalledWith('/payment-methods/pm1', { method: 'DELETE' });
  });

  it('TC-UNIT-FE-SVC-PAY-004b — propagates error when apiClient throws', async () => {
    apiClient.mockRejectedValue(new Error('Payment method not found'));

    await expect(deletePaymentMethod('nonexistent')).rejects.toThrow('Payment method not found');
  });
});
