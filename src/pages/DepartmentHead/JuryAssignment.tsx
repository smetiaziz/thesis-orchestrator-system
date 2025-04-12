
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  AlertTriangle 
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface PFETopic {
  _id: string;
  topicName: string;
  studentName: string;
  supervisorId: string;
  supervisorName: string;
  department: string;
  status: 'pending' | 'scheduled' | 'completed';
}

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  department: string;
  supervisedProjects: string[];
  juryParticipations: string[];
  email: string;
}

interface Availability {
  _id: string;
  teacherId: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface JuryConflict {
  type: 'quota' | 'availability' | 'sameRole' | 'scheduling';
  teacherId: string;
  message: string;
}

const JurySchema = z.object({
  pfeTopicId: z.string({ required_error: "Please select a PFE topic" }),
  supervisorId: z.string({ required_error: "Please select a supervisor" }),
  presidentId: z.string({ required_error: "Please select a jury president" }),
  reporterId: z.string({ required_error: "Please select a reporter" }),
  date: z.date({ required_error: "Please select a date" }),
  startTime: z.string({ required_error: "Please select a start time" }),
  endTime: z.string({ required_error: "Please select an end time" }),
  location: z.string({ required_error: "Please enter a location" }),
});

type JuryFormValues = z.infer<typeof JurySchema>;

const JuryAssignment: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [conflicts, setConflicts] = useState<JuryConflict[]>([]);
  
  const form = useForm<JuryFormValues>({
    resolver: zodResolver(JurySchema),
    defaultValues: {
      pfeTopicId: "",
      supervisorId: "",
      presidentId: "",
      reporterId: "",
      startTime: "08:00",
      endTime: "09:00",
      location: "Room A-101",
    },
  });
  
  // Fetch PFE topics that need scheduling
  const { data: topicsResponse, isLoading: topicsLoading } = useQuery({
    queryKey: ['pfe-topics-pending', user?.department],
    queryFn: async () => {
      return api.get<{ success: boolean; data: PFETopic[] }>(`/topics?status=pending${user?.department ? `&department=${user?.department}` : ''}`);
    }
  });
  
  // Fetch teachers for jury assignment
  const { data: teachersResponse, isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers', user?.department],
    queryFn: async () => {
      const params = user?.department ? `?department=${user?.department}` : '';
      return api.get<{ success: boolean; data: Teacher[] }>(`/teachers${params}`);
    }
  });
  
  // Fetch teacher availabilities
  const { data: availabilityResponse, isLoading: availabilityLoading } = useQuery({
    queryKey: ['teacher-availability', selectedDate],
    queryFn: async () => {
      if (!selectedDate) return { success: true, data: [] };
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      return api.get<{ success: boolean; data: Availability[] }>(`/timeslots?date=${dateStr}`);
    },
    enabled: !!selectedDate,
  });
  
  // Fetch single topic when selected
  const { data: selectedTopicData, isLoading: topicLoading } = useQuery({
    queryKey: ['pfe-topic', selectedTopic],
    queryFn: async () => {
      return api.get<{ success: boolean; data: PFETopic }>(`/topics/${selectedTopic}`);
    },
    enabled: !!selectedTopic,
  });
  
  const topics = topicsResponse?.data || [];
  const teachers = teachersResponse?.data || [];
  const availabilities = availabilityResponse?.data || [];
  const topicDetail = selectedTopicData?.data;
  
  // When a topic is selected, update form values
  React.useEffect(() => {
    if (topicDetail) {
      form.setValue('pfeTopicId', topicDetail._id);
      form.setValue('supervisorId', topicDetail.supervisorId);
    }
  }, [topicDetail, form]);
  
  // Check for conflicts
  const checkConflicts = () => {
    const formData = form.getValues();
    const newConflicts: JuryConflict[] = [];
    
    const supervisor = teachers.find(t => t._id === formData.supervisorId);
    const president = teachers.find(t => t._id === formData.presidentId);
    const reporter = teachers.find(t => t._id === formData.reporterId);
    
    // Check for same person in multiple roles
    if (formData.presidentId === formData.supervisorId) {
      newConflicts.push({
        type: 'sameRole',
        teacherId: formData.presidentId,
        message: 'President cannot be the same as supervisor'
      });
    }
    
    if (formData.reporterId === formData.supervisorId) {
      newConflicts.push({
        type: 'sameRole',
        teacherId: formData.reporterId,
        message: 'Reporter cannot be the same as supervisor'
      });
    }
    
    if (formData.reporterId === formData.presidentId) {
      newConflicts.push({
        type: 'sameRole',
        teacherId: formData.reporterId,
        message: 'Reporter cannot be the same as president'
      });
    }
    
    // Check availability if date is selected
    if (formData.date) {
      const dateStr = format(formData.date, 'yyyy-MM-dd');
      
      [supervisor, president, reporter].forEach(teacher => {
        if (!teacher) return;
        
        const teacherAvailability = availabilities.filter(a => a.teacherId === teacher._id);
        
        if (teacherAvailability.length === 0) {
          newConflicts.push({
            type: 'availability',
            teacherId: teacher._id,
            message: `${teacher.firstName} ${teacher.lastName} has not submitted availability for this date`
          });
          return;
        }
        
        const available = teacherAvailability.some(a => {
          return a.startTime <= formData.startTime && a.endTime >= formData.endTime;
        });
        
        if (!available) {
          newConflicts.push({
            type: 'availability',
            teacherId: teacher._id,
            message: `${teacher.firstName} ${teacher.lastName} is not available at the selected time`
          });
        }
      });
    }
    
    // Check quotas
    if (president) {
      const supervisedCount = president.supervisedProjects.length;
      const requiredParticipations = supervisedCount * 3;
      const actualParticipations = president.juryParticipations.length;
      
      if (actualParticipations >= requiredParticipations) {
        newConflicts.push({
          type: 'quota',
          teacherId: president._id,
          message: `${president.firstName} ${president.lastName} has already met their participation quota (${actualParticipations}/${requiredParticipations})`
        });
      }
    }
    
    if (reporter) {
      const supervisedCount = reporter.supervisedProjects.length;
      const requiredParticipations = supervisedCount * 3;
      const actualParticipations = reporter.juryParticipations.length;
      
      if (actualParticipations >= requiredParticipations) {
        newConflicts.push({
          type: 'quota',
          teacherId: reporter._id,
          message: `${reporter.firstName} ${reporter.lastName} has already met their participation quota (${actualParticipations}/${requiredParticipations})`
        });
      }
    }
    
    setConflicts(newConflicts);
    return newConflicts.length === 0;
  };
  
  // Create jury mutation
  const createJuryMutation = useMutation({
    mutationFn: async (data: JuryFormValues) => {
      return api.post('/juries', {
        ...data,
        date: format(data.date, 'yyyy-MM-dd'),
      });
    },
    onSuccess: () => {
      toast({ 
        title: "Jury assigned successfully",
        description: "The PFE presentation has been scheduled",
      });
      queryClient.invalidateQueries({ queryKey: ['pfe-topics-pending'] });
      queryClient.invalidateQueries({ queryKey: ['juries'] });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign jury",
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: JuryFormValues) => {
    if (!checkConflicts() && conflicts.some(c => c.type !== 'quota')) {
      toast({
        title: "Conflict detected",
        description: "Please resolve all conflicts before submitting",
        variant: "destructive",
      });
      return;
    }
    
    createJuryMutation.mutate(data);
  };
  
  // Find available teachers for suggestions
  const suggestJuryMembers = () => {
    if (!topicDetail || !formDate) return;
    
    const supervisorDept = topicDetail.department;
    const supervisorId = topicDetail.supervisorId;
    
    // Filter teachers from same department, excluding supervisor
    const eligibleTeachers = teachers.filter(t => 
      t.department === supervisorDept && 
      t._id !== supervisorId
    );
    
    // Sort by participation deficit (how many more participations they need)
    const sortedTeachers = [...eligibleTeachers].sort((a, b) => {
      const aSupervised = a.supervisedProjects.length;
      const bSupervised = b.supervisedProjects.length;
      
      const aRequired = aSupervised * 3;
      const bRequired = bSupervised * 3;
      
      const aActual = a.juryParticipations.length;
      const bActual = b.juryParticipations.length;
      
      const aDeficit = aRequired - aActual;
      const bDeficit = bRequired - bActual;
      
      return bDeficit - aDeficit; // Sort by highest deficit first
    });
    
    // Get top 2 teachers with highest deficit
    const suggested = sortedTeachers.slice(0, 2);
    
    if (suggested.length >= 1) {
      form.setValue('presidentId', suggested[0]._id);
    }
    
    if (suggested.length >= 2) {
      form.setValue('reporterId', suggested[1]._id);
    }
  };
  
  const formDate = form.watch('date');
  
  return (
    <div className="py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-navy">Jury Assignment</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Pending PFE Topics</CardTitle>
            <CardDescription>
              Select a topic to assign jury members and schedule a presentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topicsLoading ? (
              <p>Loading topics...</p>
            ) : topics.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pending PFE topics found
              </div>
            ) : (
              <div className="space-y-4">
                {topics.map((topic) => (
                  <div 
                    key={topic._id} 
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedTopic === topic._id ? 'bg-muted border-primary' : 'hover:bg-accent/50'
                    }`}
                    onClick={() => {
                      setSelectedTopic(topic._id);
                      form.setValue('pfeTopicId', topic._id);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{topic.topicName}</h3>
                        <p className="text-sm text-muted-foreground">
                          Student: {topic.studentName} | Supervisor: {topic.supervisorName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Department: {topic.department}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={!topic._id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTopic(topic._id);
                          setDialogOpen(true);
                        }}
                      >
                        Assign Jury
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Teacher Participation</CardTitle>
            <CardDescription>
              Teachers with lowest participation rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {teachersLoading ? (
              <p>Loading teachers...</p>
            ) : (
              <div className="space-y-4">
                {[...teachers]
                  .sort((a, b) => {
                    const aSupervised = a.supervisedProjects.length;
                    const bSupervised = b.supervisedProjects.length;
                    
                    const aRequired = Math.max(aSupervised * 3, 1); // At least 1
                    const bRequired = Math.max(bSupervised * 3, 1);
                    
                    const aActual = a.juryParticipations.length;
                    const bActual = b.juryParticipations.length;
                    
                    const aRate = aActual / aRequired;
                    const bRate = bActual / bRequired;
                    
                    return aRate - bRate; // Sort by lowest participation rate first
                  })
                  .slice(0, 5)
                  .map((teacher) => {
                    const supervised = teacher.supervisedProjects.length;
                    const required = Math.max(supervised * 3, 1); // At least 1
                    const actual = teacher.juryParticipations.length;
                    const percentage = Math.round((actual / required) * 100);
                    
                    return (
                      <div key={teacher._id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{teacher.firstName} {teacher.lastName}</p>
                          <p className="text-sm text-muted-foreground">
                            {actual}/{required} participations
                          </p>
                        </div>
                        <div className="w-16 text-right">
                          <Badge variant={percentage < 50 ? "destructive" : percentage < 100 ? "outline" : "default"}>
                            {percentage}%
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Jury Assignment Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Assign Jury & Schedule Presentation</DialogTitle>
            <DialogDescription>
              {topicDetail && (
                <div className="mt-2">
                  <p className="font-medium">{topicDetail.topicName}</p>
                  <p className="text-sm">
                    Student: {topicDetail.studentName} | Supervisor: {topicDetail.supervisorName}
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Supervisor */}
                <FormField
                  control={form.control}
                  name="supervisorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supervisor</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                        disabled={!!topicDetail}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select supervisor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teachers.map(teacher => (
                            <SelectItem key={teacher._id} value={teacher._id}>
                              {teacher.firstName} {teacher.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Date */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span className="text-muted-foreground">Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              setSelectedDate(date || undefined);
                            }}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* President */}
                <FormField
                  control={form.control}
                  name="presidentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jury President</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select president" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teachers
                            .filter(teacher => teacher._id !== form.getValues('supervisorId'))
                            .map(teacher => (
                              <SelectItem key={teacher._id} value={teacher._id}>
                                {teacher.firstName} {teacher.lastName}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Start Time */}
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Reporter */}
                <FormField
                  control={form.control}
                  name="reporterId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reporter</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select reporter" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teachers
                            .filter(teacher => 
                              teacher._id !== form.getValues('supervisorId') &&
                              teacher._id !== form.getValues('presidentId')
                            )
                            .map(teacher => (
                              <SelectItem key={teacher._id} value={teacher._id}>
                                {teacher.firstName} {teacher.lastName}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* End Time */}
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Location */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Conflicts */}
              {conflicts.length > 0 && (
                <div className="space-y-2">
                  {conflicts.map((conflict, index) => (
                    <Alert 
                      key={index}
                      variant={conflict.type === 'sameRole' ? "destructive" : 
                              conflict.type === 'availability' ? "destructive" : 
                              "warning"}
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>
                        {conflict.type === 'sameRole' ? "Role Conflict" : 
                         conflict.type === 'availability' ? "Availability Issue" : 
                         "Quota Warning"}
                      </AlertTitle>
                      <AlertDescription>
                        {conflict.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
              
              <DialogFooter className="flex flex-row justify-between items-center">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => suggestJuryMembers()}
                >
                  Suggest Jury Members
                </Button>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setDialogOpen(false);
                    form.reset();
                  }}>
                    Cancel
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={() => checkConflicts()}
                  >
                    Check Conflicts
                  </Button>
                  
                  <Button type="submit">
                    Assign Jury
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JuryAssignment;
