export interface WallPost {
  id: string;
  groupId: string;
  senderId: string;
  senderName?: string;
  content: string;
  createdAt: string;
  attachments: unknown[];
}

export interface WallInboxItem {
  groupId: string;
  groupName: string;
  lastPost: WallPost | null;
}

export interface ChatApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
