import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { toast } from '@/components/ui/use-toast';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import DepartmentSelector from '@/components/DepartmentSelector';

interface Classroom {
  _id: string;
  name: string;
  building: string;
  capacity: number;
}

interface Jury {
  _id: string;
  topic?: {
    _id: string;
    topicName: string;
    studentName: string;
  };
  presentationDate?: string;
  presentationLocation?: string;
  members: string[];
}

interface AutoGenerateResponse {
  success: boolean;
  data: {
    total: number;
    scheduled: number;
    failed: number;
    errors: string[];
  };
}

const ScheduleManagement: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDepartment, setSelectedDepartment] = useState(user?.department || "");
  const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  
  // Fetch juries with presentations on the selected date
  const { data: juriesResponse, isLoading: loadingJuries, refetch: refetchJuries } = useQuery({
    queryKey: ['juries', formattedDate],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Jury[] }>(`/juries/date/${formattedDate}`);
      return response;
    },
    enabled: !!formattedDate,
  });
  
  // Fetch available classrooms
  const { data: classroomsResponse, isLoading: loadingClassrooms } = useQuery({
    queryKey: ['classrooms'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Classroom[] }>('/classrooms');
      return response;
    },
  });

  const autoGenerateMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<AutoGenerateResponse>(
        '/juries/auto-generate',
        { department: selectedDepartment || "computer science" }
      );
      return response.data;
    },
    onSuccess: (response) => {
      const { total, scheduled, failed, errors } = response;
      if (scheduled > 0) {
        toast({
          title: "Schedule Generated",
          description: `Successfully scheduled ${scheduled} out of ${total} presentations. ${failed > 0 ? `Failed: ${failed}` : ''}`,
          variant: failed > 0 ? "destructive" : "default",
        });
        refetchJuries();
      } else {
        toast({
          title: "No Presentations Scheduled",
          description: "Could not schedule any presentations. Please check teacher availability and classroom assignments.",
          variant: "destructive",
        });
      }
      errors.forEach(error => {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate schedule. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleAutoGenerate = () => {
    autoGenerateMutation.mutate();
  };
  
  const handleSetClassroom = async (juryId: string, classroomName: string) => {
    try {
      await api.put(`/juries/${juryId}/classroom`, { classroom: classroomName, date: formattedDate });
      toast({
        title: "Success",
        description: "Classroom assigned successfully",
      });
      refetchJuries();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign classroom",
        variant: "destructive",
      });
    }
  };
  
  const juries = juriesResponse?.data || [];
  const classrooms = classroomsResponse?.data || [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Presentation Schedule</h1>
        <div className="flex gap-2 items-center">
          <div className="w-64">
            <DepartmentSelector
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
              placeholder="Select Department"
            />
          </div>
          <Button
            onClick={handleAutoGenerate}
            disabled={autoGenerateMutation.isPending}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${autoGenerateMutation.isPending ? 'animate-spin' : ''}`} />
            Auto-Generate Schedule
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Select Date</h2>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="border rounded-md"
          />
        </Card>
        
        <Card className="lg:col-span-2 p-4">
          <h2 className="text-lg font-semibold mb-4">
            Presentations on {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
          </h2>
          
          {loadingJuries ? (
            <p>Loading schedule...</p>
          ) : juries.length === 0 ? (
            <p>No presentations scheduled for this date.</p>
          ) : (
            <div className="space-y-4">
              {juries.map(jury => (
                <Card key={jury._id} className="p-4">
                  <h3 className="font-medium">{jury.topic?.topicName || 'No Topic Name'}</h3>
                  <p className="text-sm text-muted-foreground">
                    Student: {jury.topic?.studentName || 'No Student Name'}
                  </p>
                  
                  <div className="mt-3 flex items-center">
                    <span className="text-sm font-medium mr-2">Classroom:</span>
                    <span className="text-sm">
                      {jury.presentationLocation || 'Not assigned'}
                      {jury.presentationLocation && classrooms.find(c => c.name === jury.presentationLocation)?.building && 
                        ` (${classrooms.find(c => c.name === jury.presentationLocation)?.building})`}
                    </span>
                  </div>
                  
                  <div className="mt-3">
                    <span className="text-sm font-medium">Assign Classroom:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {classrooms.map(classroom => (
                        <Button
                          key={classroom._id}
                          variant={jury.presentationLocation === classroom.name ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleSetClassroom(jury._id, classroom.name)}
                          className="text-xs"
                        >
                          {classroom.name} ({classroom.building})
                        </Button>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ScheduleManagement;
