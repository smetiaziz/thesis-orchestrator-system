
import { api } from './client';
import { ApiResponse } from './config';

export interface DepartmentStats {
  totalTopics: number;
  scheduledPresentations: number;
  pendingPresentations: number;
  totalTeachers: number;
  teachersWithoutAvailability: number;
  schedulingConflicts: number;
  upcomingPresentations: Array<{
    _id: string;
    topicName: string;
    studentName: string;
    date: string;
    startTime: string;
    location: string;
  }>;
}

export interface ScheduleReport {
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  topicName: string;
  studentName: string;
  department: string;
  supervisor: string;
  president: string;
  reporter: string;
  status: string;
}

export interface ParticipationReport {
  name: string;
  email: string;
  department: string;
  supervisedCount: number;
  participationCount: number;
  requiredParticipations: number;
  percentage: number;
  status: 'Under Quota' | 'Met Quota' | 'Exceeded Quota';
}

export interface TeacherStats {
  supervisedCount: number;
  juryCount: number;
  upcomingJuries: Array<{
    _id: string;
    pfeTopicId: {
      topicName: string;
      studentName: string;
    };
    date: string;
    startTime: string;
    location: string;
  }>;
}

export interface SupervisionStats {
  studentCount: number;
}

export interface AvailabilityStats {
  availabilityCount: number;
}

export const statsApi = {
  getDepartmentStats: (department: string) => 
    api.get<ApiResponse<DepartmentStats>>(`/stats/department/${encodeURIComponent(department)}`),
    
  getScheduleReport: (params?: { date?: string; department?: string }) => 
    api.get<ApiResponse<ScheduleReport[]>>('/stats/reports/schedule', params),
    
  getParticipationReport: (params?: { department?: string }) => 
    api.get<ApiResponse<ParticipationReport[]>>('/stats/reports/participation', params),
    
  // New endpoints for teacher dashboard
  getTeacherStats: () => 
    api.get<ApiResponse<TeacherStats>>('/stats/teacher'),
    
  getSupervisionStats: () => 
    api.get<ApiResponse<SupervisionStats>>('/students/supervised'),
    
  getAvailabilityStats: () => 
    api.get<ApiResponse<AvailabilityStats>>('/timeslots/my'),
};
