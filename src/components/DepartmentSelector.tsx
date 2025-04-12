
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

interface Department {
  _id: string;
  name: string;
}

interface DepartmentSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

const DepartmentSelector: React.FC<DepartmentSelectorProps> = ({
  value,
  onValueChange,
  label = "Department",
  required = false,
  placeholder = "Select a department",
  disabled = false,
}) => {
  const { data: departmentsResponse, isLoading, error } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      return api.get<{ success: boolean; data: Department[] }>('/departments');
    },
  });

  const departments = departmentsResponse?.data || [];

  if (error) {
    return (
      <div className="space-y-2">
        <Label>{label}{required && " *"}</Label>
        <Select disabled value="error" onValueChange={() => {}}>
          <SelectTrigger>
            <SelectValue placeholder="Failed to load departments" />
          </SelectTrigger>
        </Select>
        <p className="text-sm font-medium text-destructive">Failed to load departments</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label}{required && " *"}</Label>
      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <Select 
          disabled={disabled || isLoading} 
          value={value || "all"} // Ensure there's always a valid value
          onValueChange={onValueChange}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.length === 0 ? (
              <SelectItem value="no-departments">
                No departments available
              </SelectItem>
            ) : (
              departments.map((dept) => (
                <SelectItem key={dept._id} value={dept._id || "unknown"}>
                  {dept.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default DepartmentSelector;
