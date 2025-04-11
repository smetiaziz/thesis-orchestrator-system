
/**
 * API utility functions for making requests to the backend
 */

const API_URL = 'http://localhost:5000/api';

/**
 * Get the authentication token from local storage
 */
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * Common headers for API requests
 */
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

/**
 * Generic API request function
 */
export const apiRequest = async <T>(
  endpoint: string, 
  method: string = 'GET', 
  data?: any, 
  requireAuth: boolean = true
): Promise<T> => {
  const url = `${API_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: getHeaders(requireAuth),
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.error || 'Something went wrong');
  }

  return responseData;
};

// API utility methods
export const api = {
  get: <T>(endpoint: string, requireAuth: boolean = true): Promise<T> => 
    apiRequest<T>(endpoint, 'GET', undefined, requireAuth),
    
  post: <T>(endpoint: string, data: any, requireAuth: boolean = true): Promise<T> => 
    apiRequest<T>(endpoint, 'POST', data, requireAuth),
    
  put: <T>(endpoint: string, data: any, requireAuth: boolean = true): Promise<T> => 
    apiRequest<T>(endpoint, 'PUT', data, requireAuth),
    
  patch: <T>(endpoint: string, data: any, requireAuth: boolean = true): Promise<T> => 
    apiRequest<T>(endpoint, 'PATCH', data, requireAuth),
    
  delete: <T>(endpoint: string, requireAuth: boolean = true): Promise<T> => 
    apiRequest<T>(endpoint, 'DELETE', undefined, requireAuth),
};
