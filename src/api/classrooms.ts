
import { api } from './client';
import { Classroom } from '@/types';
import { ApiResponse } from './config';

export interface ClassroomData {
  name: string;
  building: string;
  capacity: number;
  department: string;
  hasProjector?: boolean;
  hasComputers?: boolean;
  notes?: string;
}

export const classroomsApi = {
  getAll: (params?: { department?: string; building?: string; minCapacity?: number }) => 
    api.get<ApiResponse<Classroom[]>>('/classrooms', params),
    
  getById: (id: string) => 
    api.get<ApiResponse<Classroom>>(`/classrooms/${id}`),
    
  create: (data: ClassroomData) => 
    api.post<ApiResponse<Classroom>>('/classrooms', data),
    
  update: (id: string, data: Partial<ClassroomData>) => 
    api.put<ApiResponse<Classroom>>(`/classrooms/${id}`, data),
    
  delete: (id: string) => 
    api.delete<ApiResponse<{}>>(`/classrooms/${id}`),
    
  getBuildings: (department?: string) => 
    api.get<ApiResponse<string[]>>('/classrooms/buildings', { department })
};
