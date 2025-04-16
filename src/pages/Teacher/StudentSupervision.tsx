
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Plus, Upload, Trash, FileText, Search } from 'lucide-react';
import ExcelImport from '@/components/ExcelImport';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  inscNum: string;
  email: string;
  subject: string;
  field: string;
  supervisor: string;
}

// Define the student form schema
const studentFormSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  inscNum: z.string().min(2, 'Inscription number is required'),
  email: z.string().email('Valid email is required'),
  subject: z.string().min(2, 'Subject is required'),
  field: z.string().optional(),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

const StudentSupervision: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Fetch students supervised by the current teacher
  const { data: studentsResponse, isLoading } = useQuery({
    queryKey: ['supervised-students', user?._id, searchTerm],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (searchTerm) params.search = searchTerm;
      if (user?._id) params.supervisor = user._id;
      
      return api.get<{ success: boolean; data: Student[] }>('/students/supervised', { params });
    },
    enabled: !!user?._id,
  });

  // Add student mutation
  const addStudentMutation = useMutation({
    mutationFn: async (data: StudentFormValues) => {
      return api.post('/students', {
        ...data,
        supervisor: user?._id,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Student added successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['supervised-students'] });
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add student',
        variant: 'destructive',
      });
    },
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/students/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Student deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['supervised-students'] });
      setStudentToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete student',
        variant: 'destructive',
      });
    },
  });

  // Handle file upload for import
  const handleFileUpload = async (formData: FormData) => {
    try {
      const response = await api.post('/students/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data && response.data.success) {
        toast({
          title: 'Import Successful',
          description: `${response.data.data.length} students imported successfully`,
        });
        queryClient.invalidateQueries({ queryKey: ['supervised-students'] });
        setIsImportDialogOpen(false);
      } else {
        toast({
          title: 'Import Failed',
          description: 'Failed to import students',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Import Error',
        description: 'Error occurred during import',
        variant: 'destructive',
      });
    }
  };

  // Create form for adding students
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      inscNum: '',
      email: '',
      subject: '',
      field: '',
    },
  });

  const students = studentsResponse?.data || [];

  const onSubmit = (data: StudentFormValues) => {
    addStudentMutation.mutate(data);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Student Supervision</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import from Excel
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supervised Students</CardTitle>
          <CardDescription>
            Students assigned to you for supervision
          </CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Inscription #</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Field</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Loading students...
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No supervised students found.
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell>
                      {student.firstName} {student.lastName}
                    </TableCell>
                    <TableCell>{student.inscNum}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.subject}</TableCell>
                    <TableCell>{student.field || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setStudentToDelete(student)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Student Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>
              Add a new student to your supervision list.
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
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First name" {...field} />
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
                        <Input placeholder="Last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="inscNum"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inscription Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Inscription number" {...field} />
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
                      <Input placeholder="Email" type="email" {...field} />
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
                      <Input placeholder="PFE Subject" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="field"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Field of study" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Student</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!studentToDelete}
        onOpenChange={(open) => !open && setStudentToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {studentToDelete?.firstName}{' '}
              {studentToDelete?.lastName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStudentToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                studentToDelete?._id &&
                deleteStudentMutation.mutate(studentToDelete._id)
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      {isImportDialogOpen && (
        <ExcelImport
          title="Import Students"
          endpoint="/students/import"
          description="Import students from Excel file. Please make sure the file includes columns for firstName, lastName, inscNum, subject, and field."
          successMessage="Students imported successfully"
          errorMessage="Failed to import students"
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['supervised-students'] });
            setIsImportDialogOpen(false);
          }}
          templateUrl="/templates/students_template.xlsx"
          requiredColumns={["firstName", "lastName", "inscNum", "subject"]}
          optionalColumns={["field", "email"]}
          sampleFormat={{
            firstName: "John",
            lastName: "Doe",
            inscNum: "12345",
            email: "john@example.com",
            subject: "AI Implementation",
            field: "Computer Science"
          }}
        />
      )}
    </div>
  );
};

export default StudentSupervision;
