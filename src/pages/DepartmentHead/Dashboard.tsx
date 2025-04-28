
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  BarChart3, Calendar, FileSpreadsheet, Users, 
  AlertTriangle, CheckCircle2, Clock, FileText 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  supervisedProjects: string[];
  juryParticipations: string[];
}

interface PFETopic {
  _id: string;
  topicName: string;
  studentName: string;
  status: 'pending' | 'scheduled' | 'completed';
}

interface DashboardStats {
  totalTopics: number;
  scheduledPresentations: number;
  pendingPresentations: number;
  totalTeachers: number;
  teachersWithoutAvailability: number;
  schedulingConflicts: number;
  upcomingPresentations: {
    _id: string;
    topicName: string;
    studentName: string;
    date: string;
    startTime: string;
    location: string;
  }[];
}

const DepartmentHeadDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['department-dashboard-stats', user?.department],
    queryFn: async () => {
      console.log('user department ', user.department)
      return api.get<{ success: boolean; data: DashboardStats }>(`/stats/department/${user?.department}`);
    },
    enabled: !!user?.department,
  });

  const { data: teachersData, isLoading: teachersLoading } = useQuery({
    queryKey: ['department-teachers', user?.department],
    queryFn: async () => {
      return api.get<{ success: boolean; data: Teacher[] }>(`/teachers?department=${user?.department}`);
    },
    enabled: !!user?.department,
  });

  const stats = statsData?.data || {
    totalTopics: 0,
    scheduledPresentations: 0,
    pendingPresentations: 0,
    totalTeachers: 0,
    teachersWithoutAvailability: 0,
    schedulingConflicts: 0,
    upcomingPresentations: []
  };

  const teachers = teachersData?.data || [];

  // Calculate teachers who haven't met their participation quota
  const teachersWithQuotaIssues = teachers.filter(teacher => {
    const supervisionCount = teacher.supervisedProjects.length;
    const requiredParticipations = supervisionCount * 3;
    const actualParticipations = teacher.juryParticipations.length;
    return actualParticipations < requiredParticipations;
  });

  if (statsError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load dashboard data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  const progressPercentage = stats.totalTopics 
    ? Math.round((stats.scheduledPresentations / stats.totalTopics) * 100)
    : 0;

  return (
    <div className="py-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-navy">
          Department Dashboard: {user?.department}
        </h1>
        
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <Link to="/topics/import">
              <FileText className="mr-2 h-4 w-4" />
              Import Topics
            </Link>
          </Button>
          <Button asChild>
            <Link to="/topics/new">
              <FileText className="mr-2 h-4 w-4" />
              Add Topic
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <FileSpreadsheet className="mr-2 text-navy h-5 w-5" />
              Total Topics 
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold">{stats.totalTopics}</div>
                <p className="text-sm text-muted-foreground">
                  {stats.scheduledPresentations} scheduled, {stats.pendingPresentations} pending
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="mr-2 text-navy h-5 w-5" />
              Presentations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold">{stats.scheduledPresentations}</div>
                <p className="text-sm text-muted-foreground">
                  {stats.pendingPresentations} still need scheduling
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="mr-2 text-navy h-5 w-5" />
              Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teachersLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold">{stats.totalTeachers}</div>
                <p className="text-sm text-muted-foreground">
                  {teachersWithQuotaIssues.length} with quota issues
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BarChart3 className="mr-2 text-navy h-5 w-5" />
              Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <>
                <div className="text-3xl font-bold">
                  {progressPercentage}%
                </div>
                <Progress value={progressPercentage} className="h-2 mt-2" />
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Presentations</CardTitle>
            <CardDescription>
              Next scheduled presentations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : stats.upcomingPresentations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No upcoming presentations scheduled
              </div>
            ) : (
              <div className="space-y-4">
                {stats.upcomingPresentations.map((presentation) => (
                  <div key={presentation._id} className="flex items-start p-3 rounded-lg bg-gray-50 border">
                    <Clock className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-medium">{presentation.topicName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {presentation.studentName} - {new Date(presentation.date).toLocaleDateString()} at {presentation.startTime}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {presentation.location}
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
            <CardTitle>Alerts</CardTitle>
            <CardDescription>
              Items needing your attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {stats.teachersWithoutAvailability > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="text-sm font-medium">
                      Availability Missing
                    </AlertTitle>
                    <AlertDescription className="text-sm">
                      {stats.teachersWithoutAvailability} teachers haven't submitted their availability
                    </AlertDescription>
                  </Alert>
                )}
                
                {stats.schedulingConflicts > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="text-sm font-medium">
                      Scheduling Conflicts
                    </AlertTitle>
                    <AlertDescription className="text-sm">
                      {stats.schedulingConflicts} scheduling conflicts detected
                    </AlertDescription>
                  </Alert>
                )}
                
                {stats.pendingPresentations > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="text-sm font-medium">
                      Pending Topics
                    </AlertTitle>
                    <AlertDescription className="text-sm">
                      {stats.pendingPresentations} topics still need to be scheduled
                    </AlertDescription>
                  </Alert>
                )}
                
                {teachersWithQuotaIssues.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="text-sm font-medium">
                      Participation Quotas
                    </AlertTitle>
                    <AlertDescription className="text-sm">
                      {teachersWithQuotaIssues.length} teachers haven't met their jury participation quota
                    </AlertDescription>
                  </Alert>
                )}
                
                {stats.teachersWithoutAvailability === 0 && 
                 stats.schedulingConflicts === 0 && 
                 stats.pendingPresentations === 0 &&
                 teachersWithQuotaIssues.length === 0 && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle className="text-sm font-medium">
                      All Good
                    </AlertTitle>
                    <AlertDescription className="text-sm">
                      No immediate issues to address
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DepartmentHeadDashboard;
