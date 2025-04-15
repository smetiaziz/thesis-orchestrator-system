
import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ExcelImport from "@/components/ExcelImport";

const DataImport: React.FC = () => {
  const queryClient = useQueryClient();
  
  // Handlers to invalidate the relevant queries after successful import
  const handleTeachersImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['teachers'] });
  };
  
  const handleTopicsImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['topics'] });
  };

  return (
    <div className="p-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-navy mb-6">Data Import</h1>
      
      <Tabs defaultValue="topics">
        <TabsList className="mb-6">
          <TabsTrigger value="topics">PFE Topics</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="topics">
          <Card>
            <CardHeader>
              <CardTitle>Import PFE Topics</CardTitle>
              <CardDescription>
                Import PFE topics data from Excel files. Each row should contain a topic with student and supervisor details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExcelImport 
                endpoint="/import/topics"
                title="Import PFE Topics"
                description="Upload an Excel file containing topic details, student names, and supervisor assignments."
                successMessage="PFE topics have been successfully imported."
                errorMessage="Failed to import PFE topics. Please check your file format."
                onSuccess={handleTopicsImportSuccess}
                templateUrl="/templates/pfe-topics-template.xlsx"
              />
              
              <div className="mt-8 bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-2">Required Columns</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Topic Name</strong>: Name or title of the PFE project</li>
                  <li><strong>Student Name</strong>: Full name of the student</li>
                  <li><strong>Student Email</strong>: Email address of the student</li>
                  <li><strong>Supervisor ID</strong>: ID of the supervising teacher</li>
                  <li><strong>Supervisor Name</strong>: Full name of the supervisor</li>
                  <li><strong>Department</strong>: Department name</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle>Import Teachers</CardTitle>
              <CardDescription>
                Import teacher data from Excel files including teaching loads and department assignments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExcelImport 
                endpoint="/import/teachers"
                title="Import Teacher Data"
                description="Upload an Excel file containing teacher information, teaching loads, and department assignments."
                successMessage="Teachers have been successfully imported."
                errorMessage="Failed to import teachers. Please check your file format."
                onSuccess={handleTeachersImportSuccess}
                templateUrl="/templates/teachers-template.xlsx"
              />
              
              <div className="mt-8 bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-2">Required Columns</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>First Name</strong>: First name of the teacher</li>
                  <li><strong>Last Name</strong>: Last name of the teacher</li>
                  <li><strong>Email</strong>: Email address of the teacher</li>
                  <li><strong>Department</strong>: Department name</li>
                  <li><strong>Rank</strong>: Academic rank (e.g., Professor, Associate, Assistant)</li>
                  <li><strong>Course</strong>: Number of course hours</li>
                  <li><strong>TD</strong>: Number of directed studies hours</li>
                  <li><strong>TP</strong>: Number of practical work hours</li>
                  <li><strong>Coefficient</strong>: Teaching coefficient (default: 1)</li>
                  <li><strong>Number of Supervision Sessions</strong>: Count of supervision sessions</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataImport;
