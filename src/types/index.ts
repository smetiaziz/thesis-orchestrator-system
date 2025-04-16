
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department?: string;
  profileImage?: string;
}

export type UserRole = "admin" | "teacher" | "student" | "departmentHead";

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface PFETopic {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  studentId?: string;
  teacherId?: string;
  departmentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Teacher {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  rank: string;
  course: number;
  td: number;
  tp: number;
  coefficient: number;
  numSupervisionSessions: number;
  supervisedProjects?: string[];
  juryParticipations?: string[];
}

export interface Classroom {
  id: string;
  name: string;
  building: string;
  capacity: number;
  department: string;
  hasProjector: boolean;
  hasComputers: boolean;
  notes?: string;
}

export interface Student {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  inscrNumber: string;
  email?: string;
  department: string;
  field?: string;
  subject?: string;
  supervisorId?: string;
  pfeTopicId?: string;
}
