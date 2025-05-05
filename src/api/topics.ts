
import { api } from './client';
import { PFETopic } from '@/types';
import { ApiResponse } from './config';

export interface TopicData {
  topicName: string;
  topicDescription: string;
  studentName: string;
  email: string;
  inscrNumber: string;
  department: string;
  supervisorId: string;
}

export const topicsApi = {
  getAll: (params?: { department?: string; supervisorId?: string; status?: string }) => 
    api.get<ApiResponse<PFETopic[]>>('/topics', params),
    
  getById: (id: string) => 
    api.get<ApiResponse<PFETopic>>(`/topics/${id}`),
    
  create: (data: TopicData) => 
    api.post<ApiResponse<PFETopic>>('/topics', data),
    
  update: (id: string, data: Partial<TopicData>) => 
    api.put<ApiResponse<PFETopic>>(`/topics/${id}`, data),
    
  delete: (id: string) => 
    api.delete<ApiResponse<{}>>(`/topics/${id}`),

  importTopics: (formData: FormData) => {
    // We need to manually create this fetch due to FormData handling
    const token = localStorage.getItem('token');
    const API_URL = process.env.API_URL || 'http://localhost:5000/api';
    return fetch(`${API_URL}/import/topics`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }).then(res => res.json());
  }
};
