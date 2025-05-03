
import { api } from './client';
import { Department } from '@/types';
import { ApiResponse } from './config';

export interface DepartmentHead {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  departmentName: string;
}

export const departmentsApi = {
  getAll: () => 
    api.get<ApiResponse<Department[]>>('/departments'),
    
  getById: (id: string) => 
    api.get<ApiResponse<Department>>(`/departments/${id}`),
    
  create: (data: Partial<Department>) => 
    api.post<ApiResponse<Department>>('/departments', data),
    
  update: (id: string, data: Partial<Department>) => 
    api.put<ApiResponse<Department>>(`/departments/${id}`, data),
    
  delete: (id: string) => 
    api.delete<ApiResponse<{}>>(`/departments/${id}`),
    
  createDepartmentHead: (data: DepartmentHead) => 
    api.post<ApiResponse<{user: User, department: Department}>>('/departments/create-head', data),
};
