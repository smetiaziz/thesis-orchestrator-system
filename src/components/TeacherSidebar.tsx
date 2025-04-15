import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { Teacher } from "@/types";
import { Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Plus } from "lucide-react";

const TeacherSidebar: React.FC = () => {
  const { data: teachersData } = useQuery<{ success: boolean; data: Teacher[] }>({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await api.get('/teachers');
      return response;
    }
  });

  const teachers = teachersData?.data || [];

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
                    <Link to={`/admin/teachers/${teacher.id}`}>{teacher.firstName} {teacher.lastName}</Link>
                  </SidebarMenuButton>
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
