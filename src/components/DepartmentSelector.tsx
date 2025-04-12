
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
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
      <FormItem>
        <FormLabel>{label}{required && " *"}</FormLabel>
        <FormControl>
          <Select disabled value="" onValueChange={() => {}}>
            <SelectTrigger>
              <SelectValue placeholder="Failed to load departments" />
            </SelectTrigger>
          </Select>
        </FormControl>
        <FormMessage>Failed to load departments</FormMessage>
      </FormItem>
    );
  }

  return (
    <FormItem>
      <FormLabel>{label}{required && " *"}</FormLabel>
      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <FormControl>
          <Select 
            disabled={disabled || isLoading} 
            value={value} 
            onValueChange={onValueChange}
          >
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {departments.length === 0 ? (
                <SelectItem value="" disabled>
                  No departments available
                </SelectItem>
              ) : (
                departments.map((dept) => (
                  <SelectItem key={dept._id} value={dept._id}>
                    {dept.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </FormControl>
      )}
    </FormItem>
  );
};

export default DepartmentSelector;
