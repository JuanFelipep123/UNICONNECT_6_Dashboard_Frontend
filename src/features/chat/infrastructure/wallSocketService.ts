import { io, Socket } from 'socket.io-client';
import type { WallPost } from '../domain/wall';

const CHAT_SERVICE_URL =
  (import.meta.env.VITE_CHAT_SERVICE_URL as string | undefined)?.trim().replace(/\/+$/, '') ??
  'http://localhost:3004';

class WallSocketService {
  private socket: Socket | null = null;
  private readonly url: string;

  constructor(url: string) {
    this.url = url;
  }

  connect(userId: string): void {
    if (this.socket) return;

    this.socket = io(this.url, {
      auth: { 'x-user-id': userId },
      transports: ['websocket'],
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinWall(groupId: string): void {
    this.socket?.emit('wall:join', { groupId });
  }

  leaveWall(groupId: string): void {
    this.socket?.emit('wall:leave', { groupId });
  }

  onNewPost(callback: (post: WallPost) => void): void {
    this.socket?.on('wall:new_post', callback);
  }

  offNewPost(): void {
    this.socket?.off('wall:new_post');
  }
}

export const wallSocket = new WallSocketService(CHAT_SERVICE_URL);
