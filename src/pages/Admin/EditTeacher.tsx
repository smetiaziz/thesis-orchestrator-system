
import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import TeacherForm from "@/components/TeacherForm";
import { api } from "@/utils/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Teacher } from "@/types";

type TeacherResponse = {
  success: boolean;
  data: Teacher;
};

const EditTeacher: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: teacherData, isLoading, error } = useQuery<TeacherResponse>({
    queryKey: ['teacher', id],
    queryFn: async () => {
      if (!id) throw new Error("Teacher ID is required");
      const response = await api.get<TeacherResponse>(`/teachers/${id}`);
      return response;
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
        <Skeleton className="h-12" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      </div>
    );
  }

  if (error || !teacherData) {
    return (
      <div className="p-6 text-destructive">
        <p>Error loading teacher data.</p>
        <p>{error instanceof Error ? error.message : "Unknown error occurred"}</p>
      </div>
    );
  }

  return <TeacherForm teacherId={id} initialData={teacherData.data} />;
};

export default EditTeacher;
