// Helper utilities for the مُعين platform
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import environment from '../config/environment';

// Password utilities
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = environment.get('bcryptRounds');
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// JWT utilities
export const generateToken = (payload: any, expiresIn?: string): string => {
  const secret = environment.get('jwtSecret');
  const options = expiresIn ? { expiresIn } : {};
  return jwt.sign(payload, secret, options);
};

export const verifyToken = (token: string): any => {
  const secret = environment.get('jwtSecret');
  return jwt.verify(token, secret);
};

export const decodeToken = (token: string): any => {
  return jwt.decode(token);
};

// String utilities
export const generateRandomString = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

export const generateUUID = (): string => {
  return crypto.randomUUID();
};

export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export const sanitizeArabic = (text: string): string => {
  // Remove HTML tags and extra whitespace
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const normalizeArabic = (text: string): string => {
  // Normalize Arabic text for comparison
  return text
    .replace(/أ/g, 'ا')
    .replace(/إ/g, 'ا')
    .replace(/آ/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ي/g, 'ى')
    .replace(/ى/g, 'ي')
    .replace(/[ًٌٍَُِّْ]/g, '') // Remove diacritics
    .trim();
};

// Date utilities
export const formatArabicDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'islamic',
    locale: 'ar-SA'
  };
  
  return date.toLocaleDateString('ar-SA', options);
};

export const getTimeDifference = (date1: Date, date2: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
} => {
  const diff = Math.abs(date2.getTime() - date1.getTime());
  
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    totalSeconds: Math.floor(diff / 1000)
  };
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const endOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

// Array utilities
export const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const removeDuplicates = <T>(array: T[], key?: keyof T): T[] => {
  if (!key) {
    return [...new Set(array)];
  }
  
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[+]?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone);
};

// File utilities
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const extension = getFileExtension(filename);
  return imageExtensions.includes(extension);
};

export const isAudioFile = (filename: string): boolean => {
  const audioExtensions = ['wav', 'mp3', 'ogg', 'm4a', 'flac', 'aac'];
  const extension = getFileExtension(filename);
  return audioExtensions.includes(extension);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Math utilities
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const roundToDecimal = (value: number, decimals: number = 2): number => {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return roundToDecimal((value / total) * 100);
};

// Arabic text utilities
export const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

export const extractAyahNumbers = (text: string): number[] => {
  const ayahRegex = /(\d+)/g;
  const matches = text.match(ayahRegex);
  return matches ? matches.map(Number) : [];
};

export const formatAyahRange = (start: number, end: number): string => {
  if (start === end) {
    return `آية ${start}`;
  }
  return `الآيات ${start}-${end}`;
};

export const getArabicNumber = (number: number): string => {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return number.toString().replace(/[0-9]/g, digit => arabicNumbers[parseInt(digit)]);
};

// Performance utilities
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Async utilities
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retry = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    
    await delay(delayMs);
    return retry(fn, retries - 1, delayMs * 2);
  }
};

// URL utilities
export const buildUrl = (baseUrl: string, path: string, params?: Record<string, any>): string => {
  const url = new URL(path, baseUrl);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  
  return url.toString();
};

export const parseUrlParams = (url: string): Record<string, string> => {
  const urlObj = new URL(url);
  const params: Record<string, string> = {};
  
  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
};

// Memory utilities
export const getMemoryUsage = (): Record<string, any> => {
  const usage = process.memoryUsage();
  return {
    rss: formatFileSize(usage.rss),
    heapTotal: formatFileSize(usage.heapTotal),
    heapUsed: formatFileSize(usage.heapUsed),
    external: formatFileSize(usage.external),
    arrayBuffers: formatFileSize(usage.arrayBuffers),
  };
};

// Environment utilities
export const isProduction = (): boolean => {
  return environment.get('isProduction');
};

export const isDevelopment = (): boolean => {
  return environment.get('isDevelopment');
};

export const isTest = (): boolean => {
  return environment.get('isTest');
};

export const requireEnv = (key: string): string => {
  const value = environment.get(key as any);
  if (!value) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
};

// Export all utilities
export default {
  // Password utilities
  hashPassword,
  comparePassword,
  
  // JWT utilities
  generateToken,
  verifyToken,
  decodeToken,
  
  // String utilities
  generateRandomString,
  generateUUID,
  slugify,
  sanitizeArabic,
  normalizeArabic,
  
  // Date utilities
  formatArabicDate,
  getTimeDifference,
  addDays,
  startOfDay,
  endOfDay,
  
  // Array utilities
  chunkArray,
  shuffleArray,
  removeDuplicates,
  
  // Validation utilities
  isValidEmail,
  isValidUUID,
  isValidPhoneNumber,
  
  // File utilities
  getFileExtension,
  isImageFile,
  isAudioFile,
  formatFileSize,
  
  // Math utilities
  clamp,
  roundToDecimal,
  calculatePercentage,
  
  // Arabic text utilities
  countWords,
  extractAyahNumbers,
  formatAyahRange,
  getArabicNumber,
  
  // Performance utilities
  debounce,
  throttle,
  
  // Async utilities
  delay,
  retry,
  
  // URL utilities
  buildUrl,
  parseUrlParams,
  
  // Memory utilities
  getMemoryUsage,
  
  // Environment utilities
  isProduction,
  isDevelopment,
  isTest,
  requireEnv,
};