# React - Modern UI Development

**Scope:** frontend
**Trigger:** when working with React, creating components, using hooks, or building UI with React
**Tools:** view, file_create, str_replace, bash_tool
**Version:** 1.0.0

---

## Purpose

This skill guides building modern React applications using the latest versions and best practices. It covers everything from setup to advanced component patterns, hooks, and optimization.

## When to Use This Skill

- Creating React projects from scratch
- Developing reusable components
- Implementing hooks (useState, useEffect, custom hooks)
- Configuring routing with React Router
- Managing state with the Context API
- Optimizing React application performance
- Refactoring existing components
- Integrating with backend APIs

## Context and Knowledge

### Current Version
React 18+ (always use the latest stable version)

### Setup Tools

**Vite (Recommended - Fastest):**
```bash
npm create vite@latest my-app -- --template react
cd my-app
npm install
npm run dev
```

**Create React App (Stable):**
```bash
npx create-react-app my-app
cd my-app
npm start
```

### Recommended Project Structure

```
src/
├── components/
│   ├── common/          # Button, Input, Card, Modal
│   ├── layout/          # Header, Footer, Sidebar, Layout
│   └── features/        # UserProfile, ProductCard, OrderList
├── pages/                # Home, About, Dashboard, Login
├── hooks/                # useAuth, useFetch, useForm
├── context/              # AuthContext, ThemeContext
├── services/             # api.js, authService.js
├── utils/                # helpers, formatters, validators
├── assets/               # images, icons, fonts
├── styles/               # global styles, variables
├── App.jsx
└── main.jsx
```

## Workflow

### 1. New Project Setup

```bash
# Create a project with Vite
npm create vite@latest project-name -- --template react

# Install common dependencies
npm install react-router-dom axios
npm install -D tailwindcss postcss autoprefixer

# (Optional) TypeScript
npm create vite@latest project-name -- --template react-ts
```

### 2. Initial Configuration

**Tailwind CSS (if used):**
```bash
npx tailwindcss init -p
```

**tailwind.config.js:**
```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

### 3. Component Structure

**Basic Functional Component:**
```jsx
import React from 'react';

const Button = ({ children, onClick, variant = 'primary', disabled = false }) => {
  const baseStyles = 'px-4 py-2 rounded font-medium transition-colors';
  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {children}
    </button>
  );
};

export default Button;
```

**Component with State:**
```jsx
import { useState, useEffect } from 'react';

const UserProfile = ({ userId }) => {
  // 1. State
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. Effects
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch user');
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]); // Dependency array

  // 3. Conditional rendering
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user found</div>;

  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
};

export default UserProfile;
```

## Essential Hooks

### useState - Local State

```jsx
const [count, setCount] = useState(0);
const [user, setUser] = useState({ name: '', email: '' });
const [items, setItems] = useState([]);

// Update state
setCount(count + 1);
setCount(prev => prev + 1); // Preferred when based on previous value

// Object state
setUser({ ...user, name: 'John' });
setUser(prev => ({ ...prev, email: 'john@example.com' }));

// Array state
setItems([...items, newItem]);
setItems(prev => [...prev, newItem]);
```

### useEffect - Side Effects

```jsx
// 1. Run once (componentDidMount)
useEffect(() => {
  console.log('Component mounted');
}, []);

// 2. Run when a dependency changes
useEffect(() => {
  fetchData(userId);
}, [userId]);

// 3. Cleanup (componentWillUnmount)
useEffect(() => {
  const subscription = subscribeToData();

  return () => {
    subscription.unsubscribe();
  };
}, []);

// 4. Multiple dependencies
useEffect(() => {
  if (isAuthenticated && userId) {
    loadUserData();
  }
}, [isAuthenticated, userId]);
```

### Custom Hooks

**useAuth:**
```jsx
import { useState, useContext, createContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    setUser(data.user);
    localStorage.setItem('token', data.token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

**useFetch (Generic):**
```jsx
import { useState, useEffect } from 'react';

const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};

export default useFetch;
```

**useForm:**
```jsx
import { useState } from 'react';

const useForm = (initialValues, validate) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
    }
  };

  const handleSubmit = (callback) => (e) => {
    e.preventDefault();
    const validationErrors = validate ? validate(values) : {};
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      callback(values);
    }
  };

  return { values, errors, touched, handleChange, handleBlur, handleSubmit };
};

export default useForm;
```

## React Router

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />

          {/* Protected routes */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route path="login" element={<Login />} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

**Protected Route Component:**
```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
```

## Performance Optimization

### React.memo - Prevent Re-renders

```jsx
import { memo } from 'react';

const ExpensiveComponent = memo(({ data, onAction }) => {
  console.log('ExpensiveComponent rendered');
  return (
    <div>
      {/* Heavy component */}
    </div>
  );
});

export default ExpensiveComponent;
```

### useMemo - Memoize Calculations

```jsx
import { useMemo } from 'react';

const ProductList = ({ products, filter }) => {
  // Only recalculates when products or filter change
  const filteredProducts = useMemo(() => {
    console.log('Filtering products...');
    return products.filter(p => p.category === filter);
  }, [products, filter]);

  return (
    <div>
      {filteredProducts.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
```

### useCallback - Memoize Functions

```jsx
import { useCallback, useState } from 'react';

const ParentComponent = () => {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);

  // This function only recreates if setItems changes (never)
  const handleAddItem = useCallback((item) => {
    setItems(prev => [...prev, item]);
  }, []);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <ChildComponent onAddItem={handleAddItem} />
    </div>
  );
};
```

## Common Patterns

### Compound Components

```jsx
const Tabs = ({ children, defaultActive = 0 }) => {
  const [activeIndex, setActiveIndex] = useState(defaultActive);

  return (
    <div className="tabs">
      {React.Children.map(children, (child, index) =>
        React.cloneElement(child, {
          isActive: index === activeIndex,
          onActivate: () => setActiveIndex(index),
        })
      )}
    </div>
  );
};

const Tab = ({ label, children, isActive, onActivate }) => (
  <div>
    <button onClick={onActivate} className={isActive ? 'active' : ''}>
      {label}
    </button>
    {isActive && <div className="tab-content">{children}</div>}
  </div>
);

// Usage
<Tabs>
  <Tab label="Tab 1">Content 1</Tab>
  <Tab label="Tab 2">Content 2</Tab>
  <Tab label="Tab 3">Content 3</Tab>
</Tabs>
```

### Render Props

```jsx
const DataFetcher = ({ url, render }) => {
  const { data, loading, error } = useFetch(url);
  return render({ data, loading, error });
};

// Usage
<DataFetcher
  url="/api/users"
  render={({ data, loading, error }) => {
    if (loading) return <Spinner />;
    if (error) return <Error message={error} />;
    return <UserList users={data} />;
  }}
/>
```

## Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| Infinite re-renders | useEffect without dependencies | Add a dependency array `[]` |
| State does not update | Direct state mutation | Use the spread operator: `{ ...state }` |
| Memory leak | useEffect without cleanup | Return a cleanup function |
| Stale closure | Variables captured in a closure | Use refs or correct dependencies |
| Props drilling | Passing props through many levels | Use Context API or a state library |
| Key warnings | Missing/duplicate keys | Use unique IDs, not array indices |

## API Integration

**Service Layer (services/api.js):**
```jsx
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Something went wrong');
  }
  return response.json();
};

export const api = {
  get: (endpoint) =>
    fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    }).then(handleResponse),

  post: (endpoint, data) =>
    fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    }).then(handleResponse),

  put: (endpoint, data) =>
    fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    }).then(handleResponse),

  delete: (endpoint) =>
    fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    }).then(handleResponse),
};
```

## Validation Checklist

Before finalizing a React component:
- [ ] Component name in PascalCase
- [ ] Props destructured with default values
- [ ] State handled correctly (no mutation)
- [ ] useEffect has the correct dependency array
- [ ] Heavy functions memoized (useMemo/useCallback)
- [ ] Loading, error, success states handled
- [ ] Unique keys in lists
- [ ] No console.log left in production
- [ ] Component is reusable
- [ ] Responsive design (mobile-first)

## Best Practices

1. **Small, focused components** - One responsibility per component
2. **Well-typed props** - Use PropTypes or TypeScript
3. **Composition over inheritance** - Combine small components
4. **Custom hooks for shared logic** - DRY principle
5. **Lazy loading for routes** - Better initial performance
6. **Error boundaries** - Catch component errors
7. **Accessibility** - Use semantic HTML and ARIA attributes
8. **Testing** - Unit tests for hooks and components

---

**Last updated:** Phase 2 - MERN Skills
**Maintainer:** Skills System
