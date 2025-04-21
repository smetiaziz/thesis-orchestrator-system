
/**
 * API utility functions for making requests to the backend
 */

// Define response types for better TypeScript support
export interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    department?: string;
    profileImage?: string;
  };
}

export interface ApiErrorResponse {
  success: boolean;
  error: string;
}

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
  params?: Record<string, any>
): Promise<T> => {
  let url = `${API_URL}${endpoint}`;
  
  // Handle query parameters
  if (params && Object.keys(params).length > 0) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    url = `${url}?${queryParams.toString()}`;
  }

  const options: RequestInit = {
    method,
    headers: getHeaders(true),
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Something went wrong');
    }

    return responseData as T;
  } catch (error) {
    console.error(`API Error (${method} ${endpoint}):`, error);
    throw error;
  }
};

// API utility methods
export const api = {
  get: <T>(endpoint: string, params?: Record<string, any>): Promise<T> => 
    apiRequest<T>(endpoint, 'GET', undefined, params),
    
  post: <T>(endpoint: string, data: any, params?: Record<string, any>): Promise<T> => 
    apiRequest<T>(endpoint, 'POST', data, params),
    
  put: <T>(endpoint: string, data: any, params?: Record<string, any>): Promise<T> => 
    apiRequest<T>(endpoint, 'PUT', data, params),
    
  patch: <T>(endpoint: string, data: any, params?: Record<string, any>): Promise<T> => 
    apiRequest<T>(endpoint, 'PATCH', data, params),
    
  delete: <T>(endpoint: string, params?: Record<string, any>): Promise<T> => 
    apiRequest<T>(endpoint, 'DELETE', undefined, params),
};
