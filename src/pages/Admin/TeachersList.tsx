
import React from "react";
import TeacherSidebar from "@/components/TeacherSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Outlet, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { Teacher } from "@/types";

const TeachersList: React.FC = () => {
  const { id } = useParams();
  
  // Add a query to load teachers data
  const { data: teachersData } = useQuery<{ success: boolean; data: Teacher[] }>({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Teacher[] }>('/teachers');
      return response;
    }
  });

  const teachers = teachersData?.data || [];
  const hasTeachers = teachers.length > 0;
  
  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <TeacherSidebar />
        <SidebarInset>
          <div className="p-6 animate-fade-in">
            {!id && (
              <>
                <h1 className="text-2xl font-bold text-navy mb-6">Teacher Management</h1>
                {!hasTeachers ? (
                  <div className="bg-card p-4 rounded-lg border">
                    <p className="text-muted-foreground">
                      No teachers found. Use the + button to add a new teacher.
                    </p>
                  </div>
                ) : (
                  <div className="bg-card p-4 rounded-lg border">
                    <p className="text-muted-foreground">
                      Select a teacher from the sidebar to view or edit their details,
                      or use the + button to add a new teacher.
                    </p>
                  </div>
                )}
              </>
            )}
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default TeachersList;
