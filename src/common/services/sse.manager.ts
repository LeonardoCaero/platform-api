import type { Response } from 'express';

interface SSEClient {
  res: Response;
  userId: string;
}

class SSEManager {
  private clients: Map<string, Set<Response>> = new Map();

  addClient(userId: string, res: Response): void {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(res);
  }

  removeClient(userId: string, res: Response): void {
    const connections = this.clients.get(userId);
    if (!connections) return;
    connections.delete(res);
    if (connections.size === 0) {
      this.clients.delete(userId);
    }
  }

  sendToUser(userId: string, event: string, data: unknown): void {
    const connections = this.clients.get(userId);
    if (!connections || connections.size === 0) return;

    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of connections) {
      try {
        res.write(payload);
      } catch {
        // Connection broken — will be cleaned up on 'close' event
      }
    }
  }

  sendToUsers(userIds: string[], event: string, data: unknown): void {
    for (const userId of userIds) {
      this.sendToUser(userId, event, data);
    }
  }

  connectedCount(): number {
    let total = 0;
    for (const set of this.clients.values()) total += set.size;
    return total;
  }
}

export const sseManager = new SSEManager();
