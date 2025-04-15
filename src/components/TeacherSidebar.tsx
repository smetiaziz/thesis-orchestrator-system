
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { Teacher } from "@/types";
import { Link, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Plus, Edit, Trash } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const TeacherSidebar: React.FC = () => {
  const navigate = useNavigate();
  const { data: teachersData, refetch } = useQuery<{ success: boolean; data: Teacher[] }>({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await api.get('/teachers');
      return response;
    }
  });

  const teachers = teachersData?.data || [];

  const handleDeleteTeacher = async (teacherId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (window.confirm("Are you sure you want to delete this teacher?")) {
      try {
        await api.delete(`/teachers/${teacherId}`);
        toast({
          title: "Success",
          description: "Teacher deleted successfully.",
        });
        refetch();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete teacher.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <SidebarProvider>
      <Sidebar className="md:w-60">
        <SidebarHeader>
          <SidebarTrigger className="md:hidden" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Teachers</SidebarGroupLabel>
            <SidebarMenu>
              {teachers.map((teacher) => (
                <SidebarMenuItem key={teacher.id}>
                  <SidebarMenuButton asChild>
                    <Link to={`/admin/teachers/${teacher.id}/edit`}>
                      {teacher.firstName} {teacher.lastName}
                    </Link>
                  </SidebarMenuButton>
                  <SidebarMenuAction asChild>
                    <button onClick={(e) => handleDeleteTeacher(teacher.id, e)}>
                      <Trash className="h-4 w-4" />
                    </button>
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarSeparator />
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/admin/teachers/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Teacher
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
};

export default TeacherSidebar;
