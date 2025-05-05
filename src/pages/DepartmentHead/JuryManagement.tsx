import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiResponse } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from 'react-hot-toast';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Jury } from '@/types';
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { useNavigate } from 'react-router-dom';

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  rank: string;
}

interface PFETopic {
  _id: string;
  topicName: string;
  studentName: string;
  studentEmail: string;
  studentInscrNumber: string;
  department: string;
  supervisorId: string;
}

const JuryManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<string>('');
  const [supervisor, setSupervisor] = useState<string>('');
  const [president, setPresident] = useState<string>('');
  const [reporter, setReporter] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [selectedJuryId, setSelectedJuryId] = useState<string | null>(null);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editJuryId, setEditJuryId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [editTopic, setEditTopic] = useState<string>('');
  const [editSupervisor, setEditSupervisor] = useState<string>('');
  const [editPresident, setEditPresident] = useState<string>('');
  const [editReporter, setEditReporter] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editStartTime, setEditStartTime] = useState<string>('');
  const [editLocation, setEditLocation] = useState<string>('');
  const [isTopicValid, setIsTopicValid] = useState<boolean>(true);
  const [isSupervisorValid, setIsSupervisorValid] = useState<boolean>(true);
  const [isPresidentValid, setIsPresidentValid] = useState<boolean>(true);
  const [isReporterValid, setIsReporterValid] = useState<boolean>(true);
  const [isDateValid, setIsDateValid] = useState<boolean>(true);
  const [isStartTimeValid, setIsStartTimeValid] = useState<boolean>(true);
  const [isLocationValid, setIsLocationValid] = useState<boolean>(true);
  const [isEditTopicValid, setIsEditTopicValid] = useState<boolean>(true);
  const [isEditSupervisorValid, setIsEditSupervisorValid] = useState<boolean>(true);
  const [isEditPresidentValid, setIsEditPresidentValid] = useState<boolean>(true);
  const [isEditReporterValid, setIsEditReporterValid] = useState<boolean>(true);
  const [isEditDateValid, setIsEditDateValid] = useState<boolean>(true);
  const [isEditStartTimeValid, setIsEditStartTimeValid] = useState<boolean>(true);
  const [isEditLocationValid, setIsEditLocationValid] = useState<boolean>(true);
  const [isPresidentSupervisorSame, setIsPresidentSupervisorSame] = useState<boolean>(false);
  const [isReporterSupervisorSame, setIsReporterSupervisorSame] = useState<boolean>(false);
  const [isEditPresidentSupervisorSame, setIsEditPresidentSupervisorSame] = useState<boolean>(false);
  const [isEditReporterSupervisorSame, setIsEditReporterSupervisorSame] = useState<boolean>(false);
  const [isPresidentReporterSame, setIsPresidentReporterSame] = useState<boolean>(false);
  const [isEditPresidentReporterSame, setIsEditPresidentReporterSame] = useState<boolean>(false);
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [isEditFormValid, setIsEditFormValid] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState<boolean>(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState<boolean>(false);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState<boolean>(false);
  const [isInitialEditDataLoaded, setIsInitialEditDataLoaded] = useState<boolean>(false);
  const [isInitialDeleteDataLoaded, setIsInitialDeleteDataLoaded] = useState<boolean>(false);
  const [isInitialFormLoaded, setIsInitialFormLoaded] = useState<boolean>(false);
  const [isInitialEditFormLoaded, setIsInitialEditFormLoaded] = useState<boolean>(false);
  const [isInitialDeleteFormLoaded, setIsInitialDeleteFormLoaded] = useState<boolean>(false);
  const [isInitialDataValid, setIsInitialDataValid] = useState<boolean>(false);
  const [isInitialEditDataValid, setIsInitialEditDataValid] = useState<boolean>(false);
  const [isInitialDeleteDataValid, setIsInitialDeleteDataValid] = useState<boolean>(false);
  const [isInitialFormValid, setIsInitialFormValid] = useState<boolean>(false);
  const [isInitialEditFormValid, setIsInitialEditFormValid] = useState<boolean>(false);
  const [isInitialDeleteFormValid, setIsInitialDeleteFormValid] = useState<boolean>(false);
  const [isInitialDataSubmitting, setIsInitialDataSubmitting] = useState<boolean>(false);
  const [isInitialEditDataSubmitting, setIsInitialEditDataSubmitting] = useState<boolean>(false);
  const [isInitialDeleteDataSubmitting, setIsInitialDeleteDataSubmitting] = useState<boolean>(false);
  const [isInitialFormSubmitting, setIsInitialFormSubmitting] = useState<boolean>(false);
  const [isInitialEditFormSubmitting, setIsInitialEditFormSubmitting] = useState<boolean>(false);
  const [isInitialDeleteFormSubmitting, setIsInitialDeleteFormSubmitting] = useState<boolean>(false);
  const [isInitialDataOpen, setIsInitialDataOpen] = useState<boolean>(false);
  const [isInitialEditDataOpen, setIsInitialEditDataOpen] = useState<boolean>(false);
  const [isInitialDeleteDataOpen, setIsInitialDeleteDataOpen] = useState<boolean>(false);
  const [isInitialFormOpen, setIsInitialFormOpen] = useState<boolean>(false);
  const [isInitialEditFormOpen, setIsInitialEditFormOpen] = useState<boolean>(false);
  const [isInitialDeleteFormOpen, setIsInitialDeleteFormOpen] = useState<boolean>(false);
  const [isInitialDataEditMode, setIsInitialDataEditMode] = useState<boolean>(false);
  const [isInitialEditDataEditMode, setIsInitialEditDataEditMode] = useState<boolean>(false);
  const [isInitialDeleteDataEditMode, setIsInitialDeleteDataEditMode] = useState<boolean>(false);
  const [isInitialFormEditMode, setIsInitialFormEditMode] = useState<boolean>(false);
  const [isInitialEditFormEditMode, setIsInitialEditFormEditMode] = useState<boolean>(false);
  const [isInitialDeleteFormEditMode, setIsInitialDeleteFormEditMode] = useState<boolean>(false);
  const [isInitialDataDeleteConfirmationOpen, setIsInitialDataDeleteConfirmationOpen] = useState<boolean>(false);
  const [isInitialEditDataDeleteConfirmationOpen, setIsInitialEditDataDeleteConfirmationOpen] = useState<boolean>(false);
  const [isInitialDeleteDataDeleteConfirmationOpen, setIsInitialDeleteDataDeleteConfirmationOpen] = useState<boolean>(false);
  const [isInitialFormDeleteConfirmationOpen, setIsInitialFormDeleteConfirmationOpen] = useState<boolean>(false);
  const [isInitialEditFormDeleteConfirmationOpen, setIsInitialEditFormDeleteConfirmationOpen] = useState<boolean>(false);
  const [isInitialDeleteFormDeleteConfirmationOpen, setIsInitialDeleteFormDeleteConfirmationOpen] = useState<boolean>(false);
  const [isInitialDataEditDialogOpen, setIsInitialDataEditDialogOpen] = useState<boolean>(false);
  const [isInitialEditDataEditDialogOpen, setIsInitialEditDataEditDialogOpen] = useState<boolean>(false);
  const [isInitialDeleteDataEditDialogOpen, setIsInitialDeleteDataEditDialogOpen] = useState<boolean>(false);
  const [isInitialFormEditDialogOpen, setIsInitialFormEditDialogOpen] = useState<boolean>(false);
  const [isInitialEditFormEditDialogOpen, setIsInitialEditFormEditDialogOpen] = useState<boolean>(false);
  const [isInitialDeleteFormEditDialogOpen, setIsInitialDeleteFormEditDialogOpen] = useState<boolean>(false);
  const [isInitialDataPresidentSupervisorSame, setIsInitialDataPresidentSupervisorSame] = useState<boolean>(false);
  const [isInitialEditDataPresidentSupervisorSame, setIsInitialEditDataPresidentSupervisorSame] = useState<boolean>(false);
  const [isInitialDeleteDataPresidentSupervisorSame, setIsInitialDeleteDataPresidentSupervisorSame] = useState<boolean>(false);
  const [isInitialFormPresidentSupervisorSame, setIsInitialFormPresidentSupervisorSame] = useState<boolean>(false);
  const [isInitialEditFormPresidentSupervisorSame, setIsInitialEditFormPresidentSupervisorSame] = useState<boolean>(false);
  const [isInitialDeleteFormPresidentSupervisorSame, setIsInitialDeleteFormPresidentSupervisorSame] = useState<boolean>(false);
  const [isInitialDataReporterSupervisorSame, setIsInitialDataReporterSupervisorSame] = useState<boolean>(false);
  const [isInitialEditDataReporterSupervisorSame, setIsInitialEditDataReporterSupervisorSame] = useState<boolean>(false);
  const [isInitialDeleteDataReporterSupervisorSame, setIsInitialDeleteDataReporterSupervisorSame] = useState<boolean>(false);
  const [isInitialFormReporterSupervisorSame, setIsInitialFormReporterSupervisorSame] = useState<boolean>(false);
  const [isInitialEditFormReporterSupervisorSame, setIsInitialEditFormReporterSupervisorSame] = useState<boolean>(false);
  const [isInitialDeleteFormReporterSupervisorSame, setIsInitialDeleteFormReporterSupervisorSame] = useState<boolean>(false);
  const [isInitialDataPresidentReporterSame, setIsInitialDataPresidentReporterSame] = useState<boolean>(false);
  const [isInitialEditDataPresidentReporterSame, setIsInitialEditDataPresidentReporterSame] = useState<boolean>(false);
  const [isInitialDeleteDataPresidentReporterSame, setIsInitialDeleteDataPresidentReporterSame] = useState<boolean>(false);
  const [isInitialFormPresidentReporterSame, setIsInitialFormPresidentReporterSame] = useState<boolean>(false);
  const [isInitialEditFormPresidentReporterSame, setIsInitialEditFormPresidentReporterSame] = useState<boolean>(false);
  const [isInitialDeleteFormPresidentReporterSame, setIsInitialDeleteFormPresidentReporterSame] = useState<boolean>(false);
  const [isInitialDataTopicValid, setIsInitialDataTopicValid] = useState<boolean>(false);
  const [isInitialEditDataTopicValid, setIsInitialEditDataTopicValid] = useState<boolean>(false);
  const [isInitialDeleteDataTopicValid, setIsInitialDeleteDataTopicValid] = useState<boolean>(false);
  const [isInitialFormTopicValid, setIsInitialFormTopicValid] = useState<boolean>(false);
  const [isInitialEditFormTopicValid, setIsInitialEditFormTopicValid] = useState<boolean>(false);
  const [isInitialDeleteFormTopicValid, setIsInitialDeleteFormTopicValid] = useState<boolean>(false);
  const [isInitialDataSupervisorValid, setIsInitialDataSupervisorValid] = useState<boolean>(false);
  const [isInitialEditDataSupervisorValid, setIsInitialEditDataSupervisorValid] = useState<boolean>(false);
  const [isInitialDeleteDataSupervisorValid, setIsInitialDeleteDataSupervisorValid] = useState<boolean>(false);
  const [isInitialFormSupervisorValid, setIsInitialFormSupervisorValid] = useState<boolean>(false);
  const [isInitialEditFormSupervisorValid, setIsInitialEditFormSupervisorValid] = useState<boolean>(false);
  const [isInitialDeleteFormSupervisorValid, setIsInitialDeleteFormSupervisorValid] = useState<boolean>(false);
  const [isInitialDataPresidentValid, setIsInitialDataPresidentValid] = useState<boolean>(false);
  const [isInitialEditDataPresidentValid, setIsInitialEditDataPresidentValid] = useState<boolean>(false);
  const [isInitialDeleteDataPresidentValid, setIsInitialDeleteDataPresidentValid] = useState<boolean>(false);
  const [isInitialFormPresidentValid, setIsInitialFormPresidentValid] = useState<boolean>(false);
  const [isInitialEditFormPresidentValid, setIsInitialEditFormPresidentValid] = useState<boolean>(false);
  const [isInitialDeleteFormPresidentValid, setIsInitialDeleteFormPresidentValid] = useState<boolean>(false);
  const [isInitialDataReporterValid, setIsInitialDataReporterValid] = useState<boolean>(false);
  const [isInitialEditDataReporterValid, setIsInitialEditDataReporterValid] = useState<boolean>(false);
  const [isInitialDeleteDataReporterValid, setIsInitialDeleteDataReporterValid] = useState<boolean>(false);
  const [isInitialFormReporterValid, setIsInitialFormReporterValid] = useState<boolean>(false);
  const [isInitialEditFormReporterValid, setIsInitialEditFormReporterValid] = useState<boolean>(false);
  const [isInitialDeleteFormReporterValid, setIsInitialDeleteFormReporterValid] = useState<boolean>(false);
  const [isInitialDataDateValid, setIsInitialDataDateValid] = useState<boolean>(false);
  const [isInitialEditDataDateValid, setIsInitialEditDataDateValid] = useState<boolean>(false);
  const [isInitialDeleteDataDateValid, setIsInitialDeleteDataDateValid] = useState<boolean>(false);
  const [isInitialFormDateValid, setIsInitialFormDateValid] = useState<boolean>(false);
  const [isInitialEditFormDateValid, setIsInitialEditFormDateValid] = useState<boolean>(false);
  const [isInitialDeleteFormDateValid, setIsInitialDeleteFormDateValid] = useState<boolean>(false);
  const [isInitialDataStartTimeValid, setIsInitialDataStartTimeValid] = useState<boolean>(false);
  const [isInitialEditDataStartTimeValid, setIsInitialEditDataStartTimeValid] = useState<boolean>(false);
  const [isInitialDeleteDataStartTimeValid, setIsInitialDeleteDataStartTimeValid] = useState<boolean>(false);
  const [isInitialFormStartTimeValid, setIsInitialFormStartTimeValid] = useState<boolean>(false);
  const [isInitialEditFormStartTimeValid, setIsInitialEditFormStartTimeValid] = useState<boolean>(false);
  const [isInitialDeleteFormStartTimeValid, setIsInitialDeleteFormStartTimeValid] = useState<boolean>(false);
  const [isInitialDataLocationValid, setIsInitialDataLocationValid] = useState<boolean>(false);
  const [isInitialEditDataLocationValid, setIsInitialEditDataLocationValid] = useState<boolean>(false);
  const [isInitialDeleteDataLocationValid, setIsInitialDeleteDataLocationValid] = useState<boolean>(false);
  const [isInitialFormLocationValid, setIsInitialFormLocationValid] = useState<boolean>(false);
  const [isInitialEditFormLocationValid, setIsInitialEditFormLocationValid] = useState<boolean>(false);
  const [isInitialDeleteFormLocationValid, setIsInitialDeleteFormLocationValid] = useState<boolean>(false);
  const [isInitialDataInitialDataLoaded, setIsInitialDataInitialDataLoaded] = useState<boolean>(false);
  const [isInitialEditDataInitialDataLoaded, setIsInitialEditDataInitialDataLoaded] = useState<boolean>(false);
  const [isInitialDeleteDataInitialDataLoaded, setIsInitialDeleteDataInitialDataLoaded] = useState<boolean>(false);
  const [isInitialFormInitialDataLoaded, setIsInitialFormInitialDataLoaded] = useState<boolean>(false);
  const [isInitialEditFormInitialDataLoaded, setIsInitialEditFormInitialDataLoaded] = useState<boolean>(false);
  const [isInitialDeleteFormInitialDataLoaded, setIsInitialDeleteFormInitialDataLoaded] = useState<boolean>(false);
  const [topics, setTopics] = useState<PFETopic[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const { toast } = useToast()

  useEffect(() => {
    if (supervisor && president) {
      setIsPresidentSupervisorSame(supervisor === president);
    } else {
      setIsPresidentSupervisorSame(false);
    }
  }, [supervisor, president]);

  useEffect(() => {
    if (supervisor && reporter) {
      setIsReporterSupervisorSame(supervisor === reporter);
    } else {
      setIsReporterSupervisorSame(false);
    }
  }, [supervisor, reporter]);

  useEffect(() => {
    if (president && reporter) {
      setIsPresidentReporterSame(president === reporter);
    } else {
      setIsPresidentReporterSame(false);
    }
  }, [president, reporter]);

  useEffect(() => {
    if (editSupervisor && editPresident) {
      setIsEditPresidentSupervisorSame(editSupervisor === editPresident);
    } else {
      setIsEditPresidentSupervisorSame(false);
    }
  }, [editSupervisor, editPresident]);

  useEffect(() => {
    if (editSupervisor && editReporter) {
      setIsEditReporterSupervisorSame(editSupervisor === editReporter);
    } else {
      setIsEditReporterSupervisorSame(false);
    }
  }, [editSupervisor, editReporter]);

  useEffect(() => {
    if (editPresident && editReporter) {
      setIsEditPresidentReporterSame(editPresident === editReporter);
    } else {
      setIsEditPresidentReporterSame(false);
    }
  }, [editPresident, editReporter]);

  useEffect(() => {
    setIsTopicValid(!!topic);
    setIsSupervisorValid(!!supervisor);
    setIsPresidentValid(!!president);
    setIsReporterValid(!!reporter);
    setIsDateValid(!!date);
    setIsStartTimeValid(!!startTime);
    setIsLocationValid(!!location);
  }, [topic, supervisor, president, reporter, date, startTime, location]);

  useEffect(() => {
    setIsEditTopicValid(!!editTopic);
    setIsEditSupervisorValid(!!editSupervisor);
    setIsEditPresidentValid(!!editPresident);
    setIsEditReporterValid(!!editReporter);
    setIsEditDateValid(!!editDate);
    setIsEditStartTimeValid(!!editStartTime);
    setIsEditLocationValid(!!editLocation);
  }, [editTopic, editSupervisor, editPresident, editReporter, editDate, editStartTime, editLocation]);

  useEffect(() => {
    setIsFormValid(
      isTopicValid &&
      isSupervisorValid &&
      isPresidentValid &&
      isReporterValid &&
      isDateValid &&
      isStartTimeValid &&
      isLocationValid &&
      !isPresidentSupervisorSame &&
      !isReporterSupervisorSame &&
      !isPresidentReporterSame
    );
  }, [isTopicValid, isSupervisorValid, isPresidentValid, isReporterValid, isDateValid, isStartTimeValid, isLocationValid, isPresidentSupervisorSame, isReporterSupervisorSame, isPresidentReporterSame]);

  useEffect(() => {
    setIsEditFormValid(
      isEditTopicValid &&
      isEditSupervisorValid &&
      isEditPresidentValid &&
      isEditReporterValid &&
      isEditDateValid &&
      isEditStartTimeValid &&
      isEditLocationValid &&
      !isEditPresidentSupervisorSame &&
      !isEditReporterSupervisorSame &&
      !isEditPresidentReporterSame
    );
  }, [isEditTopicValid, isEditSupervisorValid, isEditPresidentValid, isEditReporterValid, isEditDateValid, isEditStartTimeValid, isEditLocationValid, isEditPresidentSupervisorSame, isEditReporterSupervisorSame, isEditPresidentReporterSame]);

  const { data: juriesData, isLoading: juriesLoading, refetch: refetchJuries } = useQuery({
    queryKey: ['juries', user?.department],
    queryFn: fetchJuries,
    enabled: !!user?.department,
  });

  const fetchJuries = async () => {
    if (!user?.department) throw new Error('Department not found');
    const response = await api.get<ApiResponse<Jury[]>>('/juries', { department: user.department });
    return response;
  };

  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ['topics', user?.department],
    queryFn: async () => {
      if (!user?.department) throw new Error('Department not found');
      const response = await api.get<ApiResponse<PFETopic[]>>('/topics', { department: user.department });
      return response;
    },
    enabled: !!user?.department,
    onSuccess: (data) => {
      if (data?.success && data.data) {
        setTopics(data.data);
      }
    }
  });

  const { data: teachersData, isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers', user?.department],
    queryFn: async () => {
      if (!user?.department) throw new Error('Department not found');
      const response = await api.get<ApiResponse<Teacher[]>>('/teachers', { department: user.department });
      return response;
    },
    enabled: !!user?.department,
    onSuccess: (data) => {
      if (data?.success && data.data) {
        setTeachers(data.data);
      }
    }
  });

  const createJuryMutation = useMutation({
    mutationFn: async () => {
      if (!user?.department) throw new Error('Department not found');
      return api.post('/juries', {
        pfeTopicId: topic,
        supervisorId: supervisor,
        presidentId: president,
        reporterId: reporter,
        date: date,
        startTime: startTime,
        location: location,
        department: user.department,
      });
    },
    onSuccess: () => {
      toast.success('Jury created successfully!');
      queryClient.invalidateQueries(['juries', user?.department]);
      resetForm();
      setIsFormOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create jury');
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const updateJuryMutation = useMutation({
    mutationFn: async () => {
      if (!editJuryId) throw new Error('Jury ID not found');
      return api.put(`/juries/${editJuryId}`, {
        pfeTopicId: editTopic,
        supervisorId: editSupervisor,
        presidentId: editPresident,
        reporterId: editReporter,
        date: editDate,
        startTime: editStartTime,
        location: editLocation,
      });
    },
    onSuccess: () => {
      toast.success('Jury updated successfully!');
      queryClient.invalidateQueries(['juries', user?.department]);
      resetEditForm();
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update jury');
    },
    onSettled: () => {
      setIsEditSubmitting(false);
    },
  });

  const deleteJuryMutation = useMutation({
    mutationFn: async () => {
      if (!selectedJuryId) throw new Error('Jury ID not found');
      return api.delete(`/juries/${selectedJuryId}`);
    },
    onSuccess: () => {
      toast.success('Jury deleted successfully!');
      queryClient.invalidateQueries(['juries', user?.department]);
      setSelectedJuryId(null);
      setIsDeleteConfirmationOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete jury');
    },
    onSettled: () => {
      setIsDeleteSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createJuryMutation.mutateAsync();
    } catch (error) {
      console.error("Error creating jury:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditSubmitting(true);
    try {
      await updateJuryMutation.mutateAsync();
    } catch (error) {
      console.error("Error updating jury:", error);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleteSubmitting(true);
    try {
      await deleteJuryMutation.mutateAsync();
    } catch (error) {
      console.error("Error deleting jury:", error);
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  const resetForm = () => {
    setTopic('');
    setSupervisor('');
    setPresident('');
    setReporter('');
    setDate('');
    setStartTime('');
    setLocation('');
  };

  const resetEditForm = () => {
    setEditTopic('');
    setEditSupervisor('');
    setEditPresident('');
    setEditReporter('');
    setEditDate('');
    setEditStartTime('');
    setEditLocation('');
  };

  const handleEdit = (jury: Jury) => {
    setEditJuryId(jury._id);
    setEditTopic(jury.pfeTopicId);
    setEditSupervisor(jury.supervisorId);
    setEditPresident(jury.presidentId);
    setEditReporter(jury.reporterId);
    setDate(jury.date);
    setStartTime(jury.startTime);
    setLocation(jury.location);
    setIsEditDialogOpen(true);
  };

  const handleDeleteConfirmation = (juryId: string) => {
    setSelectedJuryId(juryId);
    setIsDeleteConfirmationOpen(true);
  };

  const juries = juriesData?.data || [];

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Jury Management</h2>
        <Button onClick={() => setIsFormOpen(true)}>Add Jury</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Jury List</CardTitle>
          <CardDescription>Manage and view all juries.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic</TableHead>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>President</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {juriesLoading ? (
                  <>
                    {Array(5).fill(null).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton /></TableCell>
                        <TableCell><Skeleton /></TableCell>
                        <TableCell><Skeleton /></TableCell>
                        <TableCell><Skeleton /></TableCell>
                        <TableCell><Skeleton /></TableCell>
                        <TableCell><Skeleton /></TableCell>
                        <TableCell><Skeleton /></TableCell>
                        <TableCell className="text-right"><Skeleton /></TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : (
                  <>
                    {juries.map((jury) => {
                      const topicName = topics.find(t => t._id === jury.pfeTopicId)?.topicName || 'N/A';
                      const supervisorName = teachers.find(t => t._id === jury.supervisorId)?.firstName || 'N/A';
                      const presidentName = teachers.find(t => t._id === jury.presidentId)?.firstName || 'N/A';
                      const reporterName = teachers.find(t => t._id === jury.reporterId)?.firstName || 'N/A';

                      return (
                        <TableRow key={jury._id}>
                          <TableCell>{topicName}</TableCell>
                          <TableCell>{supervisorName}</TableCell>
                          <TableCell>{presidentName}</TableCell>
                          <TableCell>{reporterName}</TableCell>
                          <TableCell>{jury.date}</TableCell>
                          <TableCell>{jury.startTime}</TableCell>
                          <TableCell>{jury.location}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEdit(jury)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteConfirmation(jury._id)}
                              className="ml-2"
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Jury</DialogTitle>
            <DialogDescription>
              Create a new jury by filling out the form below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="topic" className="text-right">
                Topic
              </Label>
              <Select onValueChange={setTopic} defaultValue={topic}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic._id} value={topic._id}>{topic.topicName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supervisor" className="text-right">
                Supervisor
              </Label>
              <Select onValueChange={setSupervisor} defaultValue={supervisor}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a supervisor" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher._id} value={teacher._id}>{teacher.firstName} {teacher.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="president" className="text-right">
                President
              </Label>
              <Select onValueChange={setPresident} defaultValue={president}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a president" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher._id} value={teacher._id}>{teacher.firstName} {teacher.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reporter" className="text-right">
                Reporter
              </Label>
              <Select onValueChange={setReporter} defaultValue={reporter}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a reporter" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher._id} value={teacher._id}>{teacher.firstName} {teacher.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startTime" className="text-right">
                Start Time
              </Label>
              <Input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="col-span-3"
              />
            </div>
            {isPresidentSupervisorSame && (
              <div className="text-sm text-red-500">
                President cannot be the same as the supervisor.
              </div>
            )}
            {isReporterSupervisorSame && (
              <div className="text-sm text-red-500">
                Reporter cannot be the same as the supervisor.
              </div>
            )}
            {isPresidentReporterSame && (
              <div className="text-sm text-red-500">
                President cannot be the same as the reporter.
              </div>
            )}
            <Button type="submit" disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Jury"}
            </Button>
          </
