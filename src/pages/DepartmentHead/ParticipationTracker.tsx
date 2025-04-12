
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DepartmentSelector from "@/components/DepartmentSelector";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, AlertTriangle, CheckCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  rank: string;
  supervisedProjects: string[];
  juryParticipations: string[];
}

interface ParticipationStats {
  supervisedCount: number;
  participationCount: number;
  requiredParticipations: number;
  percentage: number;
  status: 'under' | 'met' | 'over';
}

const ParticipationTracker: React.FC = () => {
  const { user } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState(user?.department || "");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch teachers data
  const { data: teachersResponse, isLoading } = useQuery({
    queryKey: ['teacher-participation', selectedDepartment, searchTerm],
    queryFn: async () => {
      let queryParams = new URLSearchParams();
      
      if (selectedDepartment) {
        queryParams.append('department', selectedDepartment);
      }
      
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }
      
      return api.get<{ success: boolean; data: Teacher[] }>(`/teachers?${queryParams.toString()}`);
    }
  });

  const teachers = teachersResponse?.data || [];

  // Calculate participation statistics for a teacher
  const calculateStats = (teacher: Teacher): ParticipationStats => {
    const supervisedCount = teacher.supervisedProjects.length;
    const participationCount = teacher.juryParticipations.length;
    const requiredParticipations = Math.max(supervisedCount * 3, 0); // At least 0
    
    const percentage = requiredParticipations 
      ? Math.round((participationCount / requiredParticipations) * 100) 
      : 100; // If no requirements, consider 100%
    
    let status: 'under' | 'met' | 'over';
    if (percentage < 100) {
      status = 'under';
    } else if (percentage === 100) {
      status = 'met';
    } else {
      status = 'over';
    }
    
    return {
      supervisedCount,
      participationCount,
      requiredParticipations,
      percentage,
      status,
    };
  };

  // Generate export URL for reports
  const generateExportUrl = () => {
    let queryParams = new URLSearchParams();
    
    if (selectedDepartment) {
      queryParams.append('department', selectedDepartment);
    }
    
    return `/api/reports/participation-export?${queryParams.toString()}`;
  };

  // Sort teachers by participation percentage (ascending)
  const sortedTeachers = [...teachers].sort((a, b) => {
    const statsA = calculateStats(a);
    const statsB = calculateStats(b);
    return statsA.percentage - statsB.percentage;
  });

  return (
    <div className="py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-navy">Teacher Participation Tracker</h1>
        
        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <a href={generateExportUrl()} target="_blank" rel="noopener noreferrer">
              <FileText className="mr-2 h-4 w-4" />
              Export Report
            </a>
          </Button>
        </div>
      </div>
      
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teachers..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <DepartmentSelector
            value={selectedDepartment}
            onValueChange={setSelectedDepartment}
            placeholder="All Departments"
            label="Department"
          />
        </div>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Teacher Participation Statistics</CardTitle>
          <CardDescription>
            Each teacher must participate in 3× the number of projects they supervise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Supervised</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">Loading teachers...</TableCell>
                </TableRow>
              ) : sortedTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    No teachers found with the current filters
                  </TableCell>
                </TableRow>
              ) : (
                sortedTeachers.map((teacher) => {
                  const stats = calculateStats(teacher);
                  
                  return (
                    <TableRow key={teacher._id}>
                      <TableCell className="font-medium">
                        {teacher.firstName} {teacher.lastName}
                      </TableCell>
                      <TableCell>{teacher.department}</TableCell>
                      <TableCell>{stats.supervisedCount}</TableCell>
                      <TableCell>{stats.requiredParticipations}</TableCell>
                      <TableCell>{stats.participationCount}</TableCell>
                      <TableCell>
                        {stats.status === 'under' ? (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Under Quota
                          </Badge>
                        ) : stats.status === 'met' ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Met Quota
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Exceeded
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={Math.min(stats.percentage, 100)}
                            className="h-2"
                            indicator={stats.status === 'under' ? 'bg-yellow-500' : 'bg-green-500'}
                          />
                          <span className="text-sm font-medium w-12">
                            {stats.percentage}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Participation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Below Quota</h3>
              <div className="text-3xl font-bold">
                {sortedTeachers.filter(t => calculateStats(t).status === 'under').length}
              </div>
              <p className="text-sm text-muted-foreground">
                Teachers needing more participation
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Met Quota</h3>
              <div className="text-3xl font-bold">
                {sortedTeachers.filter(t => calculateStats(t).status === 'met').length}
              </div>
              <p className="text-sm text-muted-foreground">
                Teachers with exact participation
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Exceeded Quota</h3>
              <div className="text-3xl font-bold">
                {sortedTeachers.filter(t => calculateStats(t).status === 'over').length}
              </div>
              <p className="text-sm text-muted-foreground">
                Teachers with extra participation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParticipationTracker;
