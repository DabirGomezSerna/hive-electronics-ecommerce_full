# Testing Strategies - Quality Assurance

**Scope:** workflow
**Trigger:** when writing tests, planning a testing strategy, configuring coverage, or implementing TDD/BDD
**Tools:** view, file_create, str_replace, bash_tool
**Version:** 1.0.0

---

## Purpose

This skill guides building robust testing strategies. It covers the testing pyramid, TDD, BDD, test doubles, coverage goals, and CI/CD integration across multiple stacks (JavaScript/Jest, Python/pytest, Java/JUnit, Cypress/Playwright).

## When to Use This Skill

- Defining a project's testing strategy
- Writing unit, integration, or e2e tests
- Implementing Test-Driven Development (TDD)
- Implementing Behavior-Driven Development (BDD)
- Configuring code coverage thresholds
- Setting up a CI/CD testing pipeline
- Reviewing or refactoring an existing test suite

## Context and Knowledge

### Testing Pyramid (Classic)

```
        /\
       /E2E\          Few - Slow - Expensive
      /------\
     /  Integ. \      Some - Medium speed
    /------------\
   /     Unit      \  Many - Fast - Cheap
  /------------------\
```

### Testing Trophy (Modern, Kent C. Dodds)

```
        /\
       /E2E\         Few
      /------\
     / Integ.  \     Most (highest ROI)
    /------------\
   /     Unit      \ Some
  /------------------\
 /      Static         \  Linting, type checking
/------------------------\
```

### Recommended Distribution

| Project Type | Unit | Integration | E2E |
|---------------|------|--------------|-----|
| API/Backend | 60% | 30% | 10% |
| Frontend SPA | 40% | 40% | 20% |
| Microservices | 50% | 35% | 15% |

## Test Types

### 1. Unit Tests

**Characteristics:**
- Test a single function/method/component in isolation
- No external dependencies (DB, API, filesystem)
- Very fast (milliseconds)
- Use mocks/stubs for dependencies

**Example - Jest (JavaScript):**
```javascript
// userService.test.js
const { calculateDiscount } = require('./userService');

describe('calculateDiscount', () => {
  it('should apply 10% discount for premium users', () => {
    const result = calculateDiscount(100, 'premium');
    expect(result).toBe(90);
  });

  it('should not apply discount for regular users', () => {
    const result = calculateDiscount(100, 'regular');
    expect(result).toBe(100);
  });

  it('should throw error for negative amounts', () => {
    expect(() => calculateDiscount(-10, 'premium')).toThrow('Invalid amount');
  });
});
```

**Example - pytest (Python):**
```python
# test_calculator.py
import pytest
from calculator import divide

def test_divide_normal():
    assert divide(10, 2) == 5

def test_divide_by_zero():
    with pytest.raises(ZeroDivisionError):
        divide(10, 0)

@pytest.mark.parametrize("a,b,expected", [
    (10, 2, 5),
    (9, 3, 3),
    (100, 10, 10),
])
def test_divide_multiple(a, b, expected):
    assert divide(a, b) == expected
```

**Example - JUnit (Java):**
```java
@Test
void shouldCalculateTotalCorrectly() {
    Order order = new Order();
    order.addItem(new Item("Product", 10.0, 2));

    double total = order.calculateTotal();

    assertEquals(20.0, total, 0.01);
}

@Test
void shouldThrowExceptionForEmptyOrder() {
    Order order = new Order();

    assertThrows(EmptyOrderException.class, () -> {
        order.calculateTotal();
    });
}
```

### 2. Integration Tests

**Characteristics:**
- Test interaction between multiple components
- May use a real database (test DB)
- Verify modules work together correctly

**Example - Supertest (Node.js API):**
```javascript
const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');

describe('POST /api/users', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_DB_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should create a new user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('_id');
    expect(response.body.data.email).toBe('john@example.com');
  });

  it('should return 400 for invalid email', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'John', email: 'invalid', password: '123456' });

    expect(response.status).toBe(400);
  });
});
```

### 3. End-to-End (E2E) Tests

**Example - Cypress:**
```javascript
describe('User Login Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should log in successfully with valid credentials', () => {
    cy.get('[data-testid=email-input]').type('user@example.com');
    cy.get('[data-testid=password-input]').type('password123');
    cy.get('[data-testid=login-button]').click();

    cy.url().should('include', '/dashboard');
    cy.get('[data-testid=welcome-message]').should('contain', 'Welcome');
  });

  it('should show error for invalid credentials', () => {
    cy.get('[data-testid=email-input]').type('user@example.com');
    cy.get('[data-testid=password-input]').type('wrongpassword');
    cy.get('[data-testid=login-button]').click();

    cy.get('[data-testid=error-message]').should('be.visible');
  });
});
```

**Example - Playwright:**
```javascript
import { test, expect } from '@playwright/test';

test('user can complete checkout flow', async ({ page }) => {
  await page.goto('/products');
  await page.click('[data-testid=add-to-cart]');
  await page.click('[data-testid=cart-icon]');
  await page.click('[data-testid=checkout-button]');

  await page.fill('[data-testid=card-number]', '4242424242424242');
  await page.click('[data-testid=submit-payment]');

  await expect(page.locator('[data-testid=success-message]')).toBeVisible();
});
```

### 4. Component Tests

**Example - React Testing Library:**
```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import LoginForm from './LoginForm';

describe('LoginForm', () => {
  it('renders email and password inputs', () => {
    render(<LoginForm onSubmit={jest.fn()} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('calls onSubmit with form data', () => {
    const handleSubmit = jest.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('shows validation error for empty fields', () => {
    render(<LoginForm onSubmit={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });
});
```

## Test-Driven Development (TDD)

### Red-Green-Refactor Cycle

```
1. RED: Write a test that fails
2. GREEN: Write the minimum code to pass
3. REFACTOR: Improve the code keeping the test green
```

**Full Example:**

```javascript
// Step 1: RED - Write the failing test
describe('UserService', () => {
  it('should create a user with hashed password', async () => {
    const userService = new UserService();
    const user = await userService.createUser({
      email: 'test@example.com',
      password: 'plaintext123',
    });

    expect(user.password).not.toBe('plaintext123');
    expect(user.email).toBe('test@example.com');
  });
});

// Step 2: GREEN - Minimal implementation
class UserService {
  async createUser({ email, password }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return { email, password: hashedPassword };
  }
}

// Step 3: REFACTOR - Improve while keeping tests green
class UserService {
  constructor(userRepository, hasher) {
    this.userRepository = userRepository;
    this.hasher = hasher;
  }

  async createUser({ email, password }) {
    this.validateEmail(email);
    const hashedPassword = await this.hasher.hash(password);
    return this.userRepository.create({ email, password: hashedPassword });
  }

  validateEmail(email) {
    if (!email.includes('@')) {
      throw new Error('Invalid email');
    }
  }
}
```

## Behavior-Driven Development (BDD)

### Gherkin Syntax

```gherkin
Feature: User Authentication

  Scenario: Successful login
    Given a registered user with email "user@example.com"
    When the user submits valid credentials
    Then they should be redirected to the dashboard
    And a welcome message should be displayed

  Scenario: Failed login with wrong password
    Given a registered user with email "user@example.com"
    When the user submits an incorrect password
    Then an error message should be displayed
    And the user should remain on the login page
```

**Implementation with Cucumber/Jest:**
```javascript
const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

Given('a registered user with email {string}', async function (email) {
  this.user = await createTestUser({ email, password: 'password123' });
});

When('the user submits valid credentials', async function () {
  this.response = await login(this.user.email, 'password123');
});

Then('they should be redirected to the dashboard', function () {
  assert.strictEqual(this.response.redirectUrl, '/dashboard');
});
```

## Coverage Goals

### Recommended Thresholds

| Code Type | Minimum Coverage |
|-----------|-------------------|
| Critical business logic | 90-100% |
| API controllers | 80-90% |
| Utilities/helpers | 85-95% |
| UI components | 70-80% |
| Configuration | Not required |

**jest.config.js:**
```javascript
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/index.js',
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/services/': {
      branches: 90,
      functions: 95,
      lines: 95,
    },
  },
};
```

## Test Doubles

### Types and When to Use Them

```javascript
// MOCK - Verifies interactions
const mockSendEmail = jest.fn();
emailService.send = mockSendEmail;
await notificationService.notify(user);
expect(mockSendEmail).toHaveBeenCalledWith(user.email, expect.any(String));

// STUB - Provides canned responses
const stubUserRepository = {
  findById: jest.fn().mockResolvedValue({ id: 1, name: 'John' }),
};

// SPY - Wraps a real function to observe it
const spy = jest.spyOn(console, 'log');
doSomething();
expect(spy).toHaveBeenCalled();
spy.mockRestore();

// FAKE - A working but simplified implementation
class FakeUserRepository {
  constructor() {
    this.users = [];
  }
  async save(user) {
    this.users.push(user);
    return user;
  }
  async findById(id) {
    return this.users.find(u => u.id === id);
  }
}
```

## AAA Pattern (Arrange-Act-Assert)

```javascript
it('should calculate total price with tax', () => {
  // Arrange
  const cart = new Cart();
  cart.addItem({ price: 100, quantity: 2 });
  const taxRate = 0.16;

  // Act
  const total = cart.calculateTotal(taxRate);

  // Assert
  expect(total).toBe(232);
});
```

## F.I.R.S.T Principles

- **F**ast - Tests should run quickly
- **I**ndependent - Tests should not depend on each other
- **R**epeatable - Same result every time, in any environment
- **S**elf-Validating - Pass/fail without manual inspection
- **T**imely - Written close to (or before) the production code

## Given-When-Then Example

```javascript
describe('Shopping Cart', () => {
  it('GIVEN an empty cart WHEN adding an item THEN the cart should have 1 item', () => {
    // Given
    const cart = new Cart();

    // When
    cart.addItem({ id: 1, name: 'Product', price: 10 });

    // Then
    expect(cart.items.length).toBe(1);
  });
});
```

## CI/CD Integration

**GitHub Actions Example:**
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:6
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          TEST_DB_URI: mongodb://localhost:27017/test

      - name: Generate coverage report
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

      - name: Run E2E tests
        run: npm run test:e2e
```

## Quality Gates

```javascript
// package.json scripts
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "cypress run",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "pretest": "npm run lint"
  }
}
```

## Testing Anti-Patterns

```javascript
// BAD - Test depends on execution order
let userId;
it('creates a user', () => {
  userId = createUser().id;
});
it('updates the user', () => {
  updateUser(userId); // Depends on the previous test
});

// GOOD - Independent tests
it('updates an existing user', () => {
  const userId = createUser().id; // Self-contained setup
  updateUser(userId);
});

// BAD - Testing implementation details
it('calls setState internally', () => {
  expect(component.setState).toHaveBeenCalled();
});

// GOOD - Testing observable behavior
it('displays the updated value', () => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
});

// BAD - Overly broad assertion
expect(result).toBeTruthy();

// GOOD - Specific assertion
expect(result).toEqual({ id: 1, name: 'John', active: true });
```

## Testing Checklist

Before merging code:
- [ ] Unit tests for new business logic
- [ ] Integration tests for new endpoints
- [ ] Edge cases covered (null, empty, negative numbers)
- [ ] Error cases tested
- [ ] Coverage meets the project threshold
- [ ] No tests depending on execution order
- [ ] Mocks/stubs cleaned up after each test
- [ ] Tests run successfully in CI
- [ ] No skipped tests left without justification

## Best Practices

1. **Test behavior, not implementation** - Tests should survive refactors
2. **One assertion concept per test** - Clarity over compactness
3. **Descriptive test names** - Should read like a specification
4. **Don't test third-party libraries** - Trust their own test suites
5. **Use factories for test data** - Avoid duplicated setup code
6. **Clean up after tests** - Database, mocks, timers
7. **Fast feedback loop** - Unit tests should run in seconds
8. **Test the unhappy path** - Errors, validation failures, edge cases

---

**Last updated:** Phase 7 - Testing & QA
**Maintainer:** Skills System
