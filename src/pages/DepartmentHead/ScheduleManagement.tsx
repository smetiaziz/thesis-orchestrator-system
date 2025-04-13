import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DepartmentSelector from "@/components/DepartmentSelector";
import { Button } from "@/components/ui/button";
import { format, isSameDay } from "date-fns";
import { 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  Calendar as CalendarIcon,
  Wand2 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

interface Jury {
  _id: string;
  pfeTopicId: {
    _id: string;
    topicName: string;
    studentName: string;
    department: string;
  };
  supervisorId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  presidentId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  reporterId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status: 'scheduled' | 'completed';
}

const ScheduleManagement: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDepartment, setSelectedDepartment] = useState(user?.department || "");
  const [autoScheduleDialogOpen, setAutoScheduleDialogOpen] = useState(false);
  const [autoScheduleLoading, setAutoScheduleLoading] = useState(false);
  
  // Fetch juries for the selected date
  const { data: juriesResponse, isLoading } = useQuery({
    queryKey: ['juries', format(selectedDate, 'yyyy-MM-dd'), selectedDepartment],
    queryFn: async () => {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      let params = new URLSearchParams();
      params.append('date', formattedDate);
      
      if (selectedDepartment) {
        params.append('department', selectedDepartment);
      }
      
      return api.get<{ success: boolean; data: Jury[] }>(`/juries?${params.toString()}`);
    }
  });
  
  // Get all dates with scheduled juries
  const { data: scheduledDatesResponse } = useQuery({
    queryKey: ['jury-dates', selectedDepartment],
    queryFn: async () => {
      let params = selectedDepartment ? `?department=${selectedDepartment}` : '';
      return api.get<{ success: boolean; data: string[] }>(`/juries/scheduled-dates${params}`);
    }
  });
  
  const juries = juriesResponse?.data || [];
  const scheduledDates = scheduledDatesResponse?.data || [];

  // Auto-generate juries mutation
  const autoGenerateJuriesMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams();
      if (selectedDepartment) {
        params.append('department', selectedDepartment);
      }
      return api.post<{ success: boolean; data: any }>(`/juries/auto-generate?${params.toString()}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['juries'] });
      queryClient.invalidateQueries({ queryKey: ['jury-dates'] });
      toast({
        title: "Auto-generation successful",
        description: "Juries have been automatically scheduled based on availability",
      });
      setAutoScheduleDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Auto-generation failed",
        description: error.message || "There was an error generating the schedules",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setAutoScheduleLoading(false);
    }
  });

  const handleAutoGenerate = () => {
    setAutoScheduleLoading(true);
    autoGenerateJuriesMutation.mutate();
  };
  
  // Function to check if a date has scheduled juries
  const isScheduledDate = (date: Date) => {
    return scheduledDates.some(scheduledDate => 
      isSameDay(new Date(scheduledDate), date)
    );
  };

  // Generate export URL for current view
  const generateExportUrl = () => {
    let params = new URLSearchParams();
    params.append('date', format(selectedDate, 'yyyy-MM-dd'));
    
    if (selectedDepartment) {
      params.append('department', selectedDepartment);
    }
    
    return `/api/reports/schedule-export?${params.toString()}`;
  };

  return (
    <div className="py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-navy">Presentation Schedule</h1>
        
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={() => setAutoScheduleDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Wand2 className="h-4 w-4" />
            Auto-Generate Juries
          </Button>
          
          <Button variant="outline" asChild>
            <a href={generateExportUrl()} target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Export Schedule
            </a>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>
              Select a date to view scheduled presentations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border w-full"
              modifiers={{
                scheduled: (date) => isScheduledDate(date),
              }}
              modifiersStyles={{
                scheduled: { 
                  fontWeight: 'bold', 
                  backgroundColor: 'var(--navy-50)',
                  color: 'var(--navy)'
                }
              }}
            />
            
            <div className="mt-4">
              <DepartmentSelector
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
                placeholder="All Departments"
                label="Department"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </CardTitle>
              <CardDescription>
                {juries.length} scheduled presentations
              </CardDescription>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => {
                  const prevDay = new Date(selectedDate);
                  prevDay.setDate(prevDay.getDate() - 1);
                  setSelectedDate(prevDay);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => {
                  const nextDay = new Date(selectedDate);
                  nextDay.setDate(nextDay.getDate() + 1);
                  setSelectedDate(nextDay);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading schedule...</div>
            ) : juries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No presentations scheduled for this date
              </div>
            ) : (
              <div className="space-y-1">
                {/* Time slots from 8 AM to 6 PM */}
                {Array.from({ length: 21 }, (_, i) => {
                  const hour = Math.floor(i / 2) + 8;
                  const minute = (i % 2) * 30;
                  const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                  
                  const juriesAtTime = juries.filter(jury => 
                    jury.startTime <= timeStr && jury.endTime > timeStr
                  );
                  
                  return (
                    <div 
                      key={timeStr} 
                      className={`flex py-2 border-t ${
                        minute === 0 ? 'border-gray-200' : 'border-gray-100'
                      }`}
                    >
                      <div className="w-16 flex-shrink-0 font-medium text-muted-foreground">
                        {timeStr}
                      </div>
                      
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {juriesAtTime.map(jury => (
                          <div 
                            key={jury._id}
                            className="bg-navy-50 p-2 rounded-md border border-navy-100"
                          >
                            <div className="flex justify-between">
                              <h4 className="font-medium text-navy">
                                {jury.pfeTopicId.topicName}
                              </h4>
                              <Badge variant="outline" className="ml-2">
                                {jury.startTime} - {jury.endTime}
                              </Badge>
                            </div>
                            <p className="text-sm">
                              Student: {jury.pfeTopicId.studentName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Location: {jury.location}
                            </p>
                            <div className="mt-1 text-xs">
                              <p>
                                <span className="font-medium">Supervisor:</span> {jury.supervisorId.firstName} {jury.supervisorId.lastName}
                              </p>
                              <p>
                                <span className="font-medium">President:</span> {jury.presidentId.firstName} {jury.presidentId.lastName}
                              </p>
                              <p>
                                <span className="font-medium">Reporter:</span> {jury.reporterId.firstName} {jury.reporterId.lastName}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Auto-Generate Juries Dialog */}
      <Dialog open={autoScheduleDialogOpen} onOpenChange={setAutoScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Auto-Generate Jury Schedule</DialogTitle>
            <DialogDescription>
              This will automatically assign juries to presentations based on teacher availability and quota requirements.
              {selectedDepartment && <p className="mt-2">Department: {selectedDepartment}</p>}
            </DialogDescription>
          </DialogHeader>
          
          <p className="text-sm text-muted-foreground">
            The system will:
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Find all pending PFE topics</li>
              <li>Check teacher availability</li>
              <li>Ensure no scheduling conflicts</li>
              <li>Balance participation based on quota requirements</li>
            </ul>
          </p>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAutoScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAutoGenerate} 
              disabled={autoScheduleLoading}
            >
              {autoScheduleLoading ? "Generating..." : "Generate Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScheduleManagement;
