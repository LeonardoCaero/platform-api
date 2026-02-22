import { Router } from 'express';
import type { Request, Response } from 'express';
import { verifyAccessToken } from '@/common/utils/jwt.util';
import { sseManager } from '@/common/services/sse.manager';

const router = Router();

/**
 * GET /api/sse
 * Establishes a Server-Sent Events connection for the authenticated user.
 * Token must be passed as a query param because the browser EventSource
 * API does not support custom headers.
 */
router.get('/', (req: Request, res: Response) => {
  const token = req.query.token as string | undefined;

  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  let payload: { userId: string; email: string };
  try {
    payload = verifyAccessToken(token);
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
    return;
  }

  const { userId } = payload;

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
  res.flushHeaders();

  // Register this connection
  sseManager.addClient(userId, res);

  // Send initial "connected" event
  res.write(`event: connected\ndata: ${JSON.stringify({ userId })}\n\n`);

  // Heartbeat every 25 seconds to keep the connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 25_000);

  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    sseManager.removeClient(userId, res);
  });
});

export default router;
