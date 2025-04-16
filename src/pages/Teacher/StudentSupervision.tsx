
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  AlertCircle,
  FileUp,
  Plus,
  Search,
  Trash,
  FileEdit,
  File,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExcelImport from "@/components/ExcelImport";
import { Textarea } from "@/components/ui/textarea";

interface Student {
  id?: string;
  _id?: string;
  firstName: string;
  lastName: string;
  inscrNumber: string;
  email?: string;
  department?: string;
  field?: string;
  subject?: string;
  supervisorId?: string;
}

const StudentSupervision: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [newStudentDialogOpen, setNewStudentDialogOpen] = useState(false);
  const [editStudentDialogOpen, setEditStudentDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<Student>({
    firstName: "",
    lastName: "",
    inscrNumber: "",
    email: "",
    field: "",
    subject: "",
  });

  // Fetch students supervised by the current teacher
  const { data: studentsResponse, isLoading } = useQuery({
    queryKey: ['supervised-students'],
    queryFn: async () => {
      return api.get<{ success: boolean; data: Student[] }>('/students/supervised');
    },
    enabled: !!user,
  });

  const students = studentsResponse?.data?.data || [];

  const filteredStudents = students.filter(student => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    return fullName.includes(searchLower) || 
           (student.inscrNumber && student.inscrNumber.toLowerCase().includes(searchLower)) ||
           (student.email && student.email.toLowerCase().includes(searchLower));
  });

  // Add student mutation
  const addStudentMutation = useMutation({
    mutationFn: (student: Student) => {
      return api.post('/students', student);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervised-students'] });
      toast({
        title: "Student added",
        description: "The student has been successfully added to your supervision.",
      });
      setNewStudentDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add student",
        description: error.message || "There was an error adding the student.",
        variant: "destructive",
      });
    },
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: (student: Student) => {
      return api.put(`/students/${student.id || student._id}`, student);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervised-students'] });
      toast({
        title: "Student updated",
        description: "The student information has been successfully updated.",
      });
      setEditStudentDialogOpen(false);
      setSelectedStudent(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update student",
        description: error.message || "There was an error updating the student information.",
        variant: "destructive",
      });
    },
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: (studentId: string) => {
      return api.delete(`/students/${studentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervised-students'] });
      toast({
        title: "Student removed",
        description: "The student has been removed from your supervision.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove student",
        description: error.message || "There was an error removing the student.",
        variant: "destructive",
      });
    },
  });

  // Import students mutation
  const importStudentsMutation = useMutation({
    mutationFn: (formData: FormData) => {
      return api.post('/import/students', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['supervised-students'] });
      toast({
        title: "Students imported",
        description: `${response.data.data.length} students have been successfully imported.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message || "There was an error importing students.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    addStudentMutation.mutate(formData);
  };

  const handleUpdateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudent) {
      updateStudentMutation.mutate(formData);
    }
  };

  const handleDeleteStudent = (studentId: string) => {
    if (confirm("Are you sure you want to remove this student from your supervision?")) {
      deleteStudentMutation.mutate(studentId);
    }
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      ...student,
      id: student._id || student.id,
    });
    setEditStudentDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      inscrNumber: "",
      email: "",
      field: "",
      subject: "",
    });
  };

  const handleFileUpload = (formData: FormData) => {
    importStudentsMutation.mutate(formData);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-navy">Student Supervision</h1>
        <div className="flex gap-2">
          <Dialog open={newStudentDialogOpen} onOpenChange={setNewStudentDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Enter the student's information to add them to your supervision.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddStudent}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inscrNumber">Inscription Number</Label>
                    <Input
                      id="inscrNumber"
                      name="inscrNumber"
                      value={formData.inscrNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="field">Field of Study (Optional)</Label>
                    <Input
                      id="field"
                      name="field"
                      value={formData.field}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject (Optional)</Label>
                    <Textarea
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setNewStudentDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Student</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            className="pl-10"
            placeholder="Search students by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Student List</TabsTrigger>
          <TabsTrigger value="import">Import Students</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Supervised Students</CardTitle>
              <CardDescription>
                Manage the students under your supervision. You can add, edit, or remove students.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading students...</div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No students match your search" : "No students under your supervision yet"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Inscription Number</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student._id || student.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{student.firstName} {student.lastName}</div>
                            <div className="text-sm text-muted-foreground">{student.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{student.inscrNumber}</TableCell>
                        <TableCell>{student.field || "-"}</TableCell>
                        <TableCell>
                          <div className="max-w-[250px] truncate">
                            {student.subject || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditStudent(student)}
                            >
                              <FileEdit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteStudent(student._id || student.id || "")}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Import Students</CardTitle>
              <CardDescription>
                Upload an Excel file with student data to import multiple students at once.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExcelImport
                onFileUpload={handleFileUpload}
                acceptedFileTypes={".xlsx,.xls"}
                uploadEndpoint="/import/students"
                requiredColumns={["firstName", "lastName", "inscrNumber"]}
                optionalColumns={["email", "field", "subject"]}
                sampleFormat={{
                  firstName: "John",
                  lastName: "Doe",
                  inscrNumber: "123456",
                  email: "john.doe@example.com",
                  field: "Computer Science",
                  subject: "Machine Learning Algorithms",
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Student Dialog */}
      <Dialog open={editStudentDialogOpen} onOpenChange={setEditStudentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student Information</DialogTitle>
            <DialogDescription>
              Update the student's information below.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateStudent}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inscrNumber">Inscription Number</Label>
                <Input
                  id="inscrNumber"
                  name="inscrNumber"
                  value={formData.inscrNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="field">Field of Study (Optional)</Label>
                <Input
                  id="field"
                  name="field"
                  value={formData.field || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject (Optional)</Label>
                <Textarea
                  id="subject"
                  name="subject"
                  value={formData.subject || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditStudentDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Student</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentSupervision;
