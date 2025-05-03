
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { juriesApi, Jury, JuryEditData } from "@/api/juries";
import { teachersApi } from "@/api/teachers";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Teacher } from "@/types";
import { useForm } from "react-hook-form";
import DepartmentSelector from "@/components/DepartmentSelector";
import { Badge } from "@/components/ui/badge";
import { Edit, RefreshCw, Trash } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const JuryManagement: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [editingJury, setEditingJury] = useState<Jury | null>(null);
  const [juryToDelete, setJuryToDelete] = useState<Jury | null>(null);
  
  const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  // Setup form for editing jury
  const form = useForm<JuryEditData>({
    defaultValues: {
      presidentId: "",
      reporterId: "",
      date: "",
      startTime: "",
      endTime: "",
      location: "",
    },
  });

  // Fetch juries for the selected date and department
  const { data: juriesResponse, isLoading: loadingJuries } = useQuery({
    queryKey: ['juries', formattedDate, selectedDepartment],
    queryFn: async () => {
      return await juriesApi.getByDate(formattedDate);
    },
    enabled: !!formattedDate && !!selectedDepartment,
  });

  // Fetch teachers for selecting jury members
  const { data: teachersResponse } = useQuery({
    queryKey: ['teachers', selectedDepartment],
    queryFn: async () => {
      return await teachersApi.getAll({ department: selectedDepartment });
    },
    enabled: !!selectedDepartment,
  });

  const updateJuryMutation = useMutation({
    mutationFn: async (data: { id: string; juryData: JuryEditData }) => {
      return await juriesApi.update(data.id, data.juryData);
    },
    onSuccess: () => {
      toast({
        title: "Jury Updated",
        description: "The jury has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['juries', formattedDate, selectedDepartment] });
      setEditingJury(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update jury",
        variant: "destructive",
      });
    },
  });

  const deleteJuryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await juriesApi.delete(id);
    },
    onSuccess: () => {
      toast({
        title: "Jury Deleted",
        description: "The jury has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['juries', formattedDate, selectedDepartment] });
      setJuryToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete jury",
        variant: "destructive",
      });
    },
  });

  const handleEditJury = (jury: Jury) => {
    setEditingJury(jury);
    form.reset({
      presidentId: jury.presidentId._id,
      reporterId: jury.reporterId._id,
      date: jury.date,
      startTime: jury.startTime,
      endTime: jury.endTime,
      location: jury.location,
      status: jury.status,
    });
  };

  const handleUpdateJury = (data: JuryEditData) => {
    if (editingJury) {
      updateJuryMutation.mutate({
        id: editingJury._id,
        juryData: data,
      });
    }
  };

  const juries = juriesResponse?.data || [];
  const teachers = teachersResponse?.data || [];

  // Function to get teacher name from ID
  const getTeacherName = (id: string): string => {
    const teacher = teachers.find(t => t.id === id);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : "Unknown";
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Jury Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Department</label>
              <DepartmentSelector
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
                placeholder="Select Department"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Date</label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="border rounded-md p-2"
              />
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Juries {selectedDate && `for ${format(selectedDate, 'MMMM d, yyyy')}`}
            </h2>
            
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['juries'] })} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {loadingJuries ? (
            <p>Loading juries...</p>
          ) : !selectedDepartment ? (
            <p>Please select a department to view juries.</p>
          ) : juries.length === 0 ? (
            <p>No juries scheduled for this date.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>President</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {juries.map((jury) => (
                  <TableRow key={jury._id}>
                    <TableCell>{jury.pfeTopicId.topicName}</TableCell>
                    <TableCell>{jury.pfeTopicId.studentName}</TableCell>
                    <TableCell>
                      {jury.supervisorId.firstName} {jury.supervisorId.lastName}
                    </TableCell>
                    <TableCell>
                      {jury.presidentId.firstName} {jury.presidentId.lastName}
                    </TableCell>
                    <TableCell>
                      {jury.reporterId.firstName} {jury.reporterId.lastName}
                    </TableCell>
                    <TableCell>
                      {jury.startTime} - {jury.endTime}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{jury.location}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditJury(jury)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setJuryToDelete(jury)}
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
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
        </Card>
      </div>

      {/* Edit Jury Dialog */}
      <Dialog open={!!editingJury} onOpenChange={(open) => !open && setEditingJury(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Jury</DialogTitle>
            <DialogDescription>
              Update the jury details for {editingJury?.pfeTopicId?.topicName}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateJury)} className="space-y-4">
              <FormField
                control={form.control}
                name="presidentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>President</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a president" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.firstName} {teacher.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reporterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reporter</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reporter" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.firstName} {teacher.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={updateJuryMutation.isPending}>
                  {updateJuryMutation.isPending ? "Updating..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!juryToDelete} onOpenChange={(open) => !open && setJuryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the jury for "{juryToDelete?.pfeTopicId?.topicName}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => juryToDelete?._id && deleteJuryMutation.mutate(juryToDelete._id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default JuryManagement;
