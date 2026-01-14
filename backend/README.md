# مُعين (Moeen) Platform Backend

Arabic Quran Memorization Platform with AI-powered Evaluation

## 🎯 Project Overview

مُعين (Moeen) is a comprehensive digital platform for Quran memorization, evaluation, and certification using advanced AI technology. The platform is designed to serve as a "digital institution" for Quranic education, providing reliable evaluation that mimics traditional sheikh assessment methods.

## 🏗️ Technology Stack

- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with connection pooling
- **Authentication**: JWT with refresh tokens
- **AI Integration**: Google Gemini Flash 3 API
- **Security**: Rate limiting, input validation, audit logging
- **Logging**: Winston with structured logging
- **Testing**: Jest with comprehensive test coverage

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/              # Database and environment configuration
│   │   ├── database.ts    # PostgreSQL connection and query helpers
│   │   └── environment.ts # Environment variable management
│   ├── controllers/         # API route handlers (Phase 2)
│   ├── middleware/          # Express middleware
│   │   ├── auth.middleware.ts      # JWT authentication
│   │   ├── quota.middleware.ts     # Quota management
│   │   └── validation.middleware.ts # Input validation
│   ├── models/             # Database models and business logic
│   │   ├── User.model.ts          # User management
│   │   ├── Surah.model.ts         # Quran chapters
│   │   ├── Exam.model.ts          # Testing system
│   │   ├── IstighfarSession.model.ts # Dhikr tracking
│   │   ├── QuotaPool.model.ts     # Quota management
│   │   └── AuditLog.model.ts     # Audit logging
│   ├── routes/              # API route definitions (Phase 2)
│   ├── services/            # External service integrations (Phase 2)
│   ├── types/               # TypeScript type definitions
│   │   ├── index.ts              # Core types
│   │   └── express-types.ts     # Express extensions
│   ├── utils/               # Helper utilities
│   │   ├── logger.ts             # Winston logging
│   │   ├── errors.ts             # Error handling
│   │   └── helpers.ts            # Common utilities
│   ├── app.ts               # Express application setup
│   └── server.ts            # Server startup and graceful shutdown
├── database/
│   ├── migrations/         # Database migration files
│   │   └── 001_initial_schema.sql # Complete schema
│   ├── seeds/              # Database seed data
│   │   └── surahs_data.sql # Quran chapters data
│   ├── migrate.js          # Migration runner
│   └── seed.js            # Seed data runner
├── tests/                 # Test files (Phase 2)
├── docs/                  # Documentation
│   └── API.md             # API documentation
├── .env.example          # Environment variables template
├── .eslintrc.js         # ESLint configuration
├── jest.config.js        # Jest testing configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```

## 🗄️ Database Schema

The platform uses a Constitution-compliant PostgreSQL schema with these core tables:

### Primary Tables
- **users** - User accounts, authentication, and profiles
- **quota_pool** - Free tier quota management and tracking
- **surahs** - Complete Quran chapters (114 surahs) with metadata
- **exams** - Testing system for learning and final exams
- **istighfar_sessions** - Dhikr/istighfar session tracking
- **audit_logs** - Comprehensive audit trail for all system activities

### Supporting Views
- **user_stats** - User performance metrics and statistics
- **daily_quota_usage** - Real-time quota consumption tracking

## 🔐 Security Features

- **Authentication**: JWT-based authentication with refresh tokens
- **Authorization**: Role-based access control (user, moderator, admin)
- **Rate Limiting**: Configurable rate limits per endpoint and user
- **Input Validation**: Comprehensive validation using Joi schemas
- **Quota Management**: Free tier quota tracking and enforcement
- **Audit Logging**: Complete audit trail of all user and admin actions
- **Security Headers**: Protection against common web vulnerabilities
- **SQL Injection Prevention**: Parameterized queries and input sanitization

## 🤖 AI Integration

The platform integrates with **Google Gemini Flash 3** for:
- Quran recitation evaluation
- Arabic text analysis
- Error detection and classification
- Performance scoring
- Feedback generation

## 📊 Features by Phase

### ✅ Phase 1: Foundation (Current)
- [x] Complete project structure
- [x] Database schema design and implementation
- [x] Authentication and authorization middleware
- [x] Input validation and sanitization
- [x] Error handling and logging
- [x] Database models and business logic
- [x] Security middleware (CORS, Helmet, rate limiting)
- [x] Quota management system
- [x] Audit logging system
- [x] Environment configuration management

### 🚧 Phase 2: Core Features (Next)
- [ ] User registration and authentication
- [ ] Quran data management
- [ ] AI evaluation integration
- [ ] Audio recording and processing
- [ ] Exam creation and management
- [ ] Istighfar session tracking

### 📅 Future Phases
- [ ] Frontend development (React/Next.js)
- [ ] Admin dashboard
- [ ] Payment system integration
- [ ] Advanced analytics and reporting
- [ ] Mobile application support

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn
- Git

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
   # Create PostgreSQL database
   createdb moeen_platform
   
   # Run database migrations
   npm run migrate
   
   # Load seed data (Quran chapters)
   npm run seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start at `http://localhost:3000`

### Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
npm run test          # Run test suite
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues automatically
npm run migrate       # Run database migrations
npm run seed          # Run database seeds
```

## 🔧 Configuration

### Environment Variables

Key environment variables (see `.env.example`):

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/moeen_platform

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# AI Integration
GEMINI_API_KEY=your-google-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash

# Quota Management
FREE_QUOTA_DAILY=1500
PAID_QUOTA_MULTIPLIER=10

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret
```

## 📚 API Documentation

### Base URL
- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

### Current Endpoints (Phase 1)

#### Health & Status
- `GET /health` - Application health check
- `GET /api/status` - API operational status
- `GET /api` - API documentation

### Planned Endpoints (Phase 2+)

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token

#### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/change-password` - Change password

#### Quran & Exams
- `GET /api/surahs` - List all Quran chapters
- `GET /api/surahs/:id` - Get specific chapter
- `POST /api/exams` - Create new exam
- `GET /api/exams` - List user's exams
- `POST /api/exams/:id/start` - Start exam session

#### Istighfar
- `POST /api/istighfar/sessions` - Create istighfar session
- `GET /api/istighfar/sessions` - List user's sessions
- `GET /api/istighfar/leaderboard` - Get leaderboard

#### Admin
- `GET /api/admin/users` - Manage users
- `GET /api/admin/quota` - View quota usage
- `GET /api/admin/audit-logs` - View audit logs

## 🧪 Testing

The project uses Jest for testing with the following structure:

- **Unit Tests**: Test individual functions and classes
- **Integration Tests**: Test API endpoints and database operations
- **Fixtures**: Mock data for consistent testing

Run tests with:
```bash
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
```

## 📊 Monitoring & Logging

### Logging Structure
- **General Logs**: `logs/app.log`
- **Error Logs**: `logs/error.log`
- **Audit Logs**: Database table `audit_logs`
- **Log Levels**: error, warn, info, debug

### Monitoring Endpoints
- Health checks at `/health`
- API status at `/api/status`
- Memory and performance tracking

## 🔒 Security Considerations

1. **Authentication**
   - JWT tokens with proper expiration
   - Secure password hashing with bcrypt
   - Refresh token rotation

2. **Input Validation**
   - All inputs validated using Joi schemas
   - SQL injection prevention
   - XSS protection

3. **Rate Limiting**
   - General endpoint rate limiting
   - Authentication-specific limits
   - AI API quota management

4. **Audit Trail**
   - All user actions logged
   - Admin actions tracked
   - Security events recorded

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Environment Setup
1. Set production environment variables
2. Build the application
3. Run database migrations
4. Start the production server

## 🤝 Contributing Guidelines

1. Follow the established code style
2. Write comprehensive tests for new features
3. Update documentation for API changes
4. Ensure all security measures are implemented
5. Follow the Constitution requirements

## 📄 License

© 2025 مُعين Platform. All rights reserved.

## 📞 Support

For technical support and questions:
1. Review the API documentation in `/docs/API.md`
2. Check application logs for error details
3. Verify environment configuration
4. Contact the development team through official channels

---

**مُعين Platform** - Combining tradition with technology for Quranic education.