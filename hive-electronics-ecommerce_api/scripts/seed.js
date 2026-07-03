/**
 * Database seed script — Hive Electronics Ecommerce
 *
 * Safe to re-run: uses findOne checks before every insert — no duplicates.
 * Destructive reset is opt-in: SEED_ALLOW_RESET=true
 *
 * Usage:
 *   node scripts/seed.js
 *   SEED_ALLOW_RESET=true node scripts/seed.js   (Linux/macOS)
 *   $env:SEED_ALLOW_RESET="true"; node scripts/seed.js   (PowerShell)
 */

import dotenv from "dotenv";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import connectDB from "../src/config/db.conf.js";
import User from "../src/models/User.js";
import Category from "../src/models/Category.js";
import Product from "../src/models/Product.js";

dotenv.config();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const hashPassword = async (plain) => bcrypt.hash(plain, 10);

const log = {
  created: (label, value) => console.log(`  [+] Created  ${label}: ${value}`),
  skipped: (label, value) => console.log(`  [~] Skipped  ${label}: ${value} (already exists)`),
  section: (title) => console.log(`\n── ${title} ─────────────────────────────`),
  error: (label, err) => console.error(`  [!] Error    ${label}: ${err.message}`),
};

// ---------------------------------------------------------------------------
// Seed data — Users
// ---------------------------------------------------------------------------

const USERS = [
  {
    displayName: "Hive Admin",
    email: "admin@hiveelectronics.com",
    password: "Admin1234!",
    role: "admin",
    avatar:
      "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/512/88.jpg",
    isActive: true,
  },
  {
    displayName: "John Doe",
    email: "john.doe@example.com",
    password: "Customer1234!",
    role: "customer",
    avatar:
      "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/512/22.jpg",
    isActive: true,
  },
  {
    displayName: "Jane Smith",
    email: "jane.smith@example.com",
    password: "Customer1234!",
    role: "customer",
    avatar:
      "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/45.jpg",
    isActive: true,
  },
];

// ---------------------------------------------------------------------------
// Seed data — Categories (parents defined first, children reference them by name)
// ---------------------------------------------------------------------------

const PARENT_CATEGORIES = [
  {
    name: "Electronics",
    description: "All electronic devices and components",
    imageUrl: "https://placeholder.com/800x600",
    parentCategory: null,
  },
];

// Children reference their parent by the name key used above.
// The seed resolves the ObjectId at runtime — no hardcoded IDs.
const CHILD_CATEGORIES = [
  {
    name: "Laptops",
    description: "Portable computers for work and gaming",
    imageUrl: "https://placeholder.com/800x600",
    parentName: "Electronics",
  },
  {
    name: "Smartphones",
    description: "Mobile phones and accessories",
    imageUrl: "https://placeholder.com/800x600",
    parentName: "Electronics",
  },
  {
    name: "Audio",
    description: "Headphones, speakers, and sound systems",
    imageUrl: "https://placeholder.com/800x600",
    parentName: "Electronics",
  },
  {
    name: "Accessories",
    description: "Cables, adapters, mice, keyboards, and peripherals",
    imageUrl: "https://placeholder.com/800x600",
    parentName: "Electronics",
  },
];

// ---------------------------------------------------------------------------
// Seed data — Products (reference category by the name key used above)
// ---------------------------------------------------------------------------

const PRODUCTS = [
  // Laptops
  {
    name: "HP Pavilion 15",
    description:
      "15.6-inch Full HD laptop with AMD Ryzen 5, 8GB RAM, 512GB SSD. Ideal for everyday productivity and light creative work.",
    price: 649.99,
    stock: 15,
    image: ["https://placeholder.com/800x600"],
    categoryName: "Laptops",
  },
  {
    name: "Dell Inspiron 14",
    description:
      "14-inch laptop with Intel Core i5, 16GB RAM, 512GB SSD. Compact and powerful for students and remote workers.",
    price: 749.99,
    stock: 10,
    image: ["https://placeholder.com/800x600"],
    categoryName: "Laptops",
  },
  // Smartphones
  {
    name: "Samsung Galaxy A55",
    description:
      "6.6-inch Super AMOLED display, 50MP triple camera, 5000mAh battery. Premium mid-range Android experience.",
    price: 449.99,
    stock: 25,
    image: ["https://placeholder.com/800x600"],
    categoryName: "Smartphones",
  },
  {
    name: "iPhone 15",
    description:
      "6.1-inch Super Retina XDR display, A16 Bionic chip, 48MP main camera. The latest Apple iPhone standard model.",
    price: 799.99,
    stock: 20,
    image: ["https://placeholder.com/800x600"],
    categoryName: "Smartphones",
  },
  // Audio
  {
    name: "Sony WH-1000XM5",
    description:
      "Industry-leading wireless noise-canceling headphones with 30-hour battery life and multipoint Bluetooth connection.",
    price: 349.99,
    stock: 30,
    image: ["https://placeholder.com/800x600"],
    categoryName: "Audio",
  },
  {
    name: "JBL Charge 5",
    description:
      "Portable waterproof Bluetooth speaker with 20-hour playtime, built-in power bank, and JBL Pro Sound.",
    price: 179.99,
    stock: 40,
    image: ["https://placeholder.com/800x600"],
    categoryName: "Audio",
  },
  // Accessories
  {
    name: "USB-C Hub 7-in-1",
    description:
      "7-port USB-C hub with 4K HDMI, 100W Power Delivery, 3x USB-A, SD/microSD card readers. Compatible with laptops and tablets.",
    price: 49.99,
    stock: 60,
    image: ["https://placeholder.com/800x600"],
    categoryName: "Accessories",
  },
  {
    name: "Logitech MX Master 3S",
    description:
      "Advanced wireless mouse with 8K DPI sensor, MagSpeed electromagnetic scrolling, and silent clicks.",
    price: 99.99,
    stock: 35,
    image: ["https://placeholder.com/800x600"],
    categoryName: "Accessories",
  },
];

// ---------------------------------------------------------------------------
// Seed functions
// ---------------------------------------------------------------------------

async function seedUsers() {
  log.section("Users");
  const results = {};

  for (const userData of USERS) {
    const existing = await User.findOne({ email: userData.email });

    if (existing) {
      log.skipped("user", userData.email);
      results[userData.email] = existing;
      continue;
    }

    const hashed = await hashPassword(userData.password);
    const user = await User.create({
      displayName: userData.displayName,
      email: userData.email,
      password: hashed,
      role: userData.role,
      avatar: userData.avatar,
      isActive: userData.isActive,
    });

    log.created("user", `${userData.email} [${userData.role}]`);
    results[userData.email] = user;
  }

  return results;
}

async function seedCategories() {
  log.section("Categories");
  const categoryMap = {};

  // Insert parent categories first
  for (const catData of PARENT_CATEGORIES) {
    const existing = await Category.findOne({ name: catData.name });

    if (existing) {
      log.skipped("category", catData.name);
      categoryMap[catData.name] = existing;
      continue;
    }

    const category = await Category.create({
      name: catData.name,
      description: catData.description,
      imageUrl: catData.imageUrl,
      parentCategory: null,
    });

    log.created("category", `${catData.name} (parent)`);
    categoryMap[catData.name] = category;
  }

  // Insert child categories, resolving parent ObjectId from the map
  for (const catData of CHILD_CATEGORIES) {
    const existing = await Category.findOne({ name: catData.name });

    if (existing) {
      log.skipped("category", catData.name);
      categoryMap[catData.name] = existing;
      continue;
    }

    const parent = categoryMap[catData.parentName];
    if (!parent) {
      log.error("category", new Error(`Parent category "${catData.parentName}" not found for "${catData.name}"`));
      continue;
    }

    const category = await Category.create({
      name: catData.name,
      description: catData.description,
      imageUrl: catData.imageUrl,
      parentCategory: parent._id,
    });

    log.created("category", `${catData.name} → ${catData.parentName}`);
    categoryMap[catData.name] = category;
  }

  return categoryMap;
}

async function seedProducts(categoryMap) {
  log.section("Products");

  for (const prodData of PRODUCTS) {
    const existing = await Product.findOne({ name: prodData.name });

    if (existing) {
      log.skipped("product", prodData.name);
      continue;
    }

    const category = categoryMap[prodData.categoryName];
    if (!category) {
      log.error("product", new Error(`Category "${prodData.categoryName}" not found for "${prodData.name}"`));
      continue;
    }

    await Product.create({
      name: prodData.name,
      description: prodData.description,
      price: prodData.price,
      stock: prodData.stock,
      image: prodData.image,
      category: category._id,
    });

    log.created("product", `${prodData.name} ($${prodData.price})`);
  }
}

// ---------------------------------------------------------------------------
// Optional destructive reset (SEED_ALLOW_RESET=true)
// ---------------------------------------------------------------------------

async function resetCollections() {
  console.log("\n  [!] SEED_ALLOW_RESET=true — deleting existing data...");

  // Reverse dependency order: Products → Categories → Users
  // Cart, Order, ShippingAddress, PaymentMethod are left untouched
  // (user-generated data should not be wiped by default reset)
  const result = {
    products: await Product.deleteMany({}),
    categories: await Category.deleteMany({}),
    users: await User.deleteMany({}),
  };

  console.log(
    `  [!] Deleted: ${result.products.deletedCount} products, ` +
    `${result.categories.deletedCount} categories, ` +
    `${result.users.deletedCount} users`,
  );
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

async function printSummary() {
  log.section("Summary");

  const [userCount, categoryCount, productCount] = await Promise.all([
    User.countDocuments(),
    Category.countDocuments(),
    Product.countDocuments(),
  ]);

  console.log(`  Users:      ${userCount}`);
  console.log(`  Categories: ${categoryCount}`);
  console.log(`  Products:   ${productCount}`);

  const admin = await User.findOne({ role: "admin" }).select("displayName email role");
  if (admin) {
    console.log(`\n  Admin account:`);
    console.log(`    Email:    ${admin.email}`);
    console.log(`    Password: Admin1234!`);
  }

  console.log("\n  Seed completed successfully.\n");
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function seed() {
  await connectDB();

  if (process.env.SEED_ALLOW_RESET === "true") {
    await resetCollections();
  }

  const _users = await seedUsers();
  const categoryMap = await seedCategories();
  await seedProducts(categoryMap);
  await printSummary();

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("\n[FATAL] Seed failed:", err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});
