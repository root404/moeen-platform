// User-related types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscriptionType: 'free' | 'basic' | 'premium' | 'admin';
  createdAt: Date;
  lastLogin?: Date;
  profileImage?: string;
  phone?: string;
  country?: string;
  timezone?: string;
  emailVerified: boolean;
  isActive: boolean;
}

export interface AuthUser extends User {
  accessToken: string;
  refreshToken: string;
  tokenExpiresIn: number;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  country?: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

// Quran-related types
export interface Surah {
  id: number;
  number: number;
  name: string;
  englishName: string;
  arabicName: string;
  revelationType: 'mekkan' | 'medinan';
  ayahs: number;
  juz: number;
  rukus: number;
  verses: Verse[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Verse {
  id: string;
  number: number;
  arabicText: string;
  englishTranslation?: string;
  transliteration?: string;
  audioUrl?: string;
  pageNumber?: number;
  juzNumber?: number;
  surahNumber?: number;
}

// Exam-related types
export interface Exam {
  id: string;
  userId: string;
  surahId?: number;
  startVerse?: number;
  endVerse?: number;
  type: 'memorization' | 'recitation' | 'comprehensive';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeLimit?: number;
  attempts: number;
  maxAttempts: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled' | 'expired';
  score?: number;
  maxScore: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExamCreateInput {
  surahId?: number;
  startVerse?: number;
  endVerse?: number;
  type: Exam['type'];
  difficulty: Exam['difficulty'];
  timeLimit?: number;
  maxAttempts?: number;
}

export interface ExamResult {
  id: string;
  examId: string;
  userId: string;
  attempt: number;
  score: number;
  maxScore: number;
  correctAnswers: number;
  totalQuestions: number;
  timeTaken: number;
  transcript?: string;
  audioUrl?: string;
  aiFeedback?: {
    score: number;
    mistakes: Array<{
      type: 'missing' | 'extra' | 'incorrect' | 'pronunciation';
      expected: string;
      actual: string;
      position: string;
    }>;
    accuracy: {
      wordAccuracy: number;
      tajweedAccuracy: number;
      fluencyScore: number;
    };
    suggestions: string[];
  };
  createdAt: Date;
}

// Istighfar Session types
export interface IstighfarSession {
  id: string;
  userId: string;
  durationSeconds: number;
  countedRepetitions: number;
  targetRepetitions: number;
  sessionType: 'personal' | 'guided' | 'challenge';
  startTime: Date;
  endTime?: Date;
  completionRate?: number;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IstighfarSessionCreateInput {
  durationSeconds?: number;
  targetRepetitions: number;
  sessionType: IstighfarSession['sessionType'];
  startTime?: Date;
  notes?: string;
}

// AI and Audio types
export interface AudioEvaluation {
  id: string;
  userId: string;
  audioUrl: string;
  expectedText: string;
  transcription: string;
  surahInfo: {
    number: number;
    name: string;
    ayahNumber?: number;
  };
  score: number;
  feedback: string;
  mistakes: Array<{
    type: 'missing' | 'extra' | 'incorrect' | 'pronunciation';
    expected: string;
    actual: string;
    position: string;
  }>;
  accuracy: {
    wordAccuracy: number;
    tajweedAccuracy: number;
    fluencyScore: number;
  };
  suggestions: string[];
  duration: number;
  createdAt: Date;
}

export interface PracticeRecommendation {
  id: string;
  userId: string;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  recentScores: number[];
  weakAreas: string[];
  targetSurahs?: number[];
  recommendations: Array<{
    type: 'surah' | 'ayah' | 'tajweed' | 'pronunciation';
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedTime: string;
  }>;
  nextGoals: string[];
  studyPlan: Array<{
    day: number;
    focus: string;
    exercises: string[];
  }>;
  createdAt: Date;
}

// Quota types
export interface UserQuota {
  id: string;
  userId: string;
  totalQuota: number;
  usedQuota: number;
  remainingQuota: number;
  lastReset: Date;
  nextReset: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIUsage {
  id: string;
  userId: string;
  operation: 'evaluation' | 'transcription' | 'pronunciation' | 'tajweed' | 'recommendations' | 'quota_addition';
  cost: number;
  metadata?: {
    surahId?: number;
    ayahNumber?: number;
    sessionId?: string;
    duration?: number;
    success?: boolean;
    refund?: boolean;
    originalConsumptionId?: string;
    reason?: string;
    adminId?: string;
    addition?: boolean;
  };
  timestamp: Date;
  quotaBefore: number;
  quotaAfter: number;
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LeaderboardEntry {
  userId: string;
  userName?: string;
  profileImage?: string;
  totalRepetitions: number;
  totalSessions: number;
  averageCompletionRate: number;
  rank: number;
  position: number;
  score: number;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'system' | 'exam' | 'achievement' | 'social' | 'reminder';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
}

// Settings and preferences
export interface UserSettings {
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  language: 'ar' | 'en';
  notifications: {
    email: boolean;
    push: boolean;
    exam: boolean;
    achievement: boolean;
    social: boolean;
    reminder: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showProgress: boolean;
    showAchievements: boolean;
    allowFriendRequests: boolean;
  };
  audio: {
    autoPlay: boolean;
    quality: 'low' | 'medium' | 'high';
    speed: number;
  };
  display: {
    fontSize: 'small' | 'medium' | 'large' | 'extra-large';
    quranFont: 'cairo' | 'tajawal' | 'custom';
    showTranslation: boolean;
    showTransliteration: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Utility types
export interface FormFieldError {
  field: string;
  message: string;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ModalState {
  isOpen: boolean;
  title?: string;
  content?: any;
  type?: 'info' | 'warning' | 'error' | 'success';
}

// Chart and analytics types
export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface PerformanceMetrics {
  period: 'daily' | 'weekly' | 'monthly';
  data: Array<{
    date: string;
    score: number;
    accuracy: number;
    timeSpent: number;
    repetitions: number;
  }>;
  averages: {
    score: number;
    accuracy: number;
    timeSpent: number;
    repetitions: number;
  };
  trends: {
    improving: boolean;
    growthRate: number;
  };
}

export default {};