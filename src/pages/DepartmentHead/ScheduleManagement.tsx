import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { toast } from '@/components/ui/use-toast';
import { RefreshCw, FileDown, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import DepartmentSelector from '@/components/DepartmentSelector';
import { 
  PDFDownloadLink, 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet 
} from '@react-pdf/renderer';

interface Classroom {
  _id: string;
  name: string;
  building: string;
  capacity: number;
}

interface Jury {
  _id: string;
  pfeTopicId?: {
    _id: string;
    topicName: string;
    studentName: string;
  };
  startTime?: string;
  date?: string;
  location?: string;
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

const styles = StyleSheet.create({
  page: { 
    padding: 30,
    fontFamily: 'Helvetica'
  },
  header: { 
    marginBottom: 20,
    borderBottom: 1,
    borderBottomColor: '#DDDDDD',
    paddingBottom: 10
  },
  title: { 
    fontSize: 24, 
    marginBottom: 10,
    fontWeight: 'bold'
  },
  subtitle: { 
    fontSize: 14, 
    marginBottom: 5,
    color: '#666666'
  },
  dateSection: {
    marginTop: 15,
    marginBottom: 10
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#F3F4F6',
    padding: 8,
    marginBottom: 10
  },
  table: { 
    width: '100%', 
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 5
  },
  row: { 
    flexDirection: 'row', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB',
    minHeight: 24,
    paddingVertical: 6,
    paddingHorizontal: 5
  },
  lastRow: {
    flexDirection: 'row',
    minHeight: 24,
    paddingVertical: 6,
    paddingHorizontal: 5
  },
  headerCell: { 
    flex: 1, 
    fontWeight: 'bold',
    fontSize: 12
  },
  cell: { 
    flex: 1,
    fontSize: 10,
    paddingRight: 3
  },
  largeCell: {
    flex: 2,
    fontSize: 10,
    paddingRight: 3
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 10,
    textAlign: 'center',
    color: '#666666'
  },
  empty: {
    padding: 10,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#999999',
    fontSize: 12
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    fontSize: 10,
    color: '#666666'
  }
});

const SchedulePDF = ({ department, allPresentations }) => {
  const presentationsByDate = {};
  
  allPresentations.forEach(pres => {
    if (!presentationsByDate[pres.date]) {
      presentationsByDate[pres.date] = [];
    }
    presentationsByDate[pres.date].push(pres);
  });

  const sortedDates = Object.keys(presentationsByDate).sort();

  return (
    <Document>
      <Page style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Computer Science Department</Text>
          <Text style={styles.subtitle}>Complete Presentation Schedule</Text>
          <Text style={styles.subtitle}>Generated on: {format(new Date(), 'MMMM d, yyyy')}</Text>
        </View>
        
        {sortedDates.length === 0 ? (
          <View style={styles.empty}>
            <Text>No presentations scheduled for this department.</Text>
          </View>
        ) : (
          sortedDates.map((date, dateIndex) => (
            <View key={date} style={styles.dateSection}>
              <Text style={styles.dateHeader}>
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </Text>
              
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={styles.headerCell}>Topic</Text>
                  <Text style={styles.headerCell}>Student</Text>
                  <Text style={styles.headerCell}>Classroom</Text>
                  <Text style={styles.headerCell}>Time</Text>
                </View>
                
                {presentationsByDate[date].map((pres, index) => (
                  <View 
                    key={index} 
                    style={index === presentationsByDate[date].length - 1 ? styles.lastRow : styles.row}
                  >
                    <Text style={styles.largeCell}>{pres.topic || 'N/A'}</Text>
                    <Text style={styles.cell}>{pres.student || 'N/A'}</Text>
                    <Text style={styles.cell}>{pres.classroom || 'Not assigned'}</Text>
                    <Text style={styles.cell}>{pres.startTime || 'Not assigned'}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
        
        <Text style={styles.footer}>
          {department} Department - {sortedDates.length} days scheduled
        </Text>
        
        <Text 
          style={styles.pageNumber} 
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} 
        />
      </Page>
    </Document>
  );
};

const ScheduleManagement: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [autoGenerateStartDate, setAutoGenerateStartDate] = useState<Date | undefined>();
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [exportingAll, setExportingAll] = useState<boolean>(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  const { data: juriesResponse, isLoading: loadingJuries, refetch: refetchJuries } = useQuery({
    queryKey: ['juries', formattedDate, selectedDepartment],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Jury[] }>(
        `/juries/date/${formattedDate}?department=${selectedDepartment}`
      );
      return response;
    },
    enabled: !!formattedDate && !!selectedDepartment,
  });

  const { data: allJuriesResponse, isLoading: loadingAllJuries } = useQuery({
    queryKey: ['all-juries', selectedDepartment],
    queryFn: async () => {
      if (!selectedDepartment) return { data: [] };
      const response = await api.get<{ success: boolean; data: Jury[] }>(
        `/juries`
      );
      return response;
    },
    enabled: !!selectedDepartment && exportingAll,
  });

  const { data: classroomsResponse } = useQuery({
    queryKey: ['classrooms'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Classroom[] }>('/classrooms');
      return response;
    },
  });

  const autoGenerateMutation = useMutation({
    mutationFn: async (variables: { department: string; startDate: Date }) => {
      const formattedStartDate = format(variables.startDate, 'yyyy-MM-dd');
      const response = await api.post<AutoGenerateResponse>(
        '/juries/auto-generate',
        { 
          department: variables.department, 
          startDate: formattedStartDate 
        }
      );
      return response;
    },
    onSuccess: (response) => {
      const { total, scheduled, failed, errors } = response.data;
      setIsPopoverOpen(false);
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
      if (errors && errors.length > 0) {
        errors.forEach(error => {
          toast({
            title: "Error",
            description: error,
            variant: "destructive",
          });
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate schedule. Please try again.",
        variant: "destructive",
      });
    },
  });

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

  const handlePrepareExport = () => {
    setExportingAll(true);
  };

  const juries = juriesResponse?.data || [];
  const allJuries = allJuriesResponse?.data || [];
  const classrooms = classroomsResponse?.data || [];
  const validJuries = juries.filter(jury => jury.pfeTopicId?.topicName && jury.pfeTopicId?.studentName);
  const validAllJuries = allJuries.filter(jury => jury.pfeTopicId?.topicName && jury.pfeTopicId?.studentName);

  const pdfData = {
    department: selectedDepartment,
    allPresentations: validJuries.map(jury => ({
      date: jury.date,
      topic: jury.pfeTopicId?.topicName,
      student: jury.pfeTopicId?.studentName,
      classroom: jury.location || 'Not assigned',
      startTime: jury.startTime || 'Not assigned'
    }))
  };

  const allPdfData = {
    department: selectedDepartment,
    allPresentations: validAllJuries.map(jury => ({
      date: jury.date,
      topic: jury.pfeTopicId?.topicName,
      student: jury.pfeTopicId?.studentName,
      classroom: jury.location || 'Not assigned',
      startTime: jury.startTime || 'Not assigned'
    }))
  };

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
          
          {selectedDepartment && (
            <div className="flex gap-2">
              <PDFDownloadLink
                document={<SchedulePDF {...pdfData} />}
                fileName={`schedule-${selectedDepartment}-${formattedDate}.pdf`}
              >
                {({ loading }) => (
                  <Button variant="outline" disabled={loading} className="gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    {loading ? 'Generating...' : 'Export Current Date'}
                  </Button>
                )}
              </PDFDownloadLink>
              
              {exportingAll ? (
                <PDFDownloadLink
                  document={<SchedulePDF {...allPdfData} />}
                  fileName={`complete-schedule-${selectedDepartment}.pdf`}
                >
                  {({ loading }) => (
                    <Button disabled={loading || loadingAllJuries} className="gap-1">
                      <FileDown className="h-4 w-4" />
                      {loading || loadingAllJuries ? 'Generating...' : 'Download Complete Schedule'}
                    </Button>
                  )}
                </PDFDownloadLink>
              ) : (
                <Button onClick={handlePrepareExport} className="gap-1">
                  <FileDown className="h-4 w-4" />
                  Export All Dates
                </Button>
              )}
              
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    disabled={autoGenerateMutation.isPending || !selectedDepartment}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${autoGenerateMutation.isPending ? 'animate-spin' : ''}`} />
                    Auto-Generate Schedule
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={autoGenerateStartDate}
                    onSelect={setAutoGenerateStartDate}
                    initialFocus
                  />
                  <div className="p-3 pt-0 flex justify-center">
                    <Button
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => {
                        if (autoGenerateStartDate) {
                          autoGenerateMutation.mutate(
                            { 
                              department: selectedDepartment, 
                              startDate: autoGenerateStartDate 
                            },
                            {
                              onSuccess: () => setIsPopoverOpen(false)
                            }
                          );
                        }
                      }}
                      disabled={!autoGenerateStartDate}
                    >
                      Confirm Start Date
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>

      {!selectedDepartment ? (
        <Card className="p-4 text-center">
          <p className="text-muted-foreground">No department selected.</p>
        </Card>
      ) : (
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
            ) : validJuries.length === 0 ? (
              <p>No presentations scheduled for this date.</p>
            ) : (
              <div className="space-y-4">
                {validJuries.map(jury => (
                  <Card key={jury._id} className="p-4">
                    <h3 className="font-medium">{jury.pfeTopicId.topicName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Student: {jury.pfeTopicId.studentName}
                    </p>
                    
                    <div className="mt-3 flex items-center">
                      <span className="text-sm font-medium mr-2">Classroom:</span>
                      <span className="text-sm">
                        {jury.location || 'Not assigned'}
                        {jury.location && classrooms.find(c => c.name === jury.location)?.building && 
                          ` (${classrooms.find(c => c.name === jury.location)?.building})`}
                      </span>
                    </div>
                    
                    <div className="mt-2">
                      <span className="text-sm font-medium">Time:</span>
                      <p className="text-sm text-muted-foreground">
                        {jury?.startTime} H
                      </p>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-2 mt-1">
                        {classrooms.map(classroom => (
                          <Button
                            key={classroom._id}
                            variant={jury.location === classroom.name ? "default" : "outline"}
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
      )}
    </div>
  );
};

export default ScheduleManagement;