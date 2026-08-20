import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../modules/auth/auth.types.js';
import { pool } from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header with Bearer token is required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // Check database to ensure user is not blocked
    const userRes = await pool.query('SELECT is_blocked FROM users WHERE id = $1', [decoded.id]);
    const user = userRes.rows[0];
    if (user && user.is_blocked) {
      return res.status(403).json({ error: 'Your account has been blocked by the admin.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired access token' });
  }
}
