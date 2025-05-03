
/**
 * API configuration
 */

export const API_URL = 'http://localhost:5000/api';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  error?: string;
}

export interface ApiErrorResponse {
  success: boolean;
  error: string;
}

export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const getHeaders = (includeAuth = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

export const handleApiError = (error: any): never => {
  console.error('API Error:', error);
  throw error;
};
