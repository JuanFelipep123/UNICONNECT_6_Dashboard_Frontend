const DEFAULT_API_PORT = '3000';
const DEFAULT_API_PATH = '/api';

const normalizeUrl = (value: string) => value.trim().replace(/\/+$/, '');

export function getApiBaseUrl(): string {
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (envBaseUrl && envBaseUrl.trim().length > 0) {
    return normalizeUrl(envBaseUrl);
  }

  const backendPublicUrl = import.meta.env.VITE_BACKEND_PUBLIC_URL;
  if (backendPublicUrl && backendPublicUrl.trim().length > 0) {
    return normalizeUrl(backendPublicUrl);
  }

  return `http://localhost:${DEFAULT_API_PORT}${DEFAULT_API_PATH}`;
}

export const API_BASE_URL = getApiBaseUrl();
