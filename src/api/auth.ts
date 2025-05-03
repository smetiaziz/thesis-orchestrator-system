
import { api } from './client';
import { User } from '@/types';

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: string;
  department?: string;
}

export const authApi = {
  login: (data: LoginData) => 
    api.post<AuthResponse>('/auth/login', data),
    
  register: (data: RegisterData) => 
    api.post<AuthResponse>('/auth/register', data),
    
  getMe: () => 
    api.get<{ success: boolean; data: User }>('/auth/me'),
};
