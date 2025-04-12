
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DepartmentSelector from "@/components/DepartmentSelector";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { FileSpreadsheet, Plus, Search, Edit, Trash, FileText } from "lucide-react";
import ExcelImport from "@/components/ExcelImport";

interface PFETopic {
  _id: string;
  topicName: string;
  studentName: string;
  studentEmail: string;
  supervisorId: string;
  supervisorName: string;
  department: string;
  status: 'pending' | 'scheduled' | 'completed';
  presentationDate?: string;
  presentationLocation?: string;
}

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  department: string;
}

const TopicManagement: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState(user?.department || "");
  const [selectedSupervisor, setSelectedSupervisor] = useState("all"); // Changed from empty string to "all"
  const [selectedStatus, setSelectedStatus] = useState("all"); // Changed from empty string to "all"
  const [topicToDelete, setTopicToDelete] = useState<PFETopic | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  
  // Fetch PFE topics with filters
  const { data: topicsResponse, isLoading } = useQuery({
    queryKey: ['pfe-topics', searchTerm, selectedDepartment, selectedSupervisor, selectedStatus],
    queryFn: async () => {
      let queryParams = new URLSearchParams();
      
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }
      
      if (selectedDepartment) {
        queryParams.append('department', selectedDepartment);
      }
      
      if (selectedSupervisor && selectedSupervisor !== "all") {
        queryParams.append('supervisorId', selectedSupervisor);
      }
      
      if (selectedStatus && selectedStatus !== "all") {
        queryParams.append('status', selectedStatus);
      }
      
      return api.get<{ success: boolean; data: PFETopic[] }>(`/topics?${queryParams.toString()}`);
    }
  });
  
  // Fetch teachers for filter
  const { data: teachersResponse } = useQuery({
    queryKey: ['teachers', selectedDepartment],
    queryFn: async () => {
      const params = selectedDepartment ? `?department=${selectedDepartment}` : '';
      return api.get<{ success: boolean; data: Teacher[] }>(`/teachers${params}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/topics/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Topic Deleted",
        description: "The PFE topic has been successfully deleted",
      });
      queryClient.invalidateQueries({ queryKey: ['pfe-topics'] });
      setTopicToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete topic",
        variant: "destructive",
      });
    }
  });

  const handleImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['pfe-topics'] });
    setImportModalOpen(false);
    toast({
      title: "Import Successful",
      description: "PFE topics have been successfully imported",
    });
  };

  const topics = topicsResponse?.data || [];
  const teachers = teachersResponse?.data || [];

  // Status badge colors
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    scheduled: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    completed: "bg-green-100 text-green-800 hover:bg-green-200",
  };

  return (
    <div className="py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-navy">PFE Topics Management</h1>
        
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setImportModalOpen(true)}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Import from Excel
          </Button>
          <Button asChild>
            <Link to="/topics/new">
              <Plus className="mr-2 h-4 w-4" />
              Add New Topic
            </Link>
          </Button>
        </div>
      </div>
      
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search topics..."
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
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Supervisor</label>
            <Select 
              value={selectedSupervisor} 
              onValueChange={setSelectedSupervisor}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Supervisors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Supervisors</SelectItem>
                {teachers.map(teacher => (
                  <SelectItem key={teacher._id} value={teacher._id || "unknown"}>
                    {teacher.firstName} {teacher.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select 
              value={selectedStatus} 
              onValueChange={setSelectedStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
      
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Topic Name</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Supervisor</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">Loading topics...</TableCell>
              </TableRow>
            ) : topics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  No topics found with the current filters
                </TableCell>
              </TableRow>
            ) : (
              topics.map((topic) => (
                <TableRow key={topic._id}>
                  <TableCell className="font-medium">{topic.topicName}</TableCell>
                  <TableCell>{topic.studentName}</TableCell>
                  <TableCell>{topic.supervisorName}</TableCell>
                  <TableCell>{topic.department}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[topic.status]}>
                      {topic.status.charAt(0).toUpperCase() + topic.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/topics/${topic._id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => setTopicToDelete(topic)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!topicToDelete} onOpenChange={(open) => !open && setTopicToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the PFE topic "{topicToDelete?.topicName}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => topicToDelete?._id && deleteMutation.mutate(topicToDelete._id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Import Modal */}
      {importModalOpen && (
        <ExcelImport 
          title="Import PFE Topics"
          endpoint="/topics/import"
          description="Import PFE topics from Excel file. The template should contain columns for topic name, student information, and supervisor details."
          successMessage="PFE topics have been successfully imported"
          errorMessage="Failed to import PFE topics"
          onSuccess={handleImportSuccess}
          templateUrl="/templates/pfe_topics_template.xlsx"
        />
      )}
    </div>
  );
};

export default TopicManagement;
