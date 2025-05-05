
import { api } from './client';
import { Student } from '@/types';
import { ApiResponse } from './config';

export interface StudentData {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  inscrNumber: string;
  field: string;
  supervisorId?: string;
}

export const studentsApi = {
  getAll: (params?: { department?: string; supervisorId?: string }) => 
    api.get<ApiResponse<Student[]>>('/students', params),
    
  getById: (id: string) => 
    api.get<ApiResponse<Student>>(`/students/${id}`),
    
  create: (data: StudentData) => 
    api.post<ApiResponse<Student>>('/students', data),
    
  update: (id: string, data: Partial<StudentData>) => 
    api.put<ApiResponse<Student>>(`/students/${id}`, data),
    
  delete: (id: string) => 
    api.delete<ApiResponse<{}>>(`/students/${id}`),

  importStudents: (formData: FormData) => {
    // We need to manually create this fetch due to FormData handling
    const token = localStorage.getItem('token');
    const API_URL = process.env.API_URL || 'http://localhost:5000/api';
    return fetch(`${API_URL}/import/students`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }).then(res => res.json());
  }
};
