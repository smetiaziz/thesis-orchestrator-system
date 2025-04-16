
// This fixes build errors in ScheduleManagement.tsx
// Make sure to apply only necessary changes to fix the error with data property access and arguments
// While maintaining the rest of the file's functionality
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { toast } from '@/components/ui/use-toast';

interface Jury {
  _id: string;
  topic: {
    _id: string;
    topicName: string;
    studentName: string;
  };
  presentationDate?: string;
  presentationLocation?: string;
  members: string[];
}

const ScheduleManagement: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  
  // Fetch juries with presentations on the selected date
  const { data: juriesResponse, isLoading: loadingJuries } = useQuery({
    queryKey: ['juries', formattedDate],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Jury[] }>(`/juries/date/${formattedDate}`);
      return response.data;
    },
    enabled: !!formattedDate,
  });
  
  // Fetch available classrooms
  const { data: classroomsResponse, isLoading: loadingClassrooms } = useQuery({
    queryKey: ['classrooms'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: string[] }>('/classrooms');
      return response.data;
    },
  });
  
  const handleSetClassroom = async (juryId: string, classroom: string) => {
    try {
      await api.put(`/juries/${juryId}/classroom`, { classroom, date: formattedDate });
      toast({
        title: "Success",
        description: "Classroom assigned successfully",
      });
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
      <h1 className="text-2xl font-bold mb-6">Presentation Schedule</h1>
      
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
                  <h3 className="font-medium">{jury.topic.topicName}</h3>
                  <p className="text-sm text-muted-foreground">Student: {jury.topic.studentName}</p>
                  
                  <div className="mt-3 flex items-center">
                    <span className="text-sm font-medium mr-2">Classroom:</span>
                    <span className="text-sm">
                      {jury.presentationLocation || 'Not assigned'}
                    </span>
                  </div>
                  
                  <div className="mt-3">
                    <span className="text-sm font-medium">Assign Classroom:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {classrooms.map(classroom => (
                        <Button
                          key={classroom}
                          variant={jury.presentationLocation === classroom ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleSetClassroom(jury._id, classroom)}
                          className="text-xs"
                        >
                          {classroom}
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
