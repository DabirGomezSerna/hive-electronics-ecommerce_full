/**
 * Unit tests — categoryServices
 *
 * apiClient is mocked — no real network calls are made.
 *
 * Functions under test:
 *   fetchCategories()                    → GET /categories
 *   getCategoryById(id)                  → GET /categories/:id
 *   getParentCategories()                → fetchCategories() + filter parentCategory === null
 *   getChildCategories(parentId)         → fetchCategories() + filter by parentCategory._id
 *   getProductsByCategoryAndChildren()   → fetchProducts() + fetchCategories() + filter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchCategories,
  getCategoryById,
  getParentCategories,
  getChildCategories,
  getProductsByCategoryAndChildren,
} from '../../services/categoryServices';

vi.mock('../../services/apiClient', () => ({
  default: vi.fn(),
}));

import apiClient from '../../services/apiClient';

const mockCategories = [
  { _id: 'cat1', name: 'Electronics', description: 'All electronics', parentCategory: null },
  { _id: 'cat2', name: 'Peripherals', description: 'Mice and keyboards', parentCategory: { _id: 'cat1' } },
  { _id: 'cat3', name: 'Audio', description: 'Headphones and speakers', parentCategory: { _id: 'cat1' } },
];

const mockProducts = [
  { _id: 'p1', name: 'Widget', price: 9.99, category: { _id: 'cat2' } },
  { _id: 'p2', name: 'Gadget', price: 19.99, category: { _id: 'cat3' } },
  { _id: 'p3', name: 'Doohickey', price: 4.99, category: { _id: 'cat1' } },
];

beforeEach(() => {
  apiClient.mockReset();
});

// ── fetchCategories() ─────────────────────────────────────────────────────────
describe('fetchCategories()', () => {
  it('TC-UNIT-FE-SVC-CAT-001 — calls GET /categories and returns array', async () => {
    apiClient.mockResolvedValue(mockCategories);

    const categories = await fetchCategories();

    expect(apiClient).toHaveBeenCalledWith('/categories');
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBe(3);
  });
});

// ── getCategoryById() ─────────────────────────────────────────────────────────
describe('getCategoryById()', () => {
  it('TC-UNIT-FE-SVC-CAT-002 — calls GET /categories/:id and returns the category', async () => {
    apiClient.mockResolvedValue(mockCategories[0]);

    const cat = await getCategoryById('cat1');

    expect(apiClient).toHaveBeenCalledWith('/categories/cat1');
    expect(cat._id).toBe('cat1');
    expect(cat.name).toBe('Electronics');
  });
});

// ── getParentCategories() ─────────────────────────────────────────────────────
describe('getParentCategories()', () => {
  it('TC-UNIT-FE-SVC-CAT-003 — returns only categories with null parentCategory', async () => {
    apiClient.mockResolvedValue(mockCategories);

    const parents = await getParentCategories();

    expect(parents.length).toBe(1);
    expect(parents[0]._id).toBe('cat1');
  });
});

// ── getChildCategories() ──────────────────────────────────────────────────────
describe('getChildCategories()', () => {
  it('TC-UNIT-FE-SVC-CAT-004 — returns categories whose parentCategory._id matches', async () => {
    apiClient.mockResolvedValue(mockCategories);

    const children = await getChildCategories('cat1');

    expect(children.length).toBe(2);
    children.forEach((c) => expect(c.parentCategory._id).toBe('cat1'));
  });

  it('TC-UNIT-FE-SVC-CAT-005 — returns empty array when no children exist', async () => {
    apiClient.mockResolvedValue(mockCategories);

    const children = await getChildCategories('cat3');

    expect(children).toEqual([]);
  });
});

// ── getProductsByCategoryAndChildren() ───────────────────────────────────────
describe('getProductsByCategoryAndChildren()', () => {
  it('TC-UNIT-FE-SVC-CAT-006 — parent category includes products from itself and child categories', async () => {
    // fetchProducts and fetchCategories are both called — apiClient is called twice
    apiClient
      .mockResolvedValueOnce(mockProducts) // fetchProducts()
      .mockResolvedValueOnce(mockCategories); // fetchCategories()

    const results = await getProductsByCategoryAndChildren('cat1');

    // cat1 (parent): products in cat1, cat2, cat3 all included
    expect(results.length).toBe(3);
  });

  it('TC-UNIT-FE-SVC-CAT-007 — child category returns only its own products', async () => {
    apiClient
      .mockResolvedValueOnce(mockProducts)
      .mockResolvedValueOnce(mockCategories);

    const results = await getProductsByCategoryAndChildren('cat2');

    expect(results.length).toBe(1);
    expect(results[0]._id).toBe('p1');
  });

  it('TC-UNIT-FE-SVC-CAT-008 — returns empty array for unknown category', async () => {
    apiClient
      .mockResolvedValueOnce(mockProducts)
      .mockResolvedValueOnce(mockCategories);

    const results = await getProductsByCategoryAndChildren('catXXX');

    expect(results).toEqual([]);
  });
});
