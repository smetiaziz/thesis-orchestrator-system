
import { api } from './client';
import { ApiResponse } from './config';

export interface JuryData {
  pfeTopicId: string;
  supervisorId: string;
  presidentId: string;
  reporterId: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status?: 'scheduled' | 'completed' | 'canceled';
}

export interface Jury {
  _id: string;
  pfeTopicId: {
    _id: string;
    topicName: string;
    studentName: string;
    department: string;
  };
  supervisorId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  presidentId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  reporterId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status: 'scheduled' | 'completed' | 'canceled';
}

export const juriesApi = {
  getAll: (params?: { department?: string; date?: string; status?: string }) => 
    api.get<ApiResponse<Jury[]>>('/juries', params),
    
  getById: (id: string) => 
    api.get<ApiResponse<Jury>>(`/juries/${id}`),
    
  create: (data: JuryData) => 
    api.post<ApiResponse<Jury>>('/juries', data),
    
  update: (id: string, data: Partial<JuryData>) => 
    api.put<ApiResponse<Jury>>(`/juries/${id}`, data),
    
  delete: (id: string) => 
    api.delete<ApiResponse<{}>>(`/juries/${id}`),
    
  getScheduledDates: () => 
    api.get<ApiResponse<string[]>>('/juries/scheduled-dates'),
    
  getByDate: (date: string) => 
    api.get<ApiResponse<Jury[]>>(`/juries/date/${encodeURIComponent(date)}`),

  autoGenerate: (data: { department: string; date: string; startTime: string; endTime: string }) => 
    api.post<ApiResponse<Jury[]>>('/juries/auto-generate', data),
    
  updateClassroom: (id: string, data: { location: string }) => 
    api.put<ApiResponse<Jury>>(`/juries/${id}/classroom`, data)
};
