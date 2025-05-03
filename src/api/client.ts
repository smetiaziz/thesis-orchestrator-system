
import { API_URL, getHeaders, handleApiError, ApiResponse } from './config';

/**
 * Generic API request function
 */
export async function apiRequest<T>(
  endpoint: string, 
  method: string = 'GET', 
  data?: any, 
  params?: Record<string, any>
): Promise<T> {
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
    return handleApiError(error);
  }
}

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
