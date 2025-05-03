
import { api } from './client';
import { Teacher } from '@/types';
import { ApiResponse } from './config';

export interface TeacherData {
  firstName: string;
  lastName: string;
  department: string;
  rank: string;
  email: string;
  course?: number;
  td?: number;
  tp?: number;
  coefficient?: number;
  numSupervisionSessions?: number;
}

export const teachersApi = {
  getAll: (department?: string) => 
    api.get<ApiResponse<Teacher[]>>('/teachers', { department }),
    
  getById: (id: string) => 
    api.get<ApiResponse<Teacher>>(`/teachers/${id}`),
    
  create: (data: TeacherData) => 
    api.post<ApiResponse<Teacher>>('/teachers', data),
    
  update: (id: string, data: Partial<TeacherData>) => 
    api.put<ApiResponse<Teacher>>(`/teachers/${id}`, data),
    
  delete: (id: string) => 
    api.delete<ApiResponse<{}>>(`/teachers/${id}`),

  importTeachers: (formData: FormData) => {
    // We need to manually create this fetch due to FormData handling
    const token = localStorage.getItem('token');
    return fetch(`${API_URL}/import/teachers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }).then(res => res.json());
  }
};
