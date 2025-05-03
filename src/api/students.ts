
import { api } from './client';
import { Student } from '@/types';
import { ApiResponse } from './config';

export interface StudentData {
  firstName: string;
  lastName: string;
  inscrNumber: string;
  department: string;
  email?: string;
  field?: string;
  supervisorId?: string;
  pfeTopicId?: string;
}

export const studentsApi = {
  getAll: (params?: { department?: string; supervisorId?: string; field?: string }) => 
    api.get<ApiResponse<Student[]>>('/students', params),
    
  getById: (id: string) => 
    api.get<ApiResponse<Student>>(`/students/${id}`),
    
  create: (data: StudentData) => 
    api.post<ApiResponse<Student>>('/students', data),
    
  update: (id: string, data: Partial<StudentData>) => 
    api.put<ApiResponse<Student>>(`/students/${id}`, data),
    
  delete: (id: string) => 
    api.delete<ApiResponse<{}>>(`/students/${id}`),
    
  getSupervised: () => 
    api.get<ApiResponse<Student[]>>('/students/supervised'),

  importStudents: (formData: FormData) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_URL}/import/students`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }).then(res => res.json());
  }
};
