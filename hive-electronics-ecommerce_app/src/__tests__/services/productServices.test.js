/**
 * Unit tests — productServices
 *
 * Services now call apiClient which makes real fetch() calls to the backend.
 * apiClient is mocked at the module level so no real network calls are made.
 *
 * Functions under test:
 *   fetchProducts()          → GET /products
 *   searchProducts(query)    → fetchProducts() + client-side filter
 *   getProductsByCategory()  → fetchProducts() + client-side filter
 *   getProductById(id)       → GET /products/:id
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchProducts,
  searchProducts,
  getProductsByCategory,
  getProductById,
} from '../../services/productServices';

vi.mock('../../services/apiClient', () => ({
  default: vi.fn(),
}));

import apiClient from '../../services/apiClient';

const mockProducts = [
  { _id: 'p1', name: 'RGB Keyboard', description: 'Mechanical keyboard with RGB lighting', price: 29.99, stock: 30, category: { _id: 'cat1', name: 'Peripherals' } },
  { _id: 'p2', name: 'Gaming Mouse', description: 'High DPI wireless mouse', price: 49.99, stock: 15, category: { _id: 'cat1', name: 'Peripherals' } },
  { _id: 'p3', name: 'USB-C Hub', description: 'Multi-port USB hub', price: 19.99, stock: 0, category: { _id: 'cat2', name: 'Accessories' } },
];

beforeEach(() => {
  apiClient.mockReset();
});

// ── fetchProducts() ───────────────────────────────────────────────────────────
describe('fetchProducts()', () => {
  it('TC-UNIT-FE-017 — calls GET /products and resolves to an array', async () => {
    apiClient.mockResolvedValue(mockProducts);

    const products = await fetchProducts();

    expect(apiClient).toHaveBeenCalledWith('/products');
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBe(3);
  });

  it('TC-UNIT-FE-018 — each product has required fields (_id, name, price, stock)', async () => {
    apiClient.mockResolvedValue(mockProducts);

    const products = await fetchProducts();

    products.forEach((p) => {
      expect(p._id).toBeDefined();
      expect(p.name).toBeDefined();
      expect(typeof p.price).toBe('number');
      expect(typeof p.stock).toBe('number');
    });
  });
});

// ── searchProducts() ──────────────────────────────────────────────────────────
describe('searchProducts()', () => {
  it('TC-UNIT-FE-019 — returns products matching query by name', async () => {
    apiClient.mockResolvedValue(mockProducts);

    const results = await searchProducts('keyboard');

    expect(results.length).toBeGreaterThan(0);
    results.forEach((p) => {
      const matches =
        p.name.toLowerCase().includes('keyboard') ||
        (p.description && p.description.toLowerCase().includes('keyboard'));
      expect(matches).toBe(true);
    });
  });

  it('TC-UNIT-FE-020 — returns products matching query in description', async () => {
    apiClient.mockResolvedValue(mockProducts);

    const results = await searchProducts('rgb');

    expect(results.length).toBeGreaterThan(0);
  });

  it('TC-UNIT-FE-021 — returns empty array for query with no matches', async () => {
    apiClient.mockResolvedValue(mockProducts);

    const results = await searchProducts('zzznomatch_xyzzy_quantum');

    expect(results).toEqual([]);
  });

  it('TC-UNIT-FE-022 — search is case-insensitive', async () => {
    apiClient.mockResolvedValue(mockProducts);
    const lRes = await searchProducts('keyboard');

    apiClient.mockResolvedValue(mockProducts);
    const uRes = await searchProducts('KEYBOARD');

    expect(lRes.length).toBe(uRes.length);
  });
});

// ── getProductsByCategory() ───────────────────────────────────────────────────
describe('getProductsByCategory()', () => {
  it('TC-UNIT-FE-023 — returns only products from the given category', async () => {
    apiClient.mockResolvedValue(mockProducts);

    const results = await getProductsByCategory('cat1');

    expect(results.length).toBe(2);
    results.forEach((p) => {
      expect(p.category._id).toBe('cat1');
    });
  });

  it('TC-UNIT-FE-024 — returns empty array for unknown category ID', async () => {
    apiClient.mockResolvedValue(mockProducts);

    const results = await getProductsByCategory('nonexistent-category-id');

    expect(results).toEqual([]);
  });
});

// ── getProductById() ──────────────────────────────────────────────────────────
describe('getProductById()', () => {
  it('TC-UNIT-FE-025 — calls GET /products/:id and returns the product', async () => {
    apiClient.mockResolvedValue(mockProducts[0]);

    const found = await getProductById('p1');

    expect(apiClient).toHaveBeenCalledWith('/products/p1');
    expect(found._id).toBe('p1');
    expect(found.name).toBe('RGB Keyboard');
  });

  it('TC-UNIT-FE-026 — propagates error when apiClient throws', async () => {
    apiClient.mockRejectedValue(new Error('Not found'));

    await expect(getProductById('nonexistent')).rejects.toThrow('Not found');
  });
});
