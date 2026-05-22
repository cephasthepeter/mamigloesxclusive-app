import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role?: string;
      };
    }
  }
}

// Protect routes - require authentication
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }

    const token = authHeader.substring(7);

    try {
      const session = await clerkClient.sessions.verifySession(token, token);
      
      if (!session || !session.userId) {
        return res.status(401).json({ message: 'Unauthorized - Invalid token' });
      }

      // Get user details
      const user = await clerkClient.users.getUser(session.userId);

      // Attach user info to request
      req.user = {
        id: session.userId,
        role: (user.publicMetadata?.role as string) || (user.privateMetadata?.role as string) || 'user'
      };

      next();
    } catch (verifyError) {
      return res.status(401).json({ message: 'Unauthorized - Token verification failed' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Authorize specific roles
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role || 'user')) {
      return res.status(403).json({ 
        message: `User role '${req.user.role}' is not authorized to access this route` 
      });
    }

    next();
  };
};