
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart3, Calendar, FileSpreadsheet, Users, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { UserRole } from "@/types";

// Mock data for demonstration
const dashboardData = {
  departmentHead: {
    totalTopics: 24,
    scheduledPresentations: 18,
    pendingPresentations: 6,
    totalTeachers: 12,
    alerts: [
      { id: 1, type: "warning", message: "3 teachers haven't submitted their availability" },
      { id: 2, type: "error", message: "2 scheduling conflicts detected" },
      { id: 3, type: "info", message: "5 new topics added since yesterday" },
    ],
    upcomingPresentations: [
      { id: 1, topic: "AI-Based Medical Diagnosis", student: "Alice Johnson", time: "Today, 14:00", location: "Room A-101" },
      { id: 2, topic: "Blockchain for Supply Chain", student: "Bob Smith", time: "Tomorrow, 10:30", location: "Room B-205" },
      { id: 3, topic: "Neural Networks in Image Recognition", student: "Charlie Brown", time: "May 15, 09:15", location: "Room C-310" },
    ],
  },
  teacher: {
    supervisedProjects: 4,
    juryParticipations: 8,
    requiredParticipations: 12,
    upcomingPresentations: [
      { id: 1, topic: "AI-Based Medical Diagnosis", student: "Alice Johnson", role: "Supervisor", time: "Today, 14:00", location: "Room A-101" },
      { id: 2, topic: "Blockchain for Supply Chain", student: "Bob Smith", role: "Jury President", time: "Tomorrow, 10:30", location: "Room B-205" },
    ],
  },
  student: {
    topic: "Machine Learning for Predictive Maintenance",
    supervisor: "Dr. Jane Smith",
    presentationStatus: "Scheduled",
    presentationDate: "May 20, 11:00",
    presentationLocation: "Room D-405",
    jury: ["Dr. Jane Smith (Supervisor)", "Dr. Robert Johnson (President)", "Dr. Emily Brown (Reporter)"],
  },
  admin: {
    totalUsers: 138,
    totalDepartments: 5,
    totalTopics: 87,
    systemAlerts: [
      { id: 1, type: "error", message: "Excel import failed for Computer Science department" },
      { id: 2, type: "warning", message: "5 user accounts inactive for more than 30 days" },
    ],
  },
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) return null;
  
  const renderRoleSpecificDashboard = () => {
    switch (user.role as UserRole) {
      case "departmentHead":
        return renderDepartmentHeadDashboard();
      case "teacher":
        return renderTeacherDashboard();
      case "student":
        return renderStudentDashboard();
      case "admin":
        return renderAdminDashboard();
      default:
        return <p>Unknown role</p>;
    }
  };

  const renderDepartmentHeadDashboard = () => {
    const data = dashboardData.departmentHead;
    
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <FileSpreadsheet className="mr-2 text-navy h-5 w-5" />
                Total Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.totalTopics}</div>
              <p className="text-sm text-muted-foreground">
                {data.scheduledPresentations} scheduled, {data.pendingPresentations} pending
              </p>
            </CardContent>
          </Card>
          
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Calendar className="mr-2 text-navy h-5 w-5" />
                Presentations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.scheduledPresentations}</div>
              <p className="text-sm text-muted-foreground">
                {data.pendingPresentations} still need scheduling
              </p>
            </CardContent>
          </Card>
          
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Users className="mr-2 text-navy h-5 w-5" />
                Teachers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.totalTeachers}</div>
              <p className="text-sm text-muted-foreground">
                In {user.department} department
              </p>
            </CardContent>
          </Card>
          
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <BarChart3 className="mr-2 text-navy h-5 w-5" />
                Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Math.round((data.scheduledPresentations / data.totalTopics) * 100)}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-navy h-2.5 rounded-full"
                  style={{ width: `${(data.scheduledPresentations / data.totalTopics) * 100}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Upcoming Presentations</CardTitle>
              <CardDescription>
                Next scheduled presentations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.upcomingPresentations.map((presentation) => (
                  <div key={presentation.id} className="flex items-start p-3 rounded-lg bg-gray-50 border">
                    <Clock className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-medium">{presentation.topic}</h4>
                      <p className="text-sm text-muted-foreground">
                        {presentation.student} - {presentation.time}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {presentation.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Alerts</CardTitle>
              <CardDescription>
                Items needing your attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.alerts.map((alert) => (
                  <Alert key={alert.id} variant={alert.type === "error" ? "destructive" : "default"}>
                    {alert.type === "error" ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : alert.type === "warning" ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    <AlertTitle className="text-sm font-medium">
                      {alert.type === "error"
                        ? "Critical"
                        : alert.type === "warning"
                        ? "Warning"
                        : "Information"}
                    </AlertTitle>
                    <AlertDescription className="text-sm">
                      {alert.message}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  };

  const renderTeacherDashboard = () => {
    const data = dashboardData.teacher;
    
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <FileSpreadsheet className="mr-2 text-navy h-5 w-5" />
                Supervised Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.supervisedProjects}</div>
            </CardContent>
          </Card>
          
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Users className="mr-2 text-navy h-5 w-5" />
                Jury Participations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.juryParticipations}</div>
              <p className="text-sm text-muted-foreground">
                Out of {data.requiredParticipations} required
              </p>
            </CardContent>
          </Card>
          
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <BarChart3 className="mr-2 text-navy h-5 w-5" />
                Participation Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Math.round((data.juryParticipations / data.requiredParticipations) * 100)}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className={`h-2.5 rounded-full ${
                    data.juryParticipations / data.requiredParticipations < 0.7
                      ? "bg-red-500"
                      : data.juryParticipations / data.requiredParticipations < 1
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${(data.juryParticipations / data.requiredParticipations) * 100}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Upcoming Presentations</CardTitle>
            <CardDescription>
              Where you are participating as supervisor or jury member
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.upcomingPresentations.map((presentation) => (
                <div key={presentation.id} className="flex items-start p-3 rounded-lg bg-gray-50 border">
                  <Clock className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium">{presentation.topic}</h4>
                    <p className="text-sm text-muted-foreground">
                      {presentation.student} - {presentation.role}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {presentation.time} - {presentation.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </>
    );
  };

  const renderStudentDashboard = () => {
    const data = dashboardData.student;
    
    return (
      <>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>My PFE Topic</CardTitle>
            <CardDescription>
              Details about your final project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Topic</h4>
                <p className="text-lg font-semibold">{data.topic}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Supervisor</h4>
                <p>{data.supervisor}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-3 h-3 rounded-full ${
                      data.presentationStatus === "Scheduled"
                        ? "bg-green-500"
                        : data.presentationStatus === "Pending"
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                    }`}
                  ></span>
                  <span>{data.presentationStatus}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Presentation Details</CardTitle>
              <CardDescription>
                When and where your presentation will take place
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Date & Time</h4>
                  <p>{data.presentationDate}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Location</h4>
                  <p>{data.presentationLocation}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Jury Members</CardTitle>
              <CardDescription>
                Who will evaluate your presentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.jury.map((member, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-navy" />
                    <span>{member}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </>
    );
  };

  const renderAdminDashboard = () => {
    const data = dashboardData.admin;
    
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Users className="mr-2 text-navy h-5 w-5" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.totalUsers}</div>
            </CardContent>
          </Card>
          
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <FileSpreadsheet className="mr-2 text-navy h-5 w-5" />
                Departments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.totalDepartments}</div>
            </CardContent>
          </Card>
          
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Calendar className="mr-2 text-navy h-5 w-5" />
                PFE Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.totalTopics}</div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
            <CardDescription>
              Issues requiring administrator attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.systemAlerts.map((alert) => (
                <Alert key={alert.id} variant={alert.type === "error" ? "destructive" : "default"}>
                  {alert.type === "error" ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertTitle className="text-sm font-medium">
                    {alert.type === "error" ? "Critical Issue" : "Warning"}
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    {alert.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      </>
    );
  };

  return (
    <div className="py-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-navy">
          Welcome, {user.firstName} {user.lastName}
        </h1>
        
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full bg-green-500"
              title="System Status: Online"
            ></div>
            <span>System online</span>
          </div>
        </div>
      </div>
      
      {renderRoleSpecificDashboard()}
    </div>
  );
};

export default Dashboard;
