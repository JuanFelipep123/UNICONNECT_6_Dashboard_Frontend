export interface AuthConfig {
  domain: string;
  clientId: string;
  audience?: string;
  connection: string;
  authSyncUrl: string;
  authSessionUrl: string;
  redirectUri: string;
}

export interface Auth0UserInfo {
  sub?: string;
  email?: string;
  name?: string;
}

export interface AuthSession {
  token: string | null;
  userId: string;
  needsOnboarding: boolean;
}

export interface AuthSyncResponse {
  token?: string;
  access_token?: string;
  userId?: string;
  user_id?: string;
  profile_id?: string;
  id?: string;
  needsOnboarding?: boolean;
  needs_onboarding?: boolean;
  data?: AuthSyncResponse;
  user?: AuthSyncResponse;
  profile?: AuthSyncResponse;
}

export interface AuthenticatedUser {
  auth0Id: string;
  email: string;
  name: string;
  userId: string;
  token: string | null;
  needsOnboarding: boolean;
}
