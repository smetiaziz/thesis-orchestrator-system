
import React from "react";
import TeacherSidebar from "@/components/TeacherSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";

const TeachersList: React.FC = () => {
  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <TeacherSidebar />
        <SidebarInset>
          <div className="p-6 animate-fade-in">
            <h1 className="text-2xl font-bold text-navy mb-6">Teacher Management</h1>
            <div className="bg-card p-4 rounded-lg border">
              <p className="text-muted-foreground">
                Select a teacher from the sidebar to view or edit their details,
                or use the + button to add a new teacher.
              </p>
            </div>
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default TeachersList;
