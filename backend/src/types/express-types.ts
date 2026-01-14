import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include user information
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    subscription_type: string;
    is_active: boolean;
    email_verified: boolean;
  };
  userId?: string;
  aiApiLimit?: number;
}

export { Request, Response, NextFunction };