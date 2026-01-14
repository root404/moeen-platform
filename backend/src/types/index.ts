// Database type definitions for the مُعين platform
export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: 'user' | 'admin' | 'moderator';
  subscription_type: 'free' | 'premium';
  date_of_birth?: Date;
  country?: string;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  profile_picture_url?: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: Date;
  last_active: Date;
  updated_at: Date;
}

export interface QuotaPool {
  id: string;
  pool_date: Date;
  free_pool_remaining_calls: number;
  total_consumed: number;
  per_user_consumption_log: Record<string, any>;
  reset_time: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Surah {
  id: number;
  name_ar: string;
  name_en?: string;
  verses_count: number;
  juz_mapping: number[];
  pages_start?: number;
  pages_end?: number;
  revelation_type: 'meccan' | 'medinan';
  order_in_quran: number;
  created_at: Date;
}

export interface Exam {
  id: string;
  user_id: string;
  surah_id: number;
  exam_type: 'learning' | 'final' | 'istighfar';
  ai_evaluation_json?: Record<string, any>;
  score?: number;
  max_score: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  started_at?: Date;
  finished_at?: Date;
  duration_seconds?: number;
  attempts_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface IstighfarSession {
  session_id: string;
  user_id: string;
  duration_seconds: number;
  counted_repetitions: number;
  target_repetitions: number;
  session_type: 'personal' | 'competitive' | 'guided';
  start_time: Date;
  end_time?: Date;
  completion_rate?: number;
  notes?: string;
  created_at: Date;
}

export interface AuditLog {
  log_id: string;
  action_type: string;
  actor: string;
  target_user_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
  timestamp: Date;
  created_at: Date;
}

// Extended types for database operations
export interface UserCreateInput {
  email: string;
  password_hash: string;
  role?: 'user' | 'admin' | 'moderator';
  subscription_type?: 'free' | 'premium';
  date_of_birth?: Date;
  country?: string;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
}

export interface UserUpdateInput {
  email?: string;
  password_hash?: string;
  role?: 'user' | 'admin' | 'moderator';
  subscription_type?: 'free' | 'premium';
  date_of_birth?: Date;
  country?: string;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  profile_picture_url?: string;
  is_active?: boolean;
  email_verified?: boolean;
  last_active?: Date;
}

export interface ExamCreateInput {
  user_id: string;
  surah_id: number;
  exam_type: 'learning' | 'final' | 'istighfar';
  ai_evaluation_json?: Record<string, any>;
  score?: number;
  max_score?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  started_at?: Date;
  finished_at?: Date;
  duration_seconds?: number;
  attempts_count?: number;
}

export interface ExamUpdateInput {
  surah_id?: number;
  exam_type?: 'learning' | 'final' | 'istighfar';
  ai_evaluation_json?: Record<string, any>;
  score?: number;
  max_score?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  started_at?: Date;
  finished_at?: Date;
  duration_seconds?: number;
  attempts_count?: number;
}

export interface IstighfarSessionCreateInput {
  user_id: string;
  duration_seconds: number;
  counted_repetitions: number;
  target_repetitions?: number;
  session_type?: 'personal' | 'competitive' | 'guided';
  end_time?: Date;
  completion_rate?: number;
  notes?: string;
}

export interface AuditLogCreateInput {
  action_type: string;
  actor: string;
  target_user_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  success?: boolean;
  error_message?: string;
}

// View types
export interface UserStats {
  id: string;
  email: string;
  subscription_type: 'free' | 'premium';
  total_exams: number;
  completed_exams: number;
  average_score?: number;
  istighfar_sessions: number;
  total_istighfar_time: number;
  created_at: Date;
  last_active: Date;
}

export interface DailyQuotaUsage {
  pool_date: Date;
  free_pool_remaining_calls: number;
  total_consumed: number;
  used_calls: number;
  usage_percentage: number;
  reset_time: Date;
}

// Request/Response types for API
export interface AuthRequest extends Request {
  user?: User;
  userId?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  date_of_birth?: string;
  country?: string;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
}

export interface ExamRequest {
  surah_id: number;
  exam_type: 'learning' | 'final' | 'istighfar';
}

export interface IstighfarSessionRequest {
  target_repetitions?: number;
  session_type?: 'personal' | 'competitive' | 'guided';
  notes?: string;
}

export interface ExamResponse {
  id: string;
  user_id: string;
  surah_id: number;
  surah_name?: string;
  exam_type: string;
  score?: number;
  max_score: number;
  status: string;
  started_at?: string;
  finished_at?: string;
  duration_seconds?: number;
  attempts_count: number;
  ai_evaluation?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserResponse {
  id: string;
  email: string;
  role: string;
  subscription_type: string;
  date_of_birth?: string;
  country?: string;
  gender?: string;
  phone?: string;
  profile_picture_url?: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  last_active: string;
}

// JWT Payload types
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  subscriptionType: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  iat: number;
  exp: number;
}

// AI Evaluation types
export interface AIEvaluation {
  score: number;
  maxScore: number;
  errors: Array<{
    type: string;
    position: number;
    expected: string;
    actual: string;
    severity: 'minor' | 'major' | 'critical';
  }>;
  fluency: number;
  accuracy: number;
  confidence: number;
  feedback: string;
  passed: boolean;
}

// Quota Management types
export interface QuotaConsumption {
  userId: string;
  consumed: number;
  timestamp: Date;
  type: 'ai_call' | 'exam' | 'istighfar';
}

export interface QuotaStatus {
  isAvailable: boolean;
  remainingCalls: number;
  dailyLimit: number;
  resetTime: Date;
  userType: 'free' | 'premium';
}

// Error types
export interface APIError extends Error {
  statusCode: number;
  code?: string;
  details?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Pagination types
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// File upload types
export interface AudioUpload {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  duration?: number;
  transcript?: string;
}

// Leaderboard types
export interface LeaderboardEntry {
  userId: string;
  email: string;
  displayName?: string;
  profilePictureUrl?: string;
  totalExams: number;
  averageScore: number;
  completedExams: number;
  istighfarSessions: number;
  totalIstighfarTime: number;
  rank: number;
  isPremium: boolean;
}

export interface IstighfarLeaderboardEntry {
  userId: string;
  email: string;
  displayName?: string;
  profilePictureUrl?: string;
  totalSessions: number;
  totalRepetitions: number;
  totalTime: number;
  averageSessionLength: number;
  rank: number;
  isPremium: boolean;
}

// Statistics types
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalExams: number;
  completedExams: number;
  averageScore: number;
  quotaUsagePercentage: number;
  istighfarSessions: number;
  totalIstighfarTime: number;
}

// Export all types as a namespace for easier importing
export * from './express-types';

export default {
  User,
  QuotaPool,
  Surah,
  Exam,
  IstighfarSession,
  AuditLog,
  UserCreateInput,
  UserUpdateInput,
  ExamCreateInput,
  ExamUpdateInput,
  IstighfarSessionCreateInput,
  AuditLogCreateInput,
  UserStats,
  DailyQuotaUsage,
  AuthRequest,
  LoginRequest,
  RegisterRequest,
  ExamRequest,
  IstighfarSessionRequest,
  ExamResponse,
  UserResponse,
  JWTPayload,
  RefreshTokenPayload,
  AIEvaluation,
  QuotaConsumption,
  QuotaStatus,
  APIError,
  ValidationError,
  PaginationOptions,
  PaginatedResponse,
  AudioUpload,
  LeaderboardEntry,
  IstighfarLeaderboardEntry,
  DashboardStats,
};