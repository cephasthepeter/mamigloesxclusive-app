import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';

// Extend Express Request type to include auth
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        sessionId?: string;
      };
    }
  }
}

export const clerkAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Verify the session token with Clerk
      const session = await clerkClient.sessions.verifySession(token, token);
      
      if (!session || !session.userId) {
        return res.status(401).json({ message: 'Unauthorized - Invalid token' });
      }

      // Attach user info to request
      req.auth = {
        userId: session.userId,
        sessionId: session.id
      };

      next();
    } catch (verifyError) {
      console.error('Token verification error:', verifyError);
      return res.status(401).json({ message: 'Unauthorized - Token verification failed' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth?.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get user from Clerk
    const user = await clerkClient.users.getUser(req.auth.userId);

    // Check if user has admin role
    const isAdmin = user.publicMetadata?.role === 'admin' || 
                    user.privateMetadata?.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ message: 'Forbidden - Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};