
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
  Sidebar, 
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInput
} from "@/components/ui/sidebar";
import { Pencil, Plus, Search, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/utils/api";

type Teacher = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  rank: string;
};

const TeacherSidebar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Fetch teachers
  const { data: teachers, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await api.get('/teachers');
      return response.data.data;
    }
  });

  // Delete teacher mutation
  const deleteTeacherMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/teachers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast({
        title: "Success",
        description: "Teacher deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete teacher: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Filter teachers based on search
  const filteredTeachers = teachers?.filter((teacher: Teacher) => {
    const fullName = `${teacher.firstName} ${teacher.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           teacher.department.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Handle teacher deletion with confirmation
  const handleDeleteTeacher = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      deleteTeacherMutation.mutate(id);
    }
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-between px-2">
            <SidebarGroupLabel>Teachers</SidebarGroupLabel>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/teachers/new')}
              className="h-7 w-7"
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add Teacher</span>
            </Button>
          </div>
          <div className="px-2 pb-2">
            <SidebarInput
              placeholder="Search teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <SidebarMenuItem key={index}>
                    <div className="flex items-center gap-2 h-8 animate-pulse">
                      <div className="w-5 h-5 rounded-full bg-gray-200" />
                      <div className="w-32 h-4 rounded bg-gray-200" />
                    </div>
                  </SidebarMenuItem>
                ))
              ) : filteredTeachers?.length > 0 ? (
                filteredTeachers.map((teacher: Teacher) => (
                  <SidebarMenuItem key={teacher._id}>
                    <SidebarMenuButton tooltip={`${teacher.firstName} ${teacher.lastName}`}>
                      <User className="h-4 w-4" />
                      <span>{teacher.firstName} {teacher.lastName}</span>
                    </SidebarMenuButton>
                    <div className="flex space-x-1 absolute right-1 top-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => navigate(`/teachers/${teacher._id}/edit`)}
                      >
                        <Pencil className="h-3 w-3" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-5 w-5 text-destructive"
                        onClick={() => handleDeleteTeacher(teacher._id, `${teacher.firstName} ${teacher.lastName}`)}
                      >
                        <Trash2 className="h-3 w-3" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </SidebarMenuItem>
                ))
              ) : (
                <div className="px-2 py-3 text-sm text-muted-foreground">
                  {searchTerm ? "No teachers match your search" : "No teachers found"}
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default TeacherSidebar;
