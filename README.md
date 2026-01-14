# مُعين (Moeen) Platform

## Arabic Quran Memorization Platform with AI Evaluation

### Constitution-Compliant Implementation

This platform is designed as a comprehensive digital institution for Quran memorization, evaluation, and certification using advanced AI technology.

### Key Features
- **AI-Powered Evaluation**: Gemini Flash 3 for accurate recitation assessment
- **Quota Management**: Free tier with daily limits and premium options
- **Arabic RTL Interface**: Mobile-first responsive design
- **Comprehensive Testing**: Learning and final exam modes
- **Istighfar Module**: Dedicated dhikr tracking with leaderboard
- **Admin Dashboard**: Complete user and system management

### Technology Stack
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Render-ready)
- **Frontend**: Next.js + React + TypeScript
- **AI**: Google Gemini Flash 3 API
- **Authentication**: JWT with refresh tokens

### Project Structure
```
moeinv1/
├── backend/                 # Node.js + Express API
├── frontend/               # Next.js React app (Phase 6+)
├── shared/                # Shared types and utilities
└── docs/                 # Documentation
```

### Database Schema
The platform uses a Constitution-compliant database schema with the following core tables:
- `users` - User management and authentication
- `quota_pool` - Free tier quota management
- `surahs` - Quran chapters data
- `exams` - Testing and evaluation system
- `istighfar_sessions` - Dhikr tracking
- `audit_logs` - System activity monitoring

### Getting Started

#### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

#### Installation
1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies: `npm install`
4. Set up environment variables from `.env.example`
5. Create and migrate the database
6. Start the development server: `npm run dev`

### Security & Compliance
- Password hashing with bcrypt
- JWT-based authentication
- Audio file privacy (temporary storage)
- Comprehensive audit logging
- Rate limiting and quota management

### Deployment
The platform is designed for Render deployment with easy migration to VPS providers like Hostinger.

### License
© 2025 مُعين Platform. All rights reserved.