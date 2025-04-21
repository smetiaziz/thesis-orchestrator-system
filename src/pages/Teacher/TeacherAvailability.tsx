
import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Clock } from "lucide-react";

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

    try {
      await api.post('/timeslots/bulk', {
        teacherId: user.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        timeSlots: selectedSlots.map(slot => ({
          startTime: slot.startTime,
          endTime: slot.endTime
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
        <Button onClick={handleSubmit} className="w-full md:w-auto">
          Save Availability
        </Button>
      </div>
    </div>
  );
};

export default TeacherAvailability;
