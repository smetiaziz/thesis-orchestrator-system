
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/api";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { FileSpreadsheet, Plus, Search, Edit, Trash, UserPlus, FileText } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import ExcelImport from "@/components/ExcelImport";
import { Student } from "@/types";

const formSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  inscrNumber: z.string().min(1, { message: "Inscription number is required" }),
  email: z.string().email({ message: "Invalid email" }).optional().or(z.literal("")),
  field: z.string().optional(),
  subject: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const StudentSupervision: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      inscrNumber: "",
      email: "",
      field: "",
      subject: "",
    },
  });
  
  // Fetch students supervised by the current teacher
  const { data: studentsResponse, isLoading } = useQuery({
    queryKey: ['supervised-students', searchTerm],
    queryFn: async () => {
      let url = '/students/supervised';
      if (searchTerm) {
        url += `?search=${encodeURIComponent(searchTerm)}`;
      }
      return api.get<{ success: boolean; data: Student[] }>(url);
    }
  });
  
  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: (data: FormValues) => {
      return api.post<{ success: boolean; data: Student }>('/students', {
        ...data,
        department: user?.department
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervised-students'] });
      setIsEditDialogOpen(false);
      form.reset();
      toast({
        title: "Student Added",
        description: "The student has been added to your supervision list",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add student",
        variant: "destructive",
      });
    }
  });
  
  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormValues }) => {
      return api.put<{ success: boolean; data: Student }>(`/students/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervised-students'] });
      setIsEditDialogOpen(false);
      setCurrentStudent(null);
      form.reset();
      toast({
        title: "Student Updated",
        description: "The student information has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update student",
        variant: "destructive",
      });
    }
  });
  
  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: (id: string) => {
      return api.delete(`/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervised-students'] });
      setStudentToDelete(null);
      toast({
        title: "Student Removed",
        description: "The student has been removed from your supervision list",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove student",
        variant: "destructive",
      });
    }
  });

  const handleImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['supervised-students'] });
    setImportModalOpen(false);
    toast({
      title: "Import Successful",
      description: "Students have been successfully imported",
    });
  };
  
  const handleEditClick = (student: Student) => {
    setCurrentStudent(student);
    form.reset({
      firstName: student.firstName,
      lastName: student.lastName,
      inscrNumber: student.inscrNumber,
      email: student.email || "",
      field: student.field || "",
      subject: student.subject || "",
    });
    setIsEditDialogOpen(true);
  };
  
  const handleAddNewClick = () => {
    setCurrentStudent(null);
    form.reset();
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student);
  };
  
  const onSubmit = (values: FormValues) => {
    if (currentStudent) {
      updateStudentMutation.mutate({ id: currentStudent.id, data: values });
    } else {
      createStudentMutation.mutate(values);
    }
  };
  
  const students = studentsResponse?.data || [];
  
  return (
    <div className="py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-navy">Student Supervision</h1>
        
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setImportModalOpen(true)}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Import Students
          </Button>
          <Button onClick={handleAddNewClick}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>
      
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students by name or inscription number..."
            className="pl-8 max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>
      
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Inscription Number</TableHead>
              <TableHead>Field</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">Loading students...</TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  No students under your supervision yet
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    {student.firstName} {student.lastName}
                  </TableCell>
                  <TableCell>{student.inscrNumber}</TableCell>
                  <TableCell>{student.field || "-"}</TableCell>
                  <TableCell>{student.subject || "-"}</TableCell>
                  <TableCell>{student.email || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(student)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleDeleteClick(student)}
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
      
      {/* Student Form Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentStudent ? "Edit Student" : "Add New Student"}
            </DialogTitle>
            <DialogDescription>
              {currentStudent
                ? "Update the student's information"
                : "Add a new student to your supervision list"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="inscrNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inscription Number*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="field"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {currentStudent ? "Save Changes" : "Add Student"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {studentToDelete?.firstName} {studentToDelete?.lastName} from your supervision list?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => studentToDelete?._id && deleteStudentMutation.mutate(studentToDelete._id)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Import Modal */}
      {importModalOpen && (
        <ExcelImport 
          title="Import Students"
          endpoint="/import/students"
          description="Import students from Excel file. The template should contain columns for: firstName, lastName, inscrNumber, subject, field"
          successMessage="Students have been successfully imported"
          errorMessage="Failed to import students"
          onSuccess={handleImportSuccess}
          templateUrl="/templates/students_template.xlsx"
        />
      )}
    </div>
  );
};

export default StudentSupervision;
