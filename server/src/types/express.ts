import { Request } from 'express';
import { IUser } from '../models/User.js';

/**
 * Extend Express Request to include authenticated user data
 */
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userId?: string;
      role?: 'user' | 'admin';
      clerkId?: string;
      isAuthenticated?: boolean;
    }
  }
}

export interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
  role?: 'user' | 'admin';
  clerkId?: string;
  isAuthenticated?: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  skip?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
  statusCode: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  details?: any;
}
