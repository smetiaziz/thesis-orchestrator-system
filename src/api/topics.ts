
import { api } from './client';
import { PFETopic } from '@/types';
import { ApiResponse } from './config';

export interface TopicData {
  topicName: string;
  studentName: string;
  supervisorId: string;
  department: string;
  description?: string;
  keywords?: string[];
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
    const token = localStorage.getItem('token');
    return fetch(`${API_URL}/import/topics`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }).then(res => res.json());
  }
};
