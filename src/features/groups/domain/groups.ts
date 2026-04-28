export interface StudyGroupSubject {
  id: string;
  name: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type StudyGroupCategory = 'ACADEMIC' | 'PROJECT' | 'SOCIAL' | 'SPORTS';

export interface UserProfileSummary {
  id: string;
  fullName: string;
  avatarUrl?: string;
}

export interface StudyGroupCreatePayload {
  name: string;
  description: string;
  subject_id: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  subject_id: string;
  subject?: StudyGroupSubject;
  category?: StudyGroupCategory;
  creator_id: string;
  created_at: string;
  updated_at?: string;
  member_count?: number;
  members?: string[];
  pendingRequests?: string[];
  is_member?: boolean;
  is_admin: boolean;
}

export interface CreateGroupResponse {
  id: string;
  name: string;
  description: string;
  subject_id: string;
  created_at: string;
  created_by: string;
}

export interface Subject {
  id: string;
  name: string;
}
