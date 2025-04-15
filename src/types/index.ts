
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
