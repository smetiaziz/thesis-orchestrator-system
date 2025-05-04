
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { juriesApi, Jury } from "@/api/juries";
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
import { Calendar, MapPin, User, Clock, Plus, Search, Edit, Trash } from "lucide-react";
import { format } from "date-fns";

const JuryAssignment: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [juryToDelete, setJuryToDelete] = useState<Jury | null>(null);
  
  // Fetch juries with filters
  const { data: juriesResponse, isLoading } = useQuery({
    queryKey: ['juries', searchTerm, selectedDepartment, selectedDate, selectedStatus],
    queryFn: async () => {
      const params: any = {};
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      if (selectedDepartment) {
        params.department = selectedDepartment;
      }
      
      if (selectedDate && selectedDate !== "all") {
        params.date = selectedDate;
      }
      
      if (selectedStatus && selectedStatus !== "all") {
        params.status = selectedStatus;
      }
      
      return juriesApi.getAll(params);
    }
  });
  
  // Fetch scheduled dates for filter
  const { data: scheduledDatesResponse } = useQuery({
    queryKey: ['jury-scheduled-dates'],
    queryFn: async () => juriesApi.getScheduledDates()
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return juriesApi.delete(id);
    },
    onSuccess: () => {
      toast({
        title: "Jury Deleted",
        description: "The jury has been successfully deleted",
      });
      queryClient.invalidateQueries({ queryKey: ['juries'] });
      setJuryToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete jury",
        variant: "destructive",
      });
    }
  });

  const juries = juriesResponse?.data || [];
  const scheduledDates = scheduledDatesResponse?.data || [];

  // Status badge colors
  const statusColors = {
    scheduled: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    completed: "bg-green-100 text-green-800 hover:bg-green-200",
    canceled: "bg-red-100 text-red-800 hover:bg-red-200",
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-600">Jury Assignment</h1>
        
        <div className="flex gap-4">
          <Button asChild>
            <Link to="/schedule">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule View
            </Link>
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Assign New Jury
          </Button>
        </div>
      </div>
      
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search topic or student name..."
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
            <label className="text-sm font-medium">Date</label>
            <Select 
              value={selectedDate} 
              onValueChange={setSelectedDate}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                {scheduledDates.map((date: string) => (
                  <SelectItem key={date} value={date}>
                    {formatDate(date)}
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
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
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
              <TableHead>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>President</span>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>Reporter</span>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Date</span>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Time</span>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>Location</span>
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-6">Loading juries...</TableCell>
              </TableRow>
            ) : juries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-6">
                  No juries found with the current filters
                </TableCell>
              </TableRow>
            ) : (
              juries.map((jury) => (
                <TableRow key={jury._id}>
                  <TableCell className="font-medium">{jury.pfeTopicId.topicName}</TableCell>
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
                  <TableCell>{formatDate(jury.date)}</TableCell>
                  <TableCell>{jury.startTime} - {jury.endTime}</TableCell>
                  <TableCell>{jury.location}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[jury.status]}>
                      {jury.status.charAt(0).toUpperCase() + jury.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/juries/${jury._id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => setJuryToDelete(jury)}
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
      <AlertDialog open={!!juryToDelete} onOpenChange={(open) => !open && setJuryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the jury for "{juryToDelete?.pfeTopicId.topicName}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => juryToDelete?._id && deleteMutation.mutate(juryToDelete._id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default JuryAssignment;
