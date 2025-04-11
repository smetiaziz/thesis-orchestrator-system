
export type UserRole = 'admin' | 'departmentHead' | 'teacher' | 'student';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  department?: string;
  profileImage?: string;
}

export interface PFETopic {
  id: string;
  topicName: string;
  studentName: string;
  studentEmail?: string;
  supervisorId: string;
  supervisorName: string;
  department: string;
  status: 'pending' | 'scheduled' | 'completed';
  presentationDate?: Date;
  presentationLocation?: string;
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  rank: string;
  course: number;
  td: number;
  tp: number;
  coefficient: number;
  numSupervisionSessions: number;
  email: string;
  supervisedProjects: string[]; // Array of PFETopic IDs
  juryParticipations: string[]; // Array of Jury IDs where teacher is participating
}

export interface Department {
  id: string;
  name: string;
  headId?: string; // User ID of department head
}

export interface TimeSlot {
  id: string;
  teacherId: string;
  date: Date;
  startTime: string;
  endTime: string;
}

export interface Jury {
  id: string;
  pfeTopicId: string;
  supervisorId: string;
  presidentId: string;
  reporterId: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  status: 'scheduled' | 'completed';
}
