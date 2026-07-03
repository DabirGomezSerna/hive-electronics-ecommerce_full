import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../../src/models/User.js";
import Category from "../../src/models/Category.js";
import Product from "../../src/models/Product.js";
import ShippingAddress from "../../src/models/ShippingAddress.js";
import PaymentMethod from "../../src/models/PaymentMethod.js";

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------

export const generateToken = (userId, name = "Test", role = "customer") => {
  return jwt.sign({ userId, name, role }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

export const validObjectId = () => new mongoose.Types.ObjectId().toString();

// ---------------------------------------------------------------------------
// User factories
// ---------------------------------------------------------------------------

export const createCustomer = async (overrides = {}) => {
  const hashed = await bcrypt.hash("TestPass123!", 10);
  const user = await User.create({
    displayName: "Test Customer",
    email: `customer-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
    password: hashed,
    role: "customer",
    isActive: true,
    ...overrides,
    ...(overrides.password
      ? { password: await bcrypt.hash(overrides.password, 10) }
      : {}),
  });
  return user;
};

export const createAdmin = async (overrides = {}) => {
  return createCustomer({
    displayName: "Test Admin",
    email: `admin-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
    role: "admin",
    ...overrides,
  });
};

// Returns { user, token } pair ready for Authorization header
export const customerSession = async (overrides = {}) => {
  const user = await createCustomer(overrides);
  const token = generateToken(user._id.toString(), user.displayName, user.role);
  return { user, token };
};

export const adminSession = async (overrides = {}) => {
  const user = await createAdmin(overrides);
  const token = generateToken(user._id.toString(), user.displayName, user.role);
  return { user, token };
};

// ---------------------------------------------------------------------------
// Category factories
// ---------------------------------------------------------------------------

export const createCategory = async (overrides = {}) => {
  return Category.create({
    name: `Category-${Date.now()}`,
    description: "A test category",
    ...overrides,
  });
};

export const createChildCategory = async (parentId, overrides = {}) => {
  return Category.create({
    name: `Child-${Date.now()}`,
    description: "A child category",
    parentCategory: parentId,
    ...overrides,
  });
};

// ---------------------------------------------------------------------------
// Product factories
// ---------------------------------------------------------------------------

export const createProduct = async (categoryId, overrides = {}) => {
  return Product.create({
    name: `Product-${Date.now()}`,
    description: "A test product",
    price: 99.99,
    stock: 10,
    image: ["https://placeholder.com/800x600"],
    category: categoryId,
    ...overrides,
  });
};

// ---------------------------------------------------------------------------
// Address factories
// ---------------------------------------------------------------------------

export const createAddress = async (userId, overrides = {}) => {
  return ShippingAddress.create({
    user: userId,
    name: "Home",
    address1: "123 Test Street",
    postalCode: "12345",
    city: "Test City",
    country: "US",
    defaultAddress: false,
    ...overrides,
  });
};

// ---------------------------------------------------------------------------
// Payment method factories
// ---------------------------------------------------------------------------

export const createPaymentMethod = async (userId, overrides = {}) => {
  return PaymentMethod.create({
    user: userId,
    type: "cash_on_delivery",
    isDefault: false,
    isActive: true,
    ...overrides,
  });
};
