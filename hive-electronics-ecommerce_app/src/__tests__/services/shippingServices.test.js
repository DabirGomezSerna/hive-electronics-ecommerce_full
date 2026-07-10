/**
 * Unit tests — shippingServices
 *
 * apiClient is mocked — no real network calls are made.
 * userServices.getCurrentUser is mocked to return a predictable user.
 *
 * Functions under test:
 *   getShippingAddresses(userId)          → GET /addresses/user/:id
 *   createShippingAddress(formData)       → POST /addresses (user from getCurrentUser())
 *   updateShippingAddress(id, formData)   → PUT /addresses/:id
 *   deleteShippingAddress(id)             → DELETE /addresses/:id
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getShippingAddresses,
  createShippingAddress,
  updateShippingAddress,
  deleteShippingAddress,
} from '../../services/shippingServices';

vi.mock('../../services/apiClient', () => ({
  default: vi.fn(),
}));

vi.mock('../../services/userServices', () => ({
  getCurrentUser: vi.fn(() => ({ userId: 'user1', email: 'john@email.com', role: 'customer' })),
  isAuthenticated: vi.fn(() => true),
}));

import apiClient from '../../services/apiClient';

const mockAddresses = [
  {
    _id: 'addr1',
    user: 'user1',
    address1: '123 Main St',
    city: 'Mexico City',
    postalCode: '06600',
    country: 'MX',
    defaultAddress: true,
  },
  {
    _id: 'addr2',
    user: 'user1',
    address1: '456 Side Ave',
    city: 'Guadalajara',
    postalCode: '44100',
    country: 'MX',
    defaultAddress: false,
  },
];

beforeEach(() => {
  apiClient.mockReset();
});

// ── getShippingAddresses() ────────────────────────────────────────────────────
describe('getShippingAddresses()', () => {
  it('TC-UNIT-FE-SVC-ADDR-001 — calls GET /addresses/user/:id', async () => {
    apiClient.mockResolvedValue(mockAddresses);

    const result = await getShippingAddresses('user1');

    expect(apiClient).toHaveBeenCalledWith('/addresses/user/user1');
    expect(result).toEqual(mockAddresses);
  });

  it('TC-UNIT-FE-SVC-ADDR-001b — returns array of addresses', async () => {
    apiClient.mockResolvedValue(mockAddresses);

    const result = await getShippingAddresses('user1');

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
  });
});

// ── createShippingAddress() ───────────────────────────────────────────────────
describe('createShippingAddress()', () => {
  const formData = {
    name: 'Home',
    address1: '789 New St',
    address2: 'Apt 3',
    postalCode: '10001',
    city: 'CDMX',
    country: 'MX',
    reference: 'Green door',
    default: true,
  };

  it('TC-UNIT-FE-SVC-ADDR-002 — calls POST /addresses with user from getCurrentUser()', async () => {
    apiClient.mockResolvedValue({ _id: 'addr3', ...formData, user: 'user1' });

    await createShippingAddress(formData);

    expect(apiClient).toHaveBeenCalledWith('/addresses', {
      method: 'POST',
      body: JSON.stringify({
        user: 'user1',
        name: formData.name,
        address1: formData.address1,
        address2: formData.address2,
        postalCode: formData.postalCode,
        city: formData.city,
        country: formData.country,
        reference: formData.reference,
        defaultAddress: formData.default,
      }),
    });
  });

  it('TC-UNIT-FE-SVC-ADDR-002b — returns the created address', async () => {
    const created = { _id: 'addr3', ...formData, user: 'user1' };
    apiClient.mockResolvedValue(created);

    const result = await createShippingAddress(formData);

    expect(result._id).toBe('addr3');
  });
});

// ── updateShippingAddress() ───────────────────────────────────────────────────
describe('updateShippingAddress()', () => {
  it('TC-UNIT-FE-SVC-ADDR-003 — calls PUT /addresses/:id with updated fields', async () => {
    const updated = { ...mockAddresses[0], city: 'Monterrey' };
    apiClient.mockResolvedValue(updated);

    await updateShippingAddress('addr1', { city: 'Monterrey' });

    expect(apiClient).toHaveBeenCalledWith('/addresses/addr1', expect.objectContaining({
      method: 'PUT',
    }));
  });

  it('TC-UNIT-FE-SVC-ADDR-003b — returns the updated address', async () => {
    const updated = { ...mockAddresses[0], city: 'Monterrey' };
    apiClient.mockResolvedValue(updated);

    const result = await updateShippingAddress('addr1', { city: 'Monterrey' });

    expect(result.city).toBe('Monterrey');
  });
});

// ── deleteShippingAddress() ───────────────────────────────────────────────────
describe('deleteShippingAddress()', () => {
  it('TC-UNIT-FE-SVC-ADDR-004 — calls DELETE /addresses/:id', async () => {
    apiClient.mockResolvedValue(null); // 204 → null

    await deleteShippingAddress('addr1');

    expect(apiClient).toHaveBeenCalledWith('/addresses/addr1', { method: 'DELETE' });
  });

  it('TC-UNIT-FE-SVC-ADDR-004b — propagates error when apiClient throws', async () => {
    apiClient.mockRejectedValue(new Error('Not found'));

    await expect(deleteShippingAddress('nonexistent')).rejects.toThrow('Not found');
  });
});
