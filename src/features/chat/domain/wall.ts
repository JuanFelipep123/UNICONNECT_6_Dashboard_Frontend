export interface WallAttachment {
  id?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
}

export interface WallPost {
  id: string;
  groupId: string;
  senderId: string;
  senderName?: string;
  avatarUrl?: string;
  content: string;
  createdAt: string;
  attachments: WallAttachment[];
}

export interface WallInboxItem {
  groupId: string;
  groupName: string;
  lastPost: WallPost | null;
}

export interface PendingAttachment {
  localId: string;
  file: File;
  uploading: boolean;
  storagePath?: string;
  error?: string;
}

export interface ChatApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
