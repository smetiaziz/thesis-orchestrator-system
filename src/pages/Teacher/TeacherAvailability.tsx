
import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { teachersApi } from "@/api/teachers";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface TimeSlot {
  startTime: string;
  endTime: string;
  selected: boolean;
}

const timeSlots: TimeSlot[] = [];
for (let hour = 8; hour < 18; hour++) {
  for (let minute = 0; minute < 60; minute += 30) {
    if (hour === 17 && minute === 30) continue; // Skip 5:30 PM
    const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const endHour = minute === 30 ? hour + 1 : hour;
    const endMinute = minute === 30 ? 0 : 30;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    timeSlots.push({ startTime, endTime, selected: false });
  }
}

const TeacherAvailability = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>(timeSlots);
  const { user } = useAuth();
  const { toast } = useToast();
  const form = useForm();
  
  // Fetch teacher data to get number of supervised projects
  const { data: teacherData, isLoading: isTeacherLoading } = useQuery({
    queryKey: ['teacher', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User ID not found');
      const response = await teachersApi.getByUserId(user.id);
      return response.data;
    },
    enabled: !!user?.id
  });

  // Calculate minimum required time slots
  const supervisedTopicsCount = teacherData?.supervisedProjects?.length || 0;
  const minimumRequiredSlots = supervisedTopicsCount * 3;
  const selectedSlotsCount = selectedTimeSlots.filter(slot => slot.selected).length;
  const hasEnoughSlots = selectedSlotsCount >= minimumRequiredSlots;

  const handleTimeSlotToggle = (index: number) => {
    const newTimeSlots = [...selectedTimeSlots];
    newTimeSlots[index].selected = !newTimeSlots[index].selected;
    setSelectedTimeSlots(newTimeSlots);
  };
  
  const handleSubmit = async () => {
    if (!selectedDate || !user?.id) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    const selectedSlots = selectedTimeSlots.filter(slot => slot.selected);
    if (selectedSlots.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one time slot",
        variant: "destructive",
      });
      return;
    }
    
    // Check if the minimum required slots condition is met
    if (selectedSlots.length < minimumRequiredSlots) {
      toast({
        title: "Validation Error",
        description: `You must select at least ${minimumRequiredSlots} time slots (3 per supervised topic)`,
        variant: "destructive",
      });
      return;
    }

    try {
      await api.post('/timeslots/bulk', {
        teacherId: user.id,
        slots: selectedSlots.map(slot => ({
          date: format(selectedDate, 'yyyy-MM-dd'),
          startTime: slot.startTime + ":00", // Add seconds if needed
          endTime: slot.endTime + ":00"
        }))
      });

      toast({
        title: "Success",
        description: "Availability updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Mark Your Availability</h1>
      
      {supervisedTopicsCount > 0 && (
        <Alert className="mb-6" variant={hasEnoughSlots ? "default" : "destructive"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Availability Requirement</AlertTitle>
          <AlertDescription>
            You are supervising {supervisedTopicsCount} PFE topic{supervisedTopicsCount !== 1 ? 's' : ''}. 
            You must select at least {minimumRequiredSlots} time slots (3 per topic).
            Currently selected: {selectedSlotsCount} {hasEnoughSlots ? '✓' : ''}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Select Date</h2>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            disabled={(date) => date < new Date()}
          />
        </div>

        <Form {...form}>
          <form className="space-y-4">
            <h2 className="text-lg font-semibold">Select Time Slots</h2>
            <div className="grid grid-cols-2 gap-4">
              {selectedTimeSlots.map((slot, index) => (
                <FormField
                  key={`${slot.startTime}-${slot.endTime}`}
                  control={form.control}
                  name={`timeslot-${index}`}
                  render={() => (
                    <FormItem className="flex items-center space-x-2">
                      <Checkbox
                        checked={slot.selected}
                        onCheckedChange={() => handleTimeSlotToggle(index)}
                      />
                      <FormLabel className="flex items-center text-sm">
                        <Clock className="mr-2 h-4 w-4" />
                        {slot.startTime} - {slot.endTime}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </form>
        </Form>
      </div>

      <div className="mt-8">
        <Button 
          onClick={handleSubmit} 
          className="w-full md:w-auto"
          disabled={!selectedDate || selectedTimeSlots.filter(slot => slot.selected).length < minimumRequiredSlots}
        >
          Save Availability
        </Button>
        
        {!hasEnoughSlots && selectedSlotsCount > 0 && (
          <p className="text-sm text-destructive mt-2">
            You need {minimumRequiredSlots - selectedSlotsCount} more time slot(s) to meet the minimum requirement.
          </p>
        )}
      </div>
    </div>
  );
};

export default TeacherAvailability;
