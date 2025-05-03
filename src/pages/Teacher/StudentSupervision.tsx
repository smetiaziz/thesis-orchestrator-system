
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Teacher, Student } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, FileSpreadsheet, Plus, Upload, UserPlus } from 'lucide-react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import ExcelImport from '@/components/ExcelImport';

// Import new API modules
import { studentsApi, teachersApi, StudentData } from '@/api';

const formSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  inscrNumber: z.string().min(1, { message: "Inscription number is required" }),
  email: z.string().email().optional().or(z.literal('')),
  field: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const StudentSupervision: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Find the corresponding Teacher record for the logged-in user
  const { data: teacherData, isLoading: teacherLoading } = useQuery({
    queryKey: ['teacher-profile', user?.id],
    queryFn: async () => {
      if (!user?.email) throw new Error('User email not available');
      const response = await teachersApi.getAll();
      return {
        data: response.data.find(t => t.email === user.email)
      };
    },
    enabled: !!user?.email,
  });

  const teacher = teacherData?.data;

  // Get supervised students
  const { data: studentsData, isLoading: studentsLoading, refetch: refetchStudents } = useQuery({
    queryKey: ['supervised-students', teacher?.id],
    queryFn: async () => {
      return studentsApi.getSupervised();
    },
    enabled: !!teacher,
  });
  
  const students = studentsData?.data || [];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      inscrNumber: '',
      email: '',
      field: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!user?.department || !teacher) {
      toast.error("Missing department or teacher information");
      return;
    }

    try {
      const studentData: StudentData = {
        ...data,
        department: user.department,
        supervisorId: teacher.id,
      };

      await studentsApi.create(studentData);
      
      toast.success("Student created successfully");
      setIsCreateDialogOpen(false);
      form.reset();
      refetchStudents();
    } catch (error) {
      toast.error("Failed to create student");
      console.error(error);
    }
  };

  if (teacherLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center">
              <AlertCircle className="mr-2" />
              Teacher Profile Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Your user account is not linked to a teacher profile. Please contact the administrator.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-navy">Student Supervision</h1>
        <div className="flex space-x-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Create a new student record that you will supervise
                </DialogDescription>
              </DialogHeader>
              
              <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="First Name" {...field} />
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
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Last Name" {...field} />
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
                          <FormLabel>Inscription Number</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 12345" {...field} />
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
                          <FormLabel>Email (Optional)</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="student@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="field"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Field of Study (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. AI, Networks, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Student</Button>
                  </DialogFooter>
                </form>
              </FormProvider>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" onClick={() => navigate('/teacher/topics/new')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            New PFE Topic
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="students" className="w-full">
        <TabsList>
          <TabsTrigger value="students">My Students</TabsTrigger>
          <TabsTrigger value="import">Import Students</TabsTrigger>
        </TabsList>
        
        <TabsContent value="students" className="space-y-4 pt-4">
          {studentsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <p className="text-muted-foreground mb-4 text-center">
                  You are not currently supervising any students.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Student
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student) => (
                <Card key={student.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      {student.firstName} {student.lastName}
                    </CardTitle>
                    <CardDescription>
                      ID: {student.inscrNumber}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4 pt-0">
                    {student.email && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {student.email}
                      </p>
                    )}
                    
                    {student.field && (
                      <p className="text-sm font-medium">
                        Field: {student.field}
                      </p>
                    )}
                    
                    {student.pfeTopicId ? (
                      <div className="mt-2 p-2 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium">
                          Topic: {(student.pfeTopicId as any)?.topicName || 'Assigned'}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-2 p-2 bg-amber-50 rounded-md">
                        <p className="text-sm text-amber-700">No PFE topic assigned yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="import" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Students</CardTitle>
              <CardDescription>
                Upload an Excel file with student data to be added to your supervision list
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExcelImport 
                title="Import Students"
                endpoint="/import/students"
                description="Upload a spreadsheet with student information. The file should include columns for firstName, lastName, inscrNumber, and optionally email and field."
                successMessage="Students imported successfully"
                errorMessage="Failed to import students"
                onSuccess={() => refetchStudents()}
                templateUrl="/templates/students_import_template.xlsx"
                sampleFormat={{
                  firstName: "John",
                  lastName: "Doe",
                  inscrNumber: "123456",
                  email: "john.doe@example.com",
                  field: "Computer Science"
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentSupervision;
