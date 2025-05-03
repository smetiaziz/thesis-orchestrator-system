
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
import { FileSpreadsheet, Plus, Search, Edit, Trash } from "lucide-react";
import ExcelImport from "@/components/ExcelImport";

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  status: 'active' | 'inactive';
}

const TeachersList: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  
  // Fetch teachers with filters
  const { data: teachersResponse, isLoading } = useQuery({
    queryKey: ['teachers', searchTerm, selectedDepartment, selectedStatus],
    queryFn: async () => {
      console.log("selectedDepartment:",selectedDepartment);
      const params: Record<string, string> = {};
      let queryParams = new URLSearchParams();
     
      if (selectedDepartment) {
        queryParams.append('department', selectedDepartment);
      }
      
      


      // if (searchTerm) params.search = searchTerm;
      // if (selectedDepartment !== 'all') params.department = selectedDepartment;
      // if (selectedStatus !== 'all') params.status = selectedStatus;
      
      return api.get<{ success: boolean; data: Teacher[] }>(`/teachers?${queryParams.toString()}`);
     // return api.get<{ success: boolean; data: Classroom[] }>(`/classrooms?${queryParams.toString()}`);
    },
    enabled: true
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/teachers/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Teacher Deleted",
        description: "The teacher has been successfully deleted",
      });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setTeacherToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete teacher",
        variant: "destructive",
      });
    }
  });

  const handleImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['teachers'] });
    setImportModalOpen(false);
    toast({
      title: "Import Successful",
      description: "Teachers have been successfully imported",
    });
  };

  // Fix the data extraction from the response
  const teachers = teachersResponse?.data || [];

  return (
    <div className="py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-navy">Teacher Management</h1>
        
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setImportModalOpen(true)}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Import from Excel
          </Button>
          <Button asChild>
            <Link to="/admin/teachers/new">
              <Plus className="mr-2 h-4 w-4" />
              Add New Teacher
            </Link>
          </Button>
        </div>
      </div>
      
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
      
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">Loading teachers...</TableCell>
              </TableRow>
            ) : teachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  No teachers found with the current filters
                </TableCell>
              </TableRow>
            ) : (
              teachers.map((teacher) => (
                <TableRow key={teacher._id}>
                  <TableCell className="font-medium">
                    {/* Add safe checks for firstName and lastName */}
                    {(teacher.firstName || '') + ' ' + (teacher.lastName || '')}
                  </TableCell>
                  <TableCell>{teacher.email || 'No email'}</TableCell>
                  <TableCell>{teacher.department || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" 
                      className={teacher.status === 'active' ? 
                        'bg-green-100 text-green-800 hover:bg-green-200' : 
                        'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }
                    >
                      {/* Add safe check for status with default value */}
                      {teacher.status ? (teacher.status.charAt(0).toUpperCase() + teacher.status.slice(1)) : 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/admin/teachers/${teacher._id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => setTeacherToDelete(teacher)}
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
      <AlertDialog open={!!teacherToDelete} onOpenChange={(open) => !open && setTeacherToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the teacher "{teacherToDelete?.firstName || ''} {teacherToDelete?.lastName || ''}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => teacherToDelete?._id && deleteMutation.mutate(teacherToDelete._id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Import Modal */}
      {importModalOpen && (
        <ExcelImport 
          title="Import Teachers"
          endpoint="/teachers/import"
          description="Import teachers from Excel file. The template should contain columns for teacher details."
          successMessage="Teachers have been successfully imported"
          errorMessage="Failed to import teachers"
          onSuccess={handleImportSuccess}
          templateUrl="/templates/teachers_template.xlsx"
        />
      )}
    </div>
  );
};

export default TeachersList;
