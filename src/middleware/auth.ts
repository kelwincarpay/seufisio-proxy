import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export function secretTokenAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ error: 'Invalid Authorization format. Expected: Bearer <token>' });
    return;
  }

  if (token !== env.API_SECRET_TOKEN) {
    res.status(403).json({ error: 'Invalid secret token' });
    return;
  }

  next();
}
