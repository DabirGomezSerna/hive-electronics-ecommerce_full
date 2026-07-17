/**
 * Unit tests — apiClient
 *
 * apiClient is the ONLY service file tested with a real fetch mock.
 * All other service tests mock apiClient itself.
 *
 * global.fetch is stubbed via vi.stubGlobal so no real network is used.
 *
 * Behavior under test:
 *   - Attaches Content-Type and Authorization headers
 *   - Returns parsed JSON on 2xx response
 *   - Returns null on 204 No Content
 *   - Clears localStorage and redirects on 401
 *   - Throws an error on non-ok response
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import apiClient, { clearApiCache } from '../../services/apiClient';

const BASE_URL = process.env.REACT_APP_API_URL;

const makeResponse = (status, body, ok = true) => ({
  status,
  ok,
  json: vi.fn().mockResolvedValue(body),
});

let fetchMock;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  localStorage.clear();
  clearApiCache();
  // Stub window.location.href setter (jsdom allows assignment but doesn't navigate)
  Object.defineProperty(window, 'location', {
    value: { ...window.location, href: '' },
    writable: true,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ── Authorization header ───────────────────────────────────────────────────────
describe('Authorization header', () => {
  it('TC-UNIT-FE-API-001 — attaches Bearer token when authToken is in localStorage', async () => {
    localStorage.setItem('authToken', 'my-jwt-token');
    fetchMock.mockResolvedValue(makeResponse(200, { ok: true }));

    await apiClient('/products');

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers['Authorization']).toBe('Bearer my-jwt-token');
  });

  it('TC-UNIT-FE-API-002 — does NOT attach Authorization header when no token', async () => {
    fetchMock.mockResolvedValue(makeResponse(200, []));

    await apiClient('/products');

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers['Authorization']).toBeUndefined();
  });

  it('TC-UNIT-FE-API-001b — always attaches Content-Type: application/json', async () => {
    fetchMock.mockResolvedValue(makeResponse(200, []));

    await apiClient('/products');

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers['Content-Type']).toBe('application/json');
  });
});

// ── URL construction ──────────────────────────────────────────────────────────
describe('URL construction', () => {
  it('TC-UNIT-FE-API-007 — prepends BASE_URL to the path', async () => {
    fetchMock.mockResolvedValue(makeResponse(200, []));

    await apiClient('/products');

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/products`);
  });
});

// ── Successful responses ──────────────────────────────────────────────────────
describe('Successful responses', () => {
  it('TC-UNIT-FE-API-003 — returns parsed JSON on 200 response', async () => {
    const data = [{ _id: 'p1', name: 'Widget' }];
    fetchMock.mockResolvedValue(makeResponse(200, data));

    const result = await apiClient('/products');

    expect(result).toEqual(data);
  });

  it('TC-UNIT-FE-API-004 — returns null on 204 No Content', async () => {
    fetchMock.mockResolvedValue(makeResponse(204, null));

    const result = await apiClient('/addresses/addr1', { method: 'DELETE' });

    expect(result).toBeNull();
  });
});

// ── Error responses ───────────────────────────────────────────────────────────
describe('Error responses', () => {
  it('TC-UNIT-FE-API-005 — clears localStorage and redirects on 401', async () => {
    localStorage.setItem('authToken', 'expired-token');
    localStorage.setItem('userData', '{"email":"test@example.com"}');
    fetchMock.mockResolvedValue(makeResponse(401, { message: 'Unauthorized' }, false));

    await apiClient('/orders');

    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('userData')).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  it('TC-UNIT-FE-API-006 — throws error with message from API body on non-ok response', async () => {
    fetchMock.mockResolvedValue(makeResponse(404, { message: 'Product not found' }, false));

    await expect(apiClient('/products/nonexistent')).rejects.toThrow('Product not found');
  });

  it('TC-UNIT-FE-API-006b — throws fallback "Request failed" when body has no message', async () => {
    fetchMock.mockResolvedValue(makeResponse(500, {}, false));

    await expect(apiClient('/products')).rejects.toThrow('Request failed');
  });
});

// ── GET cache ──────────────────────────────────────────────────────────────────
describe('GET cache', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('TC-UNIT-FE-API-008 — second GET to the same path returns cached data without calling fetch again', async () => {
    const data = [{ _id: 'p1', name: 'Widget' }];
    fetchMock.mockResolvedValue(makeResponse(200, data));

    const first = await apiClient('/products');
    const second = await apiClient('/products');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  it('TC-UNIT-FE-API-009 — GET to a different path is not served from another path\'s cache', async () => {
    fetchMock.mockResolvedValue(makeResponse(200, []));

    await apiClient('/products');
    await apiClient('/categories');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('TC-UNIT-FE-API-010 — non-GET requests are never cached', async () => {
    fetchMock.mockResolvedValue(makeResponse(200, { ok: true }));

    await apiClient('/carts/addToCart', { method: 'POST', body: '{}' });
    await apiClient('/carts/addToCart', { method: 'POST', body: '{}' });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('TC-UNIT-FE-API-011 — a cached GET entry expires after the TTL and triggers a fresh fetch', async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue(makeResponse(200, []));

    await apiClient('/products');
    vi.advanceTimersByTime(60_001);
    await apiClient('/products');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('TC-UNIT-FE-API-012 — clearApiCache() forces a fresh fetch on the next GET', async () => {
    fetchMock.mockResolvedValue(makeResponse(200, []));

    await apiClient('/products');
    clearApiCache();
    await apiClient('/products');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
