-- =============================================
-- مُعين Platform Database Schema
-- Constitution-compliant table definitions
-- =============================================

-- Drop tables if they exist (for development)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS istighfar_sessions CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS quota_pool CASCADE;
DROP TABLE IF EXISTS surahs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table - Core user management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    subscription_type VARCHAR(20) DEFAULT 'free' CHECK (subscription_type IN ('free', 'premium')),
    date_of_birth DATE,
    country VARCHAR(100),
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),
    phone VARCHAR(20),
    profile_picture_url TEXT,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Quota Pool Table - Critical for free tier management
CREATE TABLE quota_pool (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_date DATE UNIQUE NOT NULL,
    free_pool_remaining_calls INTEGER DEFAULT 1500,
    total_consumed INTEGER DEFAULT 0,
    per_user_consumption_log JSONB,
    reset_time TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Surahs Table - Quran chapters data
CREATE TABLE surahs (
    id INTEGER PRIMARY KEY,
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    verses_count INTEGER NOT NULL,
    juz_mapping JSONB,
    pages_start INTEGER,
    pages_end INTEGER,
    revelation_type VARCHAR(20) CHECK (revelation_type IN ('meccan', 'medinan')),
    order_in_quran INTEGER UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Exams Table - Testing and evaluation system
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    surah_id INTEGER NOT NULL REFERENCES surahs(id),
    exam_type VARCHAR(20) NOT NULL CHECK (exam_type IN ('learning', 'final', 'istighfar')),
    ai_evaluation_json JSONB,
    score DECIMAL(5,2),
    max_score DECIMAL(5,2) DEFAULT 100.00,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    attempts_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Istighfar Sessions Table - Dhikr tracking
CREATE TABLE istighfar_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    duration_seconds INTEGER NOT NULL,
    counted_repetitions INTEGER NOT NULL,
    target_repetitions INTEGER DEFAULT 120,
    session_type VARCHAR(20) DEFAULT 'personal' CHECK (session_type IN ('personal', 'competitive', 'guided')),
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    completion_rate DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Audit Logs Table - System activity tracking
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type VARCHAR(50) NOT NULL,
    actor VARCHAR(255) NOT NULL,
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Indexes for Performance Optimization
-- =============================================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_type ON users(subscription_type);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_active ON users(last_active);

-- Quota pool indexes
CREATE INDEX idx_quota_pool_date ON quota_pool(pool_date);
CREATE INDEX idx_quota_pool_remaining ON quota_pool(free_pool_remaining_calls);

-- Surahs table indexes
CREATE INDEX idx_surahs_order ON surahs(order_in_quran);
CREATE INDEX idx_surahs_name_ar ON surahs(name_ar);

-- Exams table indexes
CREATE INDEX idx_exams_user_id ON exams(user_id);
CREATE INDEX idx_exams_surah_id ON exams(surah_id);
CREATE INDEX idx_exams_type ON exams(exam_type);
CREATE INDEX idx_exams_status ON exams(status);
CREATE INDEX idx_exams_created_at ON exams(created_at);
CREATE INDEX idx_exams_score ON exams(score);

-- Istighfar sessions indexes
CREATE INDEX idx_istighfar_user_id ON istighfar_sessions(user_id);
CREATE INDEX idx_istighfar_duration ON istighfar_sessions(duration_seconds);
CREATE INDEX idx_istighfar_created_at ON istighfar_sessions(created_at);

-- Audit logs indexes
CREATE INDEX idx_audit_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_actor ON audit_logs(actor);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_target_user ON audit_logs(target_user_id);

-- =============================================
-- Constraints and Triggers
-- =============================================

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quota_pool_updated_at BEFORE UPDATE ON quota_pool
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Quota pool reset trigger (daily at midnight)
CREATE OR REPLACE FUNCTION reset_quota_pool()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.pool_date != OLD.pool_date THEN
        NEW.free_pool_remaining_calls = 1500;
        NEW.total_consumed = 0;
        NEW.per_user_consumption_log = '{}';
        NEW.reset_time = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER quota_pool_daily_reset BEFORE UPDATE ON quota_pool
    FOR EACH ROW EXECUTE FUNCTION reset_quota_pool();

-- =============================================
-- Initial Data
-- =============================================

-- Insert initial quota pool entry
INSERT INTO quota_pool (pool_date, free_pool_remaining_calls, total_consumed) 
VALUES (CURRENT_DATE, 1500, 0);

-- Sample Surahs data (can be expanded with complete Quran data)
INSERT INTO surahs (id, name_ar, name_en, verses_count, order_in_quran, revelation_type, pages_start, pages_end) VALUES
(1, 'الفاتحة', 'Al-Fatihah', 7, 1, 'meccan', 1, 1),
(2, 'البقرة', 'Al-Baqarah', 286, 2, 'medinan', 2, 49),
(3, 'آل عمران', 'Aal-E-Imran', 200, 3, 'medinan', 50, 76),
(4, 'النساء', 'An-Nisa', 176, 4, 'medinan', 77, 106),
(5, 'المائدة', 'Al-Maidah', 120, 5, 'medinan', 107, 127);

-- =============================================
-- Views for Common Queries
-- =============================================

-- User statistics view
CREATE VIEW user_stats AS
SELECT 
    u.id,
    u.email,
    u.subscription_type,
    COUNT(DISTINCT e.id) as total_exams,
    COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.id END) as completed_exams,
    AVG(e.score) as average_score,
    COUNT(DISTINCT i.session_id) as istighfar_sessions,
    SUM(i.duration_seconds) as total_istighfar_time,
    u.created_at,
    u.last_active
FROM users u
LEFT JOIN exams e ON u.id = e.user_id
LEFT JOIN istighfar_sessions i ON u.id = i.user_id
GROUP BY u.id, u.email, u.subscription_type, u.created_at, u.last_active;

-- Daily quota usage view
CREATE VIEW daily_quota_usage AS
SELECT 
    qp.pool_date,
    qp.free_pool_remaining_calls,
    qp.total_consumed,
    (1500 - qp.free_pool_remaining_calls) as used_calls,
    ROUND(((1500 - qp.free_pool_remaining_calls) / 1500.0) * 100, 2) as usage_percentage,
    qp.reset_time
FROM quota_pool qp;

-- =============================================
-- Security and Performance Notes
-- =============================================

-- 1. All user passwords should be hashed using bcrypt before storage
-- 2. Audio files should be stored temporarily and deleted after processing
-- 3. AI API calls should be logged in audit_logs for quota tracking
-- 4. Consider implementing row-level security for multi-tenant scenarios
-- 5. Regular vacuum and analyze operations recommended for PostgreSQL
-- 6. Consider partitioning large tables (audit_logs, istighfar_sessions) by date

-- =============================================
-- Sample Queries for Common Operations
-- =============================================

-- Get user quota usage
-- SELECT used_calls, usage_percentage FROM daily_quota_usage WHERE pool_date = CURRENT_DATE;

-- Get user exam history
-- SELECT * FROM exams WHERE user_id = $1 ORDER BY created_at DESC;

-- Get istighfar leaderboard
-- SELECT u.email, COUNT(i.session_id) as sessions, SUM(i.duration_seconds) as total_time
-- FROM users u JOIN istighfar_sessions i ON u.id = i.user_id
-- GROUP BY u.id, u.email ORDER BY sessions DESC;

-- Track AI quota consumption
-- INSERT INTO audit_logs (action_type, actor, details) 
-- VALUES ('ai_api_call', $1, json_build_object('consumed_quota', 1));