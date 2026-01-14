# مُعين Backend API Documentation

## 📖 Overview

This is the backend API for the مُعين (Moeen) Quran Memorization Platform. It provides comprehensive functionality for user management, Quran memorization, AI-powered evaluation, and administrative features.

## 🏗️ Architecture

The backend is built with:
- **Node.js** + **Express** framework
- **TypeScript** for type safety
- **PostgreSQL** as the primary database
- **JWT** for authentication
- **Google Gemini Flash 3** for AI evaluation
- **Winston** for logging
- **Joi** for input validation

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Database and environment configuration
│   ├── controllers/      # API route handlers
│   ├── middleware/       # Authentication, validation, rate limiting
│   ├── models/          # Database models and business logic
│   ├── routes/          # API route definitions
│   ├── services/        # External service integrations (AI)
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Helper utilities
│   └── app.ts           # Express app configuration
├── database/
│   ├── migrations/      # Database migration files
│   └── seeds/           # Database seed data
├── tests/               # Test files
└── dist/               # Compiled JavaScript output
```

## 🗄️ Database Schema

The platform uses the following core tables:

### Core Tables
- **users** - User accounts and authentication
- **quota_pool** - Free tier quota management
- **surahs** - Quran chapters data
- **exams** - Testing and evaluation records
- **istighfar_sessions** - Dhikr tracking
- **audit_logs** - System activity logging

### Views
- **user_stats** - User performance statistics
- **daily_quota_usage** - Quota consumption tracking

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd moeinv1/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Create database
   createdb moeen_platform
   
   # Run migrations
   npm run migrate
   
   # Run seeds (optional)
   npm run seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🚀 API Endpoints

### Health & Status
- `GET /health` - Health check
- `GET /api/status` - API status and information
- `GET /api` - API documentation

### Authentication (Coming Soon)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation

### Users (Coming Soon)
- `GET /api/users` - Get users (with pagination)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `POST /api/users/change-password` - Change password

### Exams (Coming Soon)
- `GET /api/exams` - Get user's exams
- `POST /api/exams` - Create new exam
- `GET /api/exams/:id` - Get exam by ID
- `PUT /api/exams/:id` - Update exam
- `POST /api/exams/:id/start` - Start exam
- `POST /api/exams/:id/complete` - Complete exam
- `POST /api/exams/:id/cancel` - Cancel exam

### Istighfar (Coming Soon)
- `GET /api/istighfar/sessions` - Get user's sessions
- `POST /api/istighfar/sessions` - Create new session
- `GET /api/istighfar/sessions/:id` - Get session by ID
- `PUT /api/istighfar/sessions/:id` - Update session
- `POST /api/istighfar/sessions/:id/complete` - Complete session
- `GET /api/istighfar/leaderboard` - Get leaderboard

### Admin (Coming Soon)
- `GET /api/admin/users` - Manage users
- `GET /api/admin/exams` - View all exams
- `GET /api/admin/quota` - Manage quota pool
- `GET /api/admin/audit-logs` - View audit logs
- `GET /api/admin/analytics` - View analytics

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Rate Limiting** - Configurable rate limits per endpoint
- **Input Validation** - Comprehensive input validation with Joi
- **Quota Management** - Free tier quota tracking and enforcement
- **Audit Logging** - Complete audit trail of all actions
- **CORS Protection** - Cross-origin request protection
- **Helmet Security** - Security headers protection
- **SQL Injection Prevention** - Parameterized queries
- **XSS Prevention** - Input sanitization

## 📊 Monitoring & Logging

### Logging Levels
- `error` - Error events
- `warn` - Warning events  
- `info` - Informational events
- `debug` - Debug events (development only)

### Log Files
- `logs/app.log` - General application logs
- `logs/error.log` - Error-only logs

### Monitoring Endpoints
- `/health` - Application health status
- `/api/status` - API operational status

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── fixtures/       # Test data
└── setup.ts        # Test configuration
```

## 📦 Deployment

### Environment Variables
```bash
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# JWT
JWT_SECRET=your-super-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# AI
GEMINI_API_KEY=your-gemini-api-key

# Quota
FREE_QUOTA_DAILY=1500
PAID_QUOTA_MULTIPLIER=10
```

### Build Process
```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

## 🔄 Development Workflow

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm test              # Run tests
npm run test:watch    # Run tests in watch mode
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues
npm run migrate       # Run database migrations
npm run seed          # Run database seeds
```

## 🔧 Configuration

### Database Configuration
Located in `src/config/database.ts`:
- Connection pooling
- Query timeout configuration
- Connection retry logic
- Health monitoring

### Environment Configuration  
Located in `src/config/environment.ts`:
- Environment variable validation
- Default values
- Type safety

### Logging Configuration
Located in `src/utils/logger.ts`:
- Multiple log levels
- File rotation
- Structured logging
- Error tracking

## 📚 API Documentation

### Response Format
All API responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful",
  "timestamp": "2025-01-14T00:00:00.000Z"
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {...},
  "timestamp": "2025-01-14T00:00:00.000Z"
}
```

### Pagination
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2025-01-14T00:00:00.000Z"
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL service status
   - Verify connection string in .env
   - Ensure database exists

2. **Migration Errors**
   - Check database permissions
   - Verify migration files syntax
   - Run migrations in order

3. **JWT Token Errors**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure proper token format

### Debug Mode
Enable debug logging:
```bash
LOG_LEVEL=debug npm run dev
```

## 📈 Performance

### Optimization Features
- Database connection pooling
- Query optimization with indexes
- Response compression
- Static file caching
- Rate limiting

### Monitoring
- Request logging with response times
- Database query performance tracking
- Memory usage monitoring
- Error rate tracking

## 🔗 Integration Points

### External Services
- **Google Gemini AI** - Quran recitation evaluation
- **Email Service** - User notifications (planned)
- **Payment Processors** - Subscription management (planned)

### Webhooks
- **Payment Notifications** - Subscription status changes (planned)
- **User Activity** - Real-time updates (planned)

## 📋 Phase Status

### ✅ Phase 1 - Foundation (Current)
- [x] Project structure setup
- [x] Database schema design
- [x] Configuration management
- [x] Authentication middleware
- [x] Validation middleware
- [x] Error handling
- [x] Logging system
- [x] Database models
- [x] Security features

### 🚧 Phase 2 - Core Features (Next)
- [ ] API routes implementation
- [ ] AI integration
- [ ] Audio processing
- [ ] User registration/login
- [ ] Exam system

### 📅 Future Phases
- [ ] Frontend development
- [ ] Admin dashboard
- [ ] Payment integration
- [ ] Advanced analytics
- [ ] Mobile app support

## 📞 Support

For technical support:
1. Check this documentation
2. Review error logs
3. Check GitHub issues
4. Contact the development team

---

## 📄 License

© 2025 مُعين Platform. All rights reserved.