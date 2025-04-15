
import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import TeacherForm from "@/components/TeacherForm";
import { api } from "@/utils/api";
import { Skeleton } from "@/components/ui/skeleton";

const EditTeacher: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: teacher, isLoading, error } = useQuery({
    queryKey: ['teacher', id],
    queryFn: async () => {
      if (!id) throw new Error("Teacher ID is required");
      const response = await api.get(`/teachers/${id}`);
      return response.data.data;
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

  if (error || !teacher) {
    return (
      <div className="p-6 text-destructive">
        <p>Error loading teacher data.</p>
        <p>{error instanceof Error ? error.message : "Unknown error occurred"}</p>
      </div>
    );
  }

  return <TeacherForm teacherId={id} initialData={teacher} />;
};

export default EditTeacher;
