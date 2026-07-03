# MongoDB Patterns - Database Design

**Scope:** backend
**Trigger:** when designing MongoDB schemas, implementing relationships between documents, or optimizing queries
**Tools:** view, file_create, str_replace, bash_tool
**Version:** 1.0.0

---

## Purpose

This skill guides the design of efficient schemas in MongoDB and Mongoose. It covers relationship patterns, indexing, aggregation pipelines, transactions, and query optimization.

## When to Use This Skill

- Designing a database schema for a new feature
- Deciding between embedded vs. referenced documents
- Optimizing slow queries
- Implementing complex relationships
- Using aggregation pipelines for reports
- Configuring indexes for performance
- Implementing multi-document transactions

## Context and Knowledge

### MongoDB Philosophy

**Document-Oriented:**
- Related data is stored together
- Avoids JOINs where possible
- Denormalization is common and considered good practice

**Flexible Schema:**
- Does not require a fixed structure
- Documents in the same collection can have different fields
- Schema evolution is easy

## Relationship Patterns

### 1. Embedded Documents (One-to-Few)

**When to use:**
- 1:N relationship where N is small (< 100)
- Embedded data is always accessed with the parent
- Embedded data does not grow without bound

**Example - User with Addresses:**
```javascript
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  addresses: [
    {
      street: String,
      city: String,
      zipCode: String,
      type: { type: String, enum: ['home', 'work'] },
    }
  ],
});

// Simple query - fetches the user with all their addresses
const user = await User.findById(userId);
console.log(user.addresses); // All addresses
```

**Advantages:**
- Simple query (single fetch)
- Atomic operations
- Better read performance

**Disadvantages:**
- Document can grow too large (16MB limit)
- Sub-documents cannot be referenced directly

### 2. Child Referencing (One-to-Many)

**When to use:**
- 1:N relationship where N is large (100+)
- Child documents are accessed independently
- Child documents can belong to multiple parents

**Example - User with Posts:**
```javascript
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
});

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

// Query with populate
const posts = await Post.find({ author: userId })
  .populate('author', 'name email')
  .sort({ createdAt: -1 });
```

**Advantages:**
- No size limit
- Independent child documents
- Flexible and scalable

**Disadvantages:**
- Requires multiple queries (or populate)
- Not atomic by default

### 3. Parent Referencing (Inverse One-to-Many)

**When to use:**
- You need to access the parent from the child
- Children can belong to different parents

**Example - Comments with Parent:**
```javascript
const commentSchema = new mongoose.Schema({
  text: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  },
  createdAt: { type: Date, default: Date.now },
});

// Query comments for a post
const comments = await Comment.find({ post: postId })
  .populate('author', 'name')
  .sort({ createdAt: -1 });
```

### 4. Two-Way Referencing (Many-to-Many)

**When to use:**
- N:M relationship
- You need to access both sides frequently

**Example - Users and Courses:**
```javascript
const userSchema = new mongoose.Schema({
  name: String,
  enrolledCourses: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }
  ],
});

const courseSchema = new mongoose.Schema({
  title: String,
  students: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],
});

// Query: a user's courses
const user = await User.findById(userId).populate('enrolledCourses');

// Query: a course's students
const course = await Course.findById(courseId).populate('students');
```

**Important:** Keep both sides synchronized:
```javascript
// Method to enroll a user
userSchema.methods.enrollInCourse = async function(courseId) {
  // Add course to the user
  this.enrolledCourses.push(courseId);
  await this.save();

  // Add user to the course
  await Course.findByIdAndUpdate(
    courseId,
    { $addToSet: { students: this._id } }
  );
};
```

### 5. Denormalization Pattern

**When to use:**
- Very frequent read queries
- Data that does not change much
- Willing to trade consistency for performance

**Example - Posts with Author Info:**
```javascript
const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,   // Denormalized
    avatar: String, // Denormalized
  },
  likes: Number,
  createdAt: { type: Date, default: Date.now },
});

// Super fast query - no populate required
const posts = await Post.find().sort({ createdAt: -1 });
// posts[0].author.name is available immediately
```

**Trade-off:**
- Ultra-fast queries
- Denormalized data needs to be updated whenever the source changes

```javascript
// When the user changes their name
userSchema.post('save', async function() {
  if (this.isModified('name')) {
    await Post.updateMany(
      { 'author.id': this._id },
      { $set: { 'author.name': this.name } }
    );
  }
});
```

## Indexing for Performance

### Index Types

**Single Field Index:**
```javascript
userSchema.index({ email: 1 }); // Ascending
userSchema.index({ createdAt: -1 }); // Descending
```

**Compound Index:**
```javascript
// Query: find({ user: userId, status: 'active' })
taskSchema.index({ user: 1, status: 1 });

// Query with sort: find().sort({ createdAt: -1 })
taskSchema.index({ user: 1, createdAt: -1 });
```

**Text Index (for search):**
```javascript
postSchema.index({ title: 'text', content: 'text' });

// Query
const results = await Post.find(
  { $text: { $search: 'mongodb tutorial' } }
);
```

**Unique Index:**
```javascript
userSchema.index({ email: 1 }, { unique: true });
```

**Sparse Index (only documents that have the field):**
```javascript
// Only indexes users that have phoneNumber
userSchema.index({ phoneNumber: 1 }, { sparse: true });
```

### Indexing Strategies

```javascript
// GOOD - Efficient compound index
// Query: find({ user: X, status: Y }).sort({ priority: -1 })
taskSchema.index({ user: 1, status: 1, priority: -1 });

// BAD - Redundant indexes
taskSchema.index({ user: 1 });
taskSchema.index({ user: 1, status: 1 }); // This already covers the previous one

// RULE: A compound index can serve prefix queries
// Index { a: 1, b: 1, c: 1 } serves:
// - { a }
// - { a, b }
// - { a, b, c }
// But NOT { b } or { c } alone
```

### Analyzing Performance

```javascript
// Explain the query plan
const explain = await Post.find({ author: userId })
  .sort({ createdAt: -1 })
  .explain('executionStats');

console.log(explain.executionStats.totalDocsExamined); // Documents scanned
console.log(explain.executionStats.executionTimeMillis); // Time

// If totalDocsExamined >> nReturned, an index is needed
```

## Aggregation Pipeline

### Common Use Cases

**1. Group By and Count:**
```javascript
// Count posts by user
const postsByUser = await Post.aggregate([
  {
    $group: {
      _id: '$author',
      count: { $sum: 1 },
      totalLikes: { $sum: '$likes' },
    }
  },
  { $sort: { count: -1 } },
  { $limit: 10 },
]);
```

**2. Lookup (JOIN):**
```javascript
// Posts with author info (without populate)
const postsWithAuthors = await Post.aggregate([
  {
    $lookup: {
      from: 'users',
      localField: 'author',
      foreignField: '_id',
      as: 'authorInfo',
    }
  },
  { $unwind: '$authorInfo' },
  {
    $project: {
      title: 1,
      content: 1,
      'authorInfo.name': 1,
      'authorInfo.email': 1,
    }
  },
]);
```

**3. Match and Project:**
```javascript
// Active posts with specific fields
const activePosts = await Post.aggregate([
  { $match: { status: 'active', likes: { $gte: 10 } } },
  {
    $project: {
      title: 1,
      likes: 1,
      authorName: '$author.name',
      likesCategory: {
        $switch: {
          branches: [
            { case: { $lt: ['$likes', 10] }, then: 'low' },
            { case: { $lt: ['$likes', 50] }, then: 'medium' },
          ],
          default: 'high',
        }
      }
    }
  },
  { $sort: { likes: -1 } },
]);
```

**4. Complex Statistics:**
```javascript
// Dashboard stats
const stats = await Order.aggregate([
  {
    $match: {
      createdAt: { $gte: new Date('2024-01-01') },
      status: 'completed',
    }
  },
  {
    $group: {
      _id: {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      },
      totalOrders: { $sum: 1 },
      totalRevenue: { $sum: '$total' },
      avgOrderValue: { $avg: '$total' },
    }
  },
  { $sort: { '_id.year': -1, '_id.month': -1 } },
]);
```

## Transactions

### When to Use Transactions

- Operations that must be atomic
- Multiple documents/collections
- Rollback required if something fails

**Example - Funds Transfer:**
```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Withdraw from source account
  await Account.findByIdAndUpdate(
    fromAccountId,
    { $inc: { balance: -amount } },
    { session }
  );

  // Deposit into destination account
  await Account.findByIdAndUpdate(
    toAccountId,
    { $inc: { balance: amount } },
    { session }
  );

  // Create transaction record
  await Transaction.create([{
    from: fromAccountId,
    to: toAccountId,
    amount,
    timestamp: new Date(),
  }], { session });

  // Commit
  await session.commitTransaction();
  console.log('Transaction successful');
} catch (error) {
  // Rollback
  await session.abortTransaction();
  console.error('Transaction failed:', error);
  throw error;
} finally {
  session.endSession();
}
```

## Advanced Patterns

### 1. Bucket Pattern (Time-Series Optimization)

**Problem:** Millions of sensor readings
```javascript
// BAD - One document per reading
{ sensor: 'A', temp: 20, time: ISODate() }
{ sensor: 'A', temp: 21, time: ISODate() }
// Millions of documents...
```

**Solution:** Group into buckets
```javascript
// GOOD - Bucket per hour
{
  sensor: 'A',
  date: ISODate('2024-01-01T10:00:00'),
  measurements: [
    { temp: 20, time: ISODate('2024-01-01T10:00:01') },
    { temp: 21, time: ISODate('2024-01-01T10:00:02') },
    // ... up to 3600 readings (1 hour)
  ]
}
```

### 2. Computed Pattern (Pre-calculated Data)

```javascript
const orderSchema = new mongoose.Schema({
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number,
      price: Number,
    }
  ],
  // Pre-calculated
  subtotal: Number,
  tax: Number,
  total: Number,
});

// Pre middleware to calculate totals
orderSchema.pre('save', function(next) {
  this.subtotal = this.items.reduce((sum, item) =>
    sum + (item.price * item.quantity), 0
  );
  this.tax = this.subtotal * 0.16;
  this.total = this.subtotal + this.tax;
  next();
});
```

### 3. Polymorphic Pattern

```javascript
// Different post types
const contentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['article', 'video', 'image'],
    required: true,
  },
  title: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Type-specific fields
  article: { text: String, wordCount: Number },
  video: { url: String, duration: Number },
  image: { url: String, width: Number, height: Number },
}, { discriminatorKey: 'type' });

// Query by type
const articles = await Content.find({ type: 'article' });
```

## Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| Document too large (>16MB) | Too many embedded docs | Use referencing instead |
| Slow queries | Missing appropriate indexes | Analyze with .explain() and add indexes |
| Memory leak in queries | Cursor not closed | Use .lean() or streams |
| Inconsistent data | Updating denormalized data | Use transactions or middleware hooks |
| N+1 queries | Populate inside loops | Use populate with arrays or aggregation |

## Schema Design Checklist

Before implementing a schema:
- [ ] Correct relationship type (embedded vs. referenced)
- [ ] Necessary indexes defined
- [ ] Validations in the schema
- [ ] Appropriate default values
- [ ] Timestamps (createdAt, updatedAt)
- [ ] Soft delete if required (deletedAt)
- [ ] Unique index where appropriate
- [ ] Pre/Post hooks if required
- [ ] Custom model methods documented
- [ ] Schema tested with real data

## Best Practices

1. **Design for your query patterns** - Not for perfect normalization
2. **Denormalize when read >> write** - Trading consistency for speed
3. **Index strategically** - Not every field needs an index
4. **Use lean() for read-only** - 5x faster than full Mongoose documents
5. **Batch operations when possible** - bulkWrite() is more efficient
6. **Monitor slow queries** - Enable profiling in MongoDB
7. **Use projections** - Do not return unnecessary fields
8. **Consider TTL indexes** - For temporary data (sessions, logs)

---

**Last updated:** Phase 2 - MERN Skills
**Maintainer:** Skills System
