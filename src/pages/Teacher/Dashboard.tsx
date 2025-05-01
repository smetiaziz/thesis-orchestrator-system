
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, FileText, ClipboardList, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface TeacherStatsResponse {
  success: boolean;
  data: {
    supervisedCount: number;
    juryCount: number;
    upcomingJuries: UpcomingJury[];
  }
}

interface UpcomingJury {
  _id: string;
  pfeTopicId: {
    topicName: string;
    studentName: string;
  };
  date: string;
  startTime: string;
  location: string;
}

interface StudentsResponse {
  success: boolean;
  count: number;
  data: any[];
}

interface AvailabilityResponse {
  success: boolean;
  count: number;
  data: any[];
}

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Fetch teacher data including supervision and jury counts
  const { data: teacherData, isLoading: teacherLoading } = useQuery<TeacherStatsResponse>({
    queryKey: ['teacher-stats'],
    queryFn: async () => {
      return api.get<TeacherStatsResponse>('/stats/teacher');
    }
  });
  
  // Fetch supervised students count
  const { data: studentsData, isLoading: studentsLoading } = useQuery<StudentsResponse>({
    queryKey: ['supervised-students-count'],
    queryFn: async () => {
      return api.get<StudentsResponse>('/students/supervised');
    }
  });
  
  // Fetch available time slots count
  const { data: availabilityData, isLoading: availabilityLoading } = useQuery<AvailabilityResponse>({
    queryKey: ['availability-count'],
    queryFn: async () => {
      return api.get<AvailabilityResponse>('/timeslots/my');
    }
  });
  
  const stats = teacherData?.data || {
    supervisedCount: 0,
    juryCount: 0,
    upcomingJuries: []
  };
  
  const supervisedCount = stats.supervisedCount;
  const juryCount = stats.juryCount;
  const studentCount = studentsData?.count || 0;
  const availabilityCount = availabilityData?.count || 0;
  
  return (
    <div className="py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.firstName} {user?.lastName}</p>
        </div>
        
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <Link to="/teacher/availability">
              <Calendar className="mr-2 h-4 w-4" /> 
              Manage Availability
            </Link>
          </Button>
          <Button asChild>
            <Link to="/teacher/student-supervision">
              <Users className="mr-2 h-4 w-4" />
              Student Supervision
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <FileText className="mr-2 text-navy h-5 w-5" />
              PFE Topics Supervised
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teacherLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold">{supervisedCount}</div>
                <p className="text-sm text-muted-foreground">
                  Topics you are supervising
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <ClipboardList className="mr-2 text-navy h-5 w-5" />
              Jury Participations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teacherLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold">{juryCount}</div>
                <p className="text-sm text-muted-foreground">
                  Juries you're part of
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="mr-2 text-navy h-5 w-5" />
              Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold">{studentCount}</div>
                <p className="text-sm text-muted-foreground">
                  Students under supervision
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Clock className="mr-2 text-navy h-5 w-5" />
              Time Slots
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availabilityLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold">{availabilityCount}</div>
                <p className="text-sm text-muted-foreground">
                  Available time slots
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Presentations</CardTitle>
            <CardDescription>
              Your upcoming jury participations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {teacherLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : stats.upcomingJuries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No upcoming presentations scheduled
              </div>
            ) : (
              <div className="space-y-4">
                {stats.upcomingJuries.map((jury) => (
                  <div key={jury._id} className="flex items-start p-3 rounded-lg bg-gray-50 border">
                    <Clock className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-medium">{jury.pfeTopicId.topicName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {jury.pfeTopicId.studentName} - {new Date(jury.date).toLocaleDateString()} at {jury.startTime}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {jury.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
            <CardDescription>
              Frequently used tools and actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/teacher/schedule">
                <Calendar className="mr-2 h-4 w-4" />
                View Schedule
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/teacher/participation">
                <ClipboardList className="mr-2 h-4 w-4" />
                Participation Tracker
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/teacher/student-supervision">
                <Users className="mr-2 h-4 w-4" />
                Student Management
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/profile">
                <FileText className="mr-2 h-4 w-4" />
                My Profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherDashboard;
