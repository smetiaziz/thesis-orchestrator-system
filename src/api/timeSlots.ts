
import { api } from './client';
import { ApiResponse } from './config';

export interface TimeSlot {
  _id: string;
  teacherId: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface TimeSlotData {
  teacherId: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface BulkTimeSlotData {
  teacherId: string;
  slots: {
    date: string;
    startTime: string;
    endTime: string;
  }[];
}

export const timeSlotsApi = {
  getAll: (params?: { teacherId?: string; date?: string; startDate?: string; endDate?: string }) => 
    api.get<ApiResponse<TimeSlot[]>>('/timeslots', params),
    
  create: (data: TimeSlotData) => 
    api.post<ApiResponse<TimeSlot>>('/timeslots', data),
    
  bulkCreate: (data: BulkTimeSlotData) => 
    api.post<ApiResponse<TimeSlot[]>>('/timeslots/bulk', data),
    
  update: (id: string, data: Partial<TimeSlotData>) => 
    api.put<ApiResponse<TimeSlot>>(`/timeslots/${id}`, data),
    
  delete: (id: string) => 
    api.delete<ApiResponse<{}>>(`/timeslots/${id}`)
};
