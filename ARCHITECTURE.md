# Backend Architecture & Implementation Guide

## Architecture Overview

The backend implements a **production-grade microservices architecture** with clear separation of concerns:

```
Request → Middleware → Router → Controller → Service → Prisma → Database
         ↓
      Error Handler (catches & logs)
```

## Design Patterns Used

### 1. Service Layer Pattern
Each domain (customers, bills, inventory, suppliers) has a dedicated service that encapsulates business logic:

```javascript
// Separation of concerns
- Controllers: Handle HTTP requests/responses
- Services: Handle business logic & database queries
- Controllers never directly access database
```

### 2. Repository Pattern (via Prisma)
Prisma acts as the data access layer:

```javascript
// Services use Prisma client
import prisma from "../config/database.js";

// All database operations go through Prisma
await prisma.customer.findMany();
await prisma.bill.create({ data: {...} });
```

### 3. Middleware Pattern
Middleware handles cross-cutting concerns:

```javascript
// Error Handling
app.use(errorHandler);

// Request Logging
app.use(requestLogger);

// CORS & JSON parsing
app.use(cors());
app.use(express.json());
```

### 4. MVC Pattern
Model-View-Controller adapted for APIs:

```
Model   = Prisma Schema (database structure)
View    = JSON responses
Controller = HTTP handlers
```

## Detailed Architecture

### Configuration Layer (`src/config/`)
**Purpose**: Centralized settings & database setup

```javascript
// env.js - Environment configuration
export const config = {
  port: 3000,
  nodeEnv: "development",
  database: { url: "..." }
};

// database.js - Prisma client
export const prisma = new PrismaClient();
```

### Service Layer (`src/services/`)
**Purpose**: Business logic & data operations

```javascript
export const customerService = {
  async findAll(page, limit, filters) {
    // Pagination logic
    // Search/filter logic
    // Complex queries
  },
  async create(data) {
    // Validation
    // Data transformation
    // Database write
  }
};
```

**Why separate services?**
- ✅ Reusable logic
- ✅ Easy to test
- ✅ Clear responsibilities
- ✅ Scalable architecture

### Controller Layer (`src/controllers/`)
**Purpose**: HTTP request/response handling

```javascript
export const customerController = {
  async getAll(req, res) {
    // Extract query params
    const result = await customerService.findAll(...);
    // Send response
    res.json(result);
  }
};
```

**Why separate controllers?**
- ✅ HTTP concerns isolated
- ✅ Easier error handling
- ✅ Clean service layer
- ✅ Better testability

### Route Layer (`src/routes/`)
**Purpose**: API endpoint definitions

```javascript
// Express routes
router.get("/", customerController.getAll);
router.post("/", customerController.create);
router.get("/:id", customerController.getById);
```

**Benefits**
- ✅ Centralized endpoint definitions
- ✅ Easy to discover API structure
- ✅ Simple to modify signatures
- ✅ RESTful organization

### Middleware Layer (`src/middlewares/`)
**Purpose**: Cross-cutting concerns

```javascript
// Error Handler
export const errorHandler = (err, req, res, next) => {
  // Handles all errors globally
};

// Request Logger
export const requestLogger = (req, res, next) => {
  // Logs method, path, status, duration
};
```

**Why middleware?**
- ✅ DRY principle (don't repeat yourself)
- ✅ Consistent error handling
- ✅ Centralized logging
- ✅ Future monitoring/analytics

## Database Schema Design

### Model Relationships

```
Customer ←→ Bill (one-to-many)
         ↓
    BillItem → InventoryItem
              ↓
           Supplier

Supplier ←→ InventoryItem (one-to-many)
         ×
    PurchaseOrder ←→ PurchaseOrderItem

Customer/Supplier → Transaction (payment tracking)
InventoryItem     ↓ StockMovement (audit trail)
```

### Key Design Decisions

1. **Money stored in paise (cents)**
   - Avoids floating-point errors
   - Better for calculations
   - Easier to store consistently

2. **Status fields for soft deletes**
   - Keep historical data
   - Query active records only
   - Easy audit trail

3. **Timestamps (createdAt, updatedAt)**
   - Track record lifecycle
   - Debug timeline issues
   - Compliance/audit needs

4. **Indexes on common queries**
   - Speed up filtering by status
   - Fast date range queries
   - Improved search performance

## API Response Patterns

### Successful List Response
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15
  }
}
```

### Successful Single Response
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Error Response
```json
{
  "error": "Customer not found"
}
```

## Error Handling Strategy

### Prisma Known Errors
```javascript
if (err.code === "P2002") {
  // Unique constraint violation → 409
  return res.status(409).json({ error: "Duplicate entry" });
}

if (err.code === "P2025") {
  // Record not found → 404
  return res.status(404).json({ error: "Not found" });
}
```

### HTTP Status Codes Used
- `200` - OK (GET, PATCH)
- `201` - Created (POST)
- `204` - No Content (DELETE)
- `400` - Bad Request (validation error)
- `404` - Not Found
- `409` - Conflict (unique constraint)
- `500` - Server Error

## Performance Considerations

### 1. Database Queries
```javascript
// ❌ Bad - N+1 queries
const bills = await prisma.bill.findMany();
for (const bill of bills) {
  const customer = await prisma.customer.findUnique({
    where: { id: bill.customerId }
  });
}

// ✅ Good - Single query with includes
const bills = await prisma.bill.findMany({
  include: { customer: true }
});
```

### 2. Pagination
```javascript
// ✅ Always paginate lists
GET /api/customers?page=1&limit=20

// Prevents loading 1000s of records
const skip = (page - 1) * limit;
const customers = await prisma.customer.findMany({
  skip,
  take: limit
});
```

### 3. Selective Fields
```javascript
// ✅ Only load needed fields
const customers = await prisma.customer.findMany({
  select: { id: true, name: true, email: true }
});

// Reduces memory & bandwidth
```

### 4. Connection Pooling
Prisma automatically manages connection pool:
- Reuses connections
- Efficient resource usage
- Better performance

## Scalability Features

### 1. Horizontal Scaling
- Stateless services (no in-memory state)
- Database handles concurrency
- Ready for load balancing

### 2. Database Indexing
Indexes created on:
- Foreign keys (status, customerId)
- Frequently searched fields (emails, phones)
- Date fields (createdAt)

### 3. Caching Ready
Middleware-ready for cache layer (Redis):
```javascript
// Future: Add cache before database query
const cached = await redis.get(key);
if (cached) return cached;
```

### 4. Monitoring Ready
Request logging captures:
- Request path & method
- Response status
- Response time
- Enable APM integration

## Migration Strategy

### Development Migrations
```bash
# When schema changes:
npm run prisma:migrate

# Prisma generates SQL automatically
# Stored in prisma/migrations/
```

### Production Migrations
```bash
# Safe, no-prompt migration apply
npm run prisma:migrate:deploy

# Can be run via CI/CD
# Ensures consistency across environments
```

## Testing Strategy (Ready for Implementation)

### Unit Tests (Services)
```javascript
// Test customerService.create()
// Mock Prisma, test business logic
```

### Integration Tests (Controllers)
```javascript
// Test HTTP endpoints
// Real database or test database
```

### API Tests (Routes)
```javascript
// Test full request/response cycle
// Validate response formats
```

## Security Considerations

### Current Implementation
- ✅ Input validation ready (Joi middleware ready)
- ✅ Error handling (doesn't leak stack traces)
- ✅ CORS configured
- ✅ JSON payloads only

### Future Enhancements
- 🔄 JWT authentication
- 🔄 Role-based access control (RBAC)
- 🔄 Request rate limiting
- 🔄 SQL injection protection (Prisma provides)
- 🔄 HTTPS/TLS in production

## Monitoring & Observability

### Current Logging
```javascript
// Request logging middleware
[GET] /api/customers - 200 - 45ms

// Error logging
[ERROR] 2026-04-25T10:30:00 - Error message
```

### Future Enhancements
- 📊 Performance metrics (APM)
- 📊 Database query analysis
- 📊 Error tracking (Sentry)
- 📊 Health checks
- 📊 Alerting

## Extending the Architecture

### Adding New Feature: Categories

**Step 1: Update Schema**
```prisma
model Category {
  id   Int    @id @default(autoincrement())
  name String
  items InventoryItem[]
}
```

**Step 2: Run Migration**
```bash
npm run prisma:migrate
# Creates 2026_add_categories migration
```

**Step 3: Create Service**
```javascript
// src/services/categoryService.js
export const categoryService = { ... };
```

**Step 4: Create Controller**
```javascript
// src/controllers/categoryController.js
export const categoryController = { ... };
```

**Step 5: Create Routes**
```javascript
// src/routes/categoryRoutes.js
export default router;
```

**Step 6: Register in App**
```javascript
app.use("/api/categories", categoryRoutes);
```

## Production Checklist

Before deploying to production:

- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] Migrations tested
- [ ] Error logging configured
- [ ] Rate limiting implemented
- [ ] Authentication added
- [ ] HTTPS configured
- [ ] CORS configured appropriately
- [ ] Health check endpoint tested
- [ ] Load testing completed
- [ ] Security audit done
- [ ] Monitoring/alerting set up

## Troubleshooting Guide

### Issue: "Cannot find database"
```bash
# Create database
createdb vyaparbook

# Verify connection
psql -U postgres -d vyaparbook -c "SELECT 1;"
```

### Issue: "Prisma Client not found"
```bash
npm run prisma:generate
```

### Issue: "Migration files mismatch"
```bash
# Diagnose
npx prisma migrate status

# In emergency
npx prisma migrate reset
npm run seed
```

## Best Practices Summary

✅ **DO:**
- Separate services for business logic
- Use Prisma for all database access
- Handle errors globally
- Paginate all lists
- Log important operations
- Use transactions for multi-step operations
- Test services independently

❌ **DON'T:**
- Access database directly from routes
- Ignore validation
- Return stack traces to clients
- Make N+1 queries
- Load all data without pagination
- Mix concerns (business + HTTP)

---

**Architecture**: Production-Grade Microservices  
**Status**: ✅ Ready for Development & Deployment
**Last Updated**: 2026-04-25
