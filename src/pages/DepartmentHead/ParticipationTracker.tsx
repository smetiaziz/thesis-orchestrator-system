import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
}

interface Jury {
  _id: string;
  pfeTopicId: string;
  supervisorId: string;
  presidentId: string;
  reporterId: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status: string;
}

interface ParticipationStats {
  supervisedCount: number;
  presidentCount: number;
  reporterCount: number;
  participationCount: number;
  requiredParticipations: number;
  percentage: number;
  status: 'under' | 'met' | 'over';
}

const ParticipationTracker: React.FC = () => {
  const { user } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch teachers list
  const { data: teachersRes, isLoading: loadingTeachers } = useQuery({
    queryKey: ['teachers', selectedDepartment],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedDepartment) params.append('department', selectedDepartment);
      return api.get<{ success: boolean; data: Teacher[] }>(
        `/teachers?${params.toString()}`
      );
    },
  });

  // Fetch juries (participation records)
  const { data: juriesRes, isLoading: loadingJuries } = useQuery({
    queryKey: ['juries', selectedDepartment],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedDepartment && selectedDepartment !== "all") params.append('department', selectedDepartment);
      params.append('forParticipation', 'true');
      return api.get<{ success: boolean; data: Jury[] }>(
        `/juries?${params.toString()}`
      );
    },
  });

  const teachers = teachersRes?.data || [];
  const juries = juriesRes?.data || [];

  // Calculate stats for each teacher
  const calculateStats = (teacher: Teacher): ParticipationStats => {
    const supervisedCount = juries.filter(j => j.supervisorId === teacher._id).length;
    const presidentCount = juries.filter(j => j.presidentId === teacher._id).length;
    const reporterCount = juries.filter(j => j.reporterId === teacher._id).length;
    const participationCount = supervisedCount + presidentCount + reporterCount;

    const requiredParticipations = supervisedCount * 3;
    const pct = requiredParticipations > 0 
      ? Math.round((participationCount / requiredParticipations) * 100) 
      : 100;

    let status: ParticipationStats['status'] = 'met';
    if (pct < 100) status = 'under';
    else if (pct > 100) status = 'over';

    return {
      supervisedCount,
      presidentCount,
      reporterCount,
      participationCount,
      requiredParticipations,
      percentage: pct,
      status,
    };
  };

  // Export URL
  const generateExportUrl = () => {
    const params = new URLSearchParams();
    if (selectedDepartment) params.append('department', selectedDepartment);
    return `/api/reports/participation-export?${params.toString()}`;
  };

  // Filtering and sorting
  const filtered = teachers.filter((t) =>
    `${t.firstName} ${t.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );
  const sorted = [...filtered].sort((a, b) =>
    calculateStats(a).percentage - calculateStats(b).percentage
  );

  const isLoading = loadingTeachers || loadingJuries;

  return (
    <div className="py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-navy">
          Teacher Participation Tracker
        </h1>
        <Button variant="outline" asChild>
          <a href={generateExportUrl()} target="_blank" rel="noopener noreferrer">
            <FileText className="mr-2 h-4 w-4" /> Export Report
          </a>
        </Button>
      </div>

      {/* Filters */}
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

      {/* Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Teacher Participation Statistics</CardTitle>
          <CardDescription>
            3× the number of supervision sessions = required participations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Dept</TableHead>
                <TableHead>Supervised</TableHead>
                <TableHead>President</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-6">
                    Loading data...
                  </TableCell>
                </TableRow>
              ) : sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-6">
                    No teachers found
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((teacher) => {
                  const stats = calculateStats(teacher);
                  return (
                    <TableRow key={teacher._id}>
                      <TableCell className="font-medium">
                        {teacher.firstName} {teacher.lastName}
                      </TableCell>
                      <TableCell>{teacher.department}</TableCell>
                      <TableCell>{stats.supervisedCount}</TableCell>
                      <TableCell>{stats.presidentCount}</TableCell>
                      <TableCell>{stats.reporterCount}</TableCell>
                      <TableCell>{stats.participationCount}</TableCell>
                      <TableCell>{stats.requiredParticipations}</TableCell>
                      <TableCell>
                        {stats.status === 'under' ? (
                          <Badge variant="outline">
                            <AlertTriangle className="mr-1 h-3 w-3" /> Under
                          </Badge>
                        ) : stats.status === 'met' ? (
                          <Badge variant="outline">
                            <CheckCircle className="mr-1 h-3 w-3" /> Met
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <CheckCircle className="mr-1 h-3 w-3" /> Exceeded
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={Math.min(stats.percentage, 100)}
                            className="h-2"
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

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Participation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Below Quota</h3>
              <div className="text-3xl font-bold">
                {sorted.filter((t) => calculateStats(t).status === 'under').length}
              </div>
              <p className="text-sm text-muted-foreground">
                Teachers needing more participation
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Met Quota</h3>
              <div className="text-3xl font-bold">
                {sorted.filter((t) => calculateStats(t).status === 'met').length}
              </div>
              <p className="text-sm text-muted-foreground">
                Teachers with exact participation
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Exceeded Quota</h3>
              <div className="text-3xl font-bold">
                {sorted.filter((t) => calculateStats(t).status === 'over').length}
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