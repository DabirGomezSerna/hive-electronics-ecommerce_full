# API Best Practices - RESTful Design & Production Ready

**Scope:** backend
**Trigger:** when designing REST APIs, or when API design, RESTful principles, API documentation, or production-ready APIs are discussed
**Tools:** view, file_create, str_replace, bash_tool
**Version:** 1.0.0

---

## Purpose

This skill guides the design and development of professional, production-ready RESTful APIs. It covers REST principles, versioning, OpenAPI/Swagger documentation, security, rate limiting, caching, and monitoring.

## When to Use This Skill

- Designing new REST APIs from scratch
- Refactoring existing APIs
- Implementing API versioning
- Documenting APIs with OpenAPI/Swagger
- Configuring rate limiting and throttling
- Implementing caching strategies
- Preparing APIs for production
- Migrating from REST to GraphQL

## Context and Knowledge

### REST Principles

**REST (Representational State Transfer):**
1. **Client-Server** - Separation of concerns
2. **Stateless** - No client state is stored on the server
3. **Cacheable** - Responses must indicate whether they are cacheable
4. **Uniform Interface** - Consistent, predictable URLs
5. **Layered System** - The client does not know whether it talks to the final server
6. **Code on Demand** (optional) - The server may send executable code

### Richardson Maturity Model

```
Level 0: Single URI, Single Method (RPC)
    POST /api/endpoint

Level 1: Multiple URIs, Single Method
    POST /api/users
    POST /api/products

Level 2: Multiple URIs, Multiple Methods (HTTP Verbs)
    GET    /api/users
    POST   /api/users
    PUT    /api/users/1
    DELETE /api/users/1

Level 3: HATEOAS (Hypermedia)
    {
      "id": 1,
      "name": "John",
      "_links": {
        "self": "/users/1",
        "orders": "/users/1/orders"
      }
    }
```

## URL Design

### Naming Conventions

```
GOOD - Resources as plural nouns
GET    /api/v1/users
GET    /api/v1/users/123
POST   /api/v1/users
PUT    /api/v1/users/123
DELETE /api/v1/users/123

GOOD - Nested relationships
GET    /api/v1/users/123/orders
GET    /api/v1/users/123/orders/456
POST   /api/v1/users/123/orders

BAD - Verbs in URLs
GET    /api/v1/getUsers
POST   /api/v1/createUser
PUT    /api/v1/updateUser

BAD - Inconsistent plural/singular
GET    /api/v1/user
GET    /api/v1/products
```

### Query Parameters

```
GOOD - Filters, search, pagination
GET /api/v1/users?role=admin&status=active
GET /api/v1/products?category=electronics&price_max=1000
GET /api/v1/posts?page=2&limit=20&sort=-created_at

GOOD - Sparse fieldsets
GET /api/v1/users?fields=id,name,email

GOOD - Search
GET /api/v1/products?search=laptop
GET /api/v1/users?q=john

BAD - Business logic in query params
GET /api/v1/users?action=sendEmail
```

## HTTP Methods and Status Codes

### HTTP Methods

```
GET     - Retrieve resources (idempotent, cacheable)
POST    - Create a new resource
PUT     - Full update (idempotent)
PATCH   - Partial update (idempotent)
DELETE  - Remove a resource (idempotent)
HEAD    - Like GET but headers only
OPTIONS - Allowed methods (CORS)
```

### Correct Status Codes

**2xx - Success:**
```
200 OK              - Successful GET, PUT, PATCH
201 Created         - Successful POST, resource created
    Location: /api/v1/users/123
202 Accepted        - Asynchronous processing accepted
204 No Content      - Successful DELETE or PUT with no body
```

**3xx - Redirection:**
```
301 Moved Permanently  - URL changed permanently
302 Found              - Temporary URL
304 Not Modified       - Cache is valid
```

**4xx - Client Error:**
```
400 Bad Request           - Validation failed
401 Unauthorized          - Not authenticated
403 Forbidden             - No permission
404 Not Found             - Resource does not exist
405 Method Not Allowed    - HTTP method not allowed
409 Conflict              - Conflict (e.g. duplicate email)
422 Unprocessable Entity  - Business validation failed
429 Too Many Requests     - Rate limit exceeded
```

**5xx - Server Error:**
```
500 Internal Server Error  - Unhandled error
502 Bad Gateway            - Invalid gateway
503 Service Unavailable    - Service temporarily unavailable
504 Gateway Timeout        - Gateway timeout
```

### Response Examples

```json
// 200 OK - GET /api/v1/users/123
{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2024-01-01T00:00:00Z"
}

// 201 Created - POST /api/v1/users
{
  "id": 124,
  "name": "Jane Doe",
  "email": "jane@example.com",
  "createdAt": "2024-01-02T00:00:00Z"
}
// Header: Location: /api/v1/users/124

// 400 Bad Request
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Email is required" },
      { "field": "password", "message": "Password must be at least 6 characters" }
    ]
  }
}

// 404 Not Found
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User not found with id: 999"
  }
}

// 429 Too Many Requests
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Try again in 60 seconds.",
    "retryAfter": 60
  }
}
// Header: Retry-After: 60
```

## Versioning

### Versioning Strategies

**1. URL Path (Recommended):**
```
GET /api/v1/users
GET /api/v2/users
```

**2. Query Parameter:**
```
GET /api/users?version=1
GET /api/users?version=2
```

**3. Header:**
```
GET /api/users
Header: Accept: application/vnd.myapi.v1+json
```

**4. Content Negotiation:**
```
GET /api/users
Header: Accept: application/vnd.myapi+json; version=1
```

### Breaking vs Non-Breaking Changes

**Non-Breaking (no new version required):**
- Adding a new endpoint
- Adding a new optional request field
- Adding a new response field
- Making a required field optional

**Breaking (requires a new version):**
- Changing an endpoint URL
- Removing a field from a response
- Changing a field's data type
- Making an optional field required
- Changing existing business logic behavior

## Pagination

### Offset-based Pagination

```
GET /api/v1/users?page=2&limit=20

Response:
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": true
  },
  "links": {
    "first": "/api/v1/users?page=1&limit=20",
    "prev": "/api/v1/users?page=1&limit=20",
    "next": "/api/v1/users?page=3&limit=20",
    "last": "/api/v1/users?page=8&limit=20"
  }
}
```

### Cursor-based Pagination (better for large datasets)

```
GET /api/v1/posts?cursor=abc123&limit=20

Response:
{
  "data": [...],
  "pagination": {
    "nextCursor": "def456",
    "prevCursor": "xyz789",
    "hasNext": true
  },
  "links": {
    "next": "/api/v1/posts?cursor=def456&limit=20",
    "prev": "/api/v1/posts?cursor=xyz789&limit=20"
  }
}
```

## Filtering and Search

### Simple Filters

```
GET /api/v1/products?category=electronics
GET /api/v1/users?role=admin&status=active
GET /api/v1/posts?author_id=123&published=true
```

### Ranges

```
GET /api/v1/products?price_min=100&price_max=500
GET /api/v1/orders?created_after=2024-01-01&created_before=2024-12-31
```

### Sorting

```
GET /api/v1/users?sort=name           # Ascending
GET /api/v1/users?sort=-created_at    # Descending (-)
GET /api/v1/products?sort=category,-price  # Multiple fields
```

### Search

```
GET /api/v1/products?search=laptop
GET /api/v1/users?q=john&fields=name,email
```

### Sparse Fieldsets

```
GET /api/v1/users?fields=id,name,email
GET /api/v1/products?fields=id,name,price

Response:
{
  "data": [
    { "id": 1, "name": "John", "email": "john@example.com" }
    // Only requested fields
  ]
}
```

## Security

### Authentication

**JWT Bearer Token:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**API Key:**
```
X-API-Key: your-api-key-here
```

**OAuth 2.0:**
```
Authorization: Bearer <access_token>
```

### Rate Limiting

**Rate Limit Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1641024000

// When exceeded:
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1641024060
```

**Strategies:**
```
1. Fixed Window   - Fixed N requests per hour
2. Sliding Window - N requests in a rolling hour
3. Token Bucket   - Tokens that refill over time
4. Leaky Bucket   - Queue with a constant drain rate
```

### CORS

```javascript
// Express example
app.use(cors({
  origin: ['https://app.example.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));
```

### Security Headers

```
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## Caching

### Cache Headers

```
// Cache for 1 hour
Cache-Control: public, max-age=3600

// No cache
Cache-Control: no-store, no-cache, must-revalidate

// Private cache (browser only)
Cache-Control: private, max-age=300

// ETag for conditional requests
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
```

### Conditional Requests

```
// Client request with ETag
GET /api/v1/users/123
If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"

// If unchanged: 304 Not Modified (no body)
HTTP/1.1 304 Not Modified
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"

// If changed: 200 OK (with new body and ETag)
HTTP/1.1 200 OK
ETag: "new-etag-value"
```

## OpenAPI/Swagger Documentation

### OpenAPI Spec (YAML)

```yaml
openapi: 3.0.0
info:
  title: My API
  version: 1.0.0
  description: API for managing users and products

servers:
  - url: https://api.example.com/v1
    description: Production
  - url: https://staging-api.example.com/v1
    description: Staging

paths:
  /users:
    get:
      summary: List all users
      tags: [Users]
      parameters:
        - name: page
          in: query
          schema: { type: integer, default: 1 }
        - name: limit
          in: query
          schema: { type: integer, default: 20 }
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items: { $ref: '#/components/schemas/User' }
                  pagination: { $ref: '#/components/schemas/Pagination' }
        '401':
          $ref: '#/components/responses/Unauthorized'
      security:
        - bearerAuth: []

    post:
      summary: Create a new user
      tags: [Users]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/CreateUserRequest' }
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema: { $ref: '#/components/schemas/User' }
        '400':
          $ref: '#/components/responses/BadRequest'

components:
  schemas:
    User:
      type: object
      properties:
        id: { type: integer, example: 123 }
        name: { type: string, example: John Doe }
        email: { type: string, format: email, example: john@example.com }
        createdAt: { type: string, format: date-time }

    CreateUserRequest:
      type: object
      required: [name, email, password]
      properties:
        name: { type: string, minLength: 3, maxLength: 50 }
        email: { type: string, format: email }
        password: { type: string, minLength: 6 }

    Pagination:
      type: object
      properties:
        page: { type: integer }
        limit: { type: integer }
        total: { type: integer }
        totalPages: { type: integer }

  responses:
    Unauthorized:
      description: Unauthorized
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: object
                properties:
                  code: { type: string, example: UNAUTHORIZED }
                  message: { type: string, example: Authentication required }

    BadRequest:
      description: Bad Request
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: object
                properties:
                  code: { type: string }
                  message: { type: string }
                  details: { type: array, items: { type: object } }

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

## Monitoring and Logging

### Key Metrics

```
1. Request Rate     - Requests per second
2. Error Rate       - % of 4xx and 5xx responses
3. Latency          - P50, P95, P99
4. Availability     - Uptime %
5. Throughput       - Data transferred
```

### Structured Logging

```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "level": "info",
  "method": "GET",
  "path": "/api/v1/users/123",
  "statusCode": 200,
  "responseTime": 45,
  "userId": 456,
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

### Health Check Endpoint

```
GET /health

Response:
{
  "status": "healthy",
  "version": "1.2.3",
  "timestamp": "2024-01-01T12:00:00Z",
  "checks": {
    "database": "healthy",
    "cache": "healthy",
    "externalApi": "degraded"
  },
  "uptime": 86400
}
```

## Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| Inconsistent responses | Each endpoint formats differently | Standardize the response format |
| Verbs in URLs | Not following REST conventions | Use resources + HTTP verbs |
| N+1 queries | Missing eager loading | Optimize queries with joins |
| No versioning | Breaking changes without notice | Implement /v1/, /v2/ |
| Missing pagination | Returning thousands of items | Always paginate list results |
| No rate limiting | API abuse | Implement throttling |

## Production-Ready Checklist

- [ ] Versioning implemented (/v1/)
- [ ] Pagination on list endpoints
- [ ] Filtering and sorting
- [ ] Rate limiting configured
- [ ] Authentication/Authorization
- [ ] CORS configured correctly
- [ ] Consistent error handling
- [ ] Structured logging
- [ ] OpenAPI/Swagger documentation
- [ ] Health check endpoint
- [ ] Caching strategy
- [ ] Monitoring and alerts
- [ ] Load testing performed
- [ ] Security headers
- [ ] Input validation

## Best Practices

1. **RESTful URLs** - Resources as plural nouns
2. **HTTP Methods** - Use GET, POST, PUT, DELETE correctly
3. **Status Codes** - Specific and correct
4. **Versioning** - From the start (/v1/)
5. **Pagination** - Always on large lists
6. **Rate Limiting** - Protect against abuse
7. **Documentation** - Keep OpenAPI/Swagger up to date
8. **Consistent Responses** - Same format everywhere
9. **Security** - JWT, CORS, rate limiting, validation
10. **Monitoring** - Logs, metrics, alerts

## REST vs GraphQL vs gRPC

| Feature | REST | GraphQL | gRPC |
|---------|------|---------|------|
| **Best for** | CRUD apps | Complex queries | Microservices |
| **Learning curve** | Easy | Medium | High |
| **Over-fetching** | Common | No | No |
| **Under-fetching** | Common (N+1) | No | No |
| **Caching** | Built-in HTTP | Custom | Custom |
| **Tooling** | Excellent | Very good | Good |
| **Browser support** | Native | Native | Not direct |

---

**Last updated:** Phase 4 - Backend Skills
**Maintainer:** Skills System
