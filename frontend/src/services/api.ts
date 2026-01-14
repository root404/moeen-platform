import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { APIResponse, PaginatedResponse, User, AuthUser } from '@/types';

// Backend API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const API_TIMEOUT = 30000; // 30 seconds

// Create axios instance with default configuration
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept-Language': 'ar-SA',
  },
  withCredentials: true,
});

// Request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    // Add JWT token if available
    const token = localStorage.getItem('accessToken');
    if (token) {
      (config.headers as any)['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse<APIResponse>) => {
    // Handle successful responses
    if (response.data?.success === false) {
      throw new Error(response.data.message || 'Request failed');
    }
    return response;
  },
  (error) => {
    // Handle different types of errors
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Clear tokens and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          break;
        case 403:
          throw new Error(data?.message || 'Access denied');
        case 404:
          throw new Error(data?.message || 'Resource not found');
        case 429:
          throw new Error(data?.message || 'Too many requests');
        case 500:
          throw new Error(data?.message || 'Server error');
        default:
          throw new Error(data?.message || `Request failed with status ${status}`);
      }
    } else if (error.request) {
      throw new Error('Network error - please check your connection');
    } else {
      throw new Error(error.message || 'An unknown error occurred');
    }
  }
);

// API Service Class
export class APIService {
  // Authentication endpoints
  static async login(email: string, password: string, rememberMe: boolean = false): Promise<APIResponse<AuthUser>> {
    try {
      const response = await api.post<APIResponse<AuthUser>>('/auth/login', {
        email,
        password,
        rememberMe,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async register(userData: {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    phone?: string;
    country?: string;
    acceptTerms: boolean;
    acceptPrivacy: boolean;
  }): Promise<APIResponse<AuthUser>> {
    try {
      const response = await api.post<APIResponse<AuthUser>>('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async logout(): Promise<APIResponse<void>> {
    try {
      const response = await api.post<APIResponse<void>>('/auth/logout');
      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async refreshToken(): Promise<APIResponse<{ accessToken: string; refreshToken: string }>> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await api.post<APIResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', {
        refreshToken,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // User management
  static async getProfile(): Promise<APIResponse<User>> {
    try {
      const response = await api.get<APIResponse<User>>('/users/profile');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async updateProfile(userData: Partial<User>): Promise<APIResponse<User>> {
    try {
      const response = await api.put<APIResponse<User>>('/users/profile', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<APIResponse<void>> {
    try {
      const response = await api.put<APIResponse<void>>('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Quran data
  static async getSurahs(params?: {
    page?: number;
    limit?: number;
    search?: string;
    juz?: number;
    revelationType?: string;
  }): Promise<APIResponse<PaginatedResponse<any>>> {
    try {
      const response = await api.get<APIResponse<PaginatedResponse<any>>>('/surahs', {
        params,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getSurahById(id: number): Promise<APIResponse<any>> {
    try {
      const response = await api.get<APIResponse<any>>(`/surahs/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getVerses(surahId: number, params?: {
    page?: number;
    limit?: number;
    startVerse?: number;
    endVerse?: number;
  }): Promise<APIResponse<PaginatedResponse<any>>> {
    try {
      const response = await api.get<APIResponse<PaginatedResponse<any>>>(`/surahs/${surahId}/verses`, {
        params,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Exams
  static async createExam(examData: {
    surahId?: number;
    startVerse?: number;
    endVerse?: number;
    type: 'memorization' | 'recitation' | 'comprehensive';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    timeLimit?: number;
    maxAttempts?: number;
  }): Promise<APIResponse<any>> {
    try {
      const response = await api.post<APIResponse<any>>('/exams', examData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getExams(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  }): Promise<APIResponse<PaginatedResponse<any>>> {
    try {
      const response = await api.get<APIResponse<PaginatedResponse<any>>>('/exams', {
        params,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async startExam(examId: string): Promise<APIResponse<any>> {
    try {
      const response = await api.post<APIResponse<any>>(`/exams/${examId}/start`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async submitExam(examId: string, submissionData: {
    transcript?: string;
    audioUrl?: string;
    score?: number;
    timeTaken?: number;
  }): Promise<APIResponse<any>> {
    try {
      const response = await api.post<APIResponse<any>>(`/exams/${examId}/submit`, submissionData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async completeExam(examId: string, finalData: {
    score: number;
    transcript?: string;
    audioUrl?: string;
    timeTaken: number;
  }): Promise<APIResponse<any>> {
    try {
      const response = await api.put<APIResponse<any>>(`/exams/${examId}/complete`, finalData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // AI Evaluation
  static async evaluateRecitation(data: {
    audioData: string;
    expectedText: string;
    surahInfo: {
      number: number;
      name: string;
      ayahNumber?: number;
    };
  }): Promise<APIResponse<any>> {
    try {
      const response = await api.post<APIResponse<any>>('/ai/evaluate-recitation', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async transcribeAudio(audioData: string, options?: {
    language?: string;
    enhanceQuality?: boolean;
  }): Promise<APIResponse<any>> {
    try {
      const response = await api.post<APIResponse<any>>('/ai/transcribe-audio', {
        audioData,
        ...options,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getPronunciationFeedback(word: string, options?: {
    context?: string;
    audioData?: string;
  }): Promise<APIResponse<any>> {
    try {
      const response = await api.post<APIResponse<any>>('/ai/pronunciation-feedback', {
        word,
        ...options,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async analyzeTajweed(transcription: string, expectedText: string, options?: {
    detailedAnalysis?: boolean;
  }): Promise<APIResponse<any>> {
    try {
      const response = await api.post<APIResponse<any>>('/ai/analyze-tajweed', {
        transcription,
        expectedText,
        ...options,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getPracticeRecommendations(data: {
    userLevel: 'beginner' | 'intermediate' | 'advanced';
    recentScores: number[];
    weakAreas: string[];
    targetSurahs?: number[];
    practiceGoals?: string[];
  }): Promise<APIResponse<any>> {
    try {
      const response = await api.post<APIResponse<any>>('/ai/practice-recommendations', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getAIUsageAnalytics(params?: {
    period?: 'daily' | 'weekly' | 'monthly';
  }): Promise<APIResponse<any>> {
    try {
      const response = await api.get<APIResponse<any>>('/ai/usage-analytics', {
        params,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async checkQuota(operation: 'evaluation' | 'transcription' | 'pronunciation' | 'tajweed' | 'recommendations'): Promise<APIResponse<any>> {
    try {
      const response = await api.get<APIResponse<any>>('/ai/check-quota', {
        params: { operation },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Istighfar Sessions
  static async createIstighfarSession(sessionData: {
    targetRepetitions: number;
    sessionType: 'personal' | 'guided' | 'challenge';
    notes?: string;
  }): Promise<APIResponse<any>> {
    try {
      const response = await api.post<APIResponse<any>>('/istighfar', sessionData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getIstighfarSessions(params?: {
    page?: number;
    limit?: number;
    sessionType?: string;
  }): Promise<APIResponse<PaginatedResponse<any>>> {
    try {
      const response = await api.get<APIResponse<PaginatedResponse<any>>>('/istighfar', {
        params,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async startIstighfarSession(sessionId: string): Promise<APIResponse<any>> {
    try {
      const response = await api.post<APIResponse<any>>(`/istighfar/${sessionId}/start`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async completeIstighfarSession(sessionId: string, finalData: {
    finalDuration: number;
    finalRepetitions: number;
  }): Promise<APIResponse<any>> {
    try {
      const response = await api.put<APIResponse<any>>(`/istighfar/${sessionId}/complete`, finalData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Utility methods
  static setAuthToken(token: string, refreshToken: string): void {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refreshToken);
  }

  static getAuthToken(): { token: string | null; refreshToken: string | null } {
    return {
      token: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
    };
  }

  static clearAuth(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  static setUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  static getUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  // Health check
  static async healthCheck(): Promise<APIResponse<{ status: string; timestamp: string }>> {
    try {
      const response = await api.get<APIResponse<{ status: string; timestamp: string }>>('/health');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Generic request method
  static async request<T = any>(config: AxiosRequestConfig): Promise<APIResponse<T>> {
    try {
      const response = await api.request<APIResponse<T>>(config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Export API instance for direct use if needed
export default api;
export { api };