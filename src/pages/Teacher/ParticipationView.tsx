
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar, CheckCircle2, XCircle, Info } from "lucide-react";

const ParticipationView: React.FC = () => {
  // Fetch teacher participation data
  const { data: participationData, isLoading } = useQuery({
    queryKey: ['teacher-participation'],
    queryFn: async () => {
      return api.get<{ 
        success: boolean; 
        data: {
          supervisedProjects: {
            _id: string;
            topicName: string;
            studentName: string;
            status: string;
          }[];
          juryParticipations: {
            _id: string;
            pfeTopicId: {
              topicName: string;
              studentName: string;
            };
            role: 'supervisor' | 'president' | 'reporter';
            date: string;
            status: 'scheduled' | 'completed';
          }[];
          participationStats: {
            totalSupervised: number;
            totalExpectedParticipations: number;
            totalActualParticipations: number;
            participationRatio: number;
          };
        }
      }>('/stats/teacher/participation');
    }
  });
  
  const data = participationData?.data || {
    supervisedProjects: [],
    juryParticipations: [],
    participationStats: {
      totalSupervised: 0,
      totalExpectedParticipations: 0,
      totalActualParticipations: 0,
      participationRatio: 0
    }
  };
  
  const stats = data.participationStats;
  const progressPercentage = stats.totalExpectedParticipations > 0 
    ? Math.min(100, Math.round((stats.totalActualParticipations / stats.totalExpectedParticipations) * 100))
    : 100;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case 'scheduled':
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      default:
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    }
  };
  
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'supervisor':
        return "Supervisor";
      case 'president':
        return "President";
      case 'reporter':
        return "Reporter";
      default:
        return role;
    }
  };

  return (
    <div className="py-6 space-y-6">
      <h1 className="text-2xl font-bold text-navy">Participation Tracker</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Participation Summary</CardTitle>
            <CardDescription>
              Your jury participation statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Participation Progress</span>
                <span className="text-sm font-medium">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-sm text-muted-foreground">Topics Supervised</p>
                <p className="text-2xl font-bold">{stats.totalSupervised}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Total Participations</p>
                <p className="text-2xl font-bold">{stats.totalActualParticipations}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Expected</p>
                <p className="text-2xl font-bold">{stats.totalExpectedParticipations}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Participation Ratio</p>
                <p className="text-2xl font-bold">{stats.participationRatio.toFixed(2)}x</p>
              </div>
            </div>
            
            {progressPercentage < 100 ? (
              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Participation Needed</AlertTitle>
                <AlertDescription>
                  You need {stats.totalExpectedParticipations - stats.totalActualParticipations} more jury participations to meet your quota.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="mt-4 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Quota Met</AlertTitle>
                <AlertDescription className="text-green-700">
                  You have met your participation quota. Thank you for your contribution!
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Supervised Projects</CardTitle>
            <CardDescription>
              Projects you are supervising
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : data.supervisedProjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                You are not supervising any projects yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Topic</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.supervisedProjects.map((project) => (
                    <TableRow key={project._id}>
                      <TableCell className="font-medium">{project.topicName}</TableCell>
                      <TableCell>{project.studentName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(project.status)}>
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Jury Participations</CardTitle>
          <CardDescription>
            All the juries where you are participating
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : data.juryParticipations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              You haven't been assigned to any juries yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.juryParticipations.map((jury) => (
                  <TableRow key={jury._id}>
                    <TableCell className="font-medium">{jury.pfeTopicId.topicName}</TableCell>
                    <TableCell>{jury.pfeTopicId.studentName}</TableCell>
                    <TableCell>{getRoleLabel(jury.role)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        {new Date(jury.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(jury.status)}>
                        {jury.status === "completed" ? "Completed" : "Scheduled"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ParticipationView;
