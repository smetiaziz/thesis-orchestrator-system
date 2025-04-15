import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/utils/api";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";

const teacherFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  department: z.string().min(1, {
    message: "Department must be selected.",
  }),
  rank: z.string().min(1, {
    message: "Rank must be selected.",
  }),
  course: z.number().min(0, {
    message: "Course hours must be a non-negative number.",
  }),
  td: z.number().min(0, {
    message: "TD hours must be a non-negative number.",
  }),
  tp: z.number().min(0, {
    message: "TP hours must be a non-negative number.",
  }),
  coefficient: z.number().min(1, {
    message: "Coefficient must be at least 1.",
  }),
  numSupervisionSessions: z.number().min(0, {
    message: "Number of supervision sessions must be a non-negative number.",
  }),
});

interface TeacherFormProps {
  teacherId?: string;
  initialData?: Teacher;
}

const TeacherForm: React.FC<TeacherFormProps> = ({ teacherId, initialData }) => {
  const [departments, setDepartments] = useState<{ id: string; name: string; }[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get<{ success: boolean; data: { id: string; name: string; }[]>}>('/departments');
        if (response.success) {
          setDepartments(response.data);
        } else {
          toast({
            title: "Error fetching departments",
            description: "Failed to load departments. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error fetching departments",
          description: "Failed to load departments. Please check your network connection.",
          variant: "destructive",
        });
      }
    };

    fetchDepartments();
  }, []);

  const form = useForm<z.infer<typeof teacherFormSchema>>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      email: initialData?.email || "",
      department: initialData?.department || "",
      rank: initialData?.rank || "",
      course: initialData?.course || 0,
      td: initialData?.td || 0,
      tp: initialData?.tp || 0,
      coefficient: initialData?.coefficient || 1,
      numSupervisionSessions: initialData?.numSupervisionSessions || 0,
    },
    mode: "onChange",
  });

  const { setValue, handleSubmit, formState: { isValid } } = form;

  async function onSubmit(values: z.infer<typeof teacherFormSchema>) {
    try {
      if (teacherId) {
        // Update existing teacher
        await api.put(`/teachers/${teacherId}`, values);
        toast({
          title: "Success",
          description: "Teacher updated successfully.",
        });
      } else {
        // Create new teacher
        await api.post('/teachers', values);
        toast({
          title: "Success",
          description: "Teacher created successfully.",
        });
      }
      navigate('/admin/teachers');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save teacher. Please try again.",
        variant: "destructive",
      });
    }
  }

  const DepartmentSelector: React.FC<{ defaultValue: string; onSelect: (value: string) => void }> = ({ defaultValue, onSelect }) => {
    return (
      <FormField
        control={form.control}
        name="department"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Department</FormLabel>
            <Select onValueChange={(value) => {
              field.onChange(value);
              onSelect(value);
            }} defaultValue={defaultValue}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.name}>{department.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-fade-in">
      <FormField
        control={form.control}
        name="firstName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>First Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter first name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="lastName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Last Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter last name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input placeholder="Enter email" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <DepartmentSelector 
        defaultValue={initialData?.department || ''} 
        onSelect={(value: string) => setValue('department', value)}
      />
      
      <FormField
        control={form.control}
        name="rank"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Rank</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a rank" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Professor">Professor</SelectItem>
                <SelectItem value="Assistant Professor">Assistant Professor</SelectItem>
                <SelectItem value="Associate Professor">Associate Professor</SelectItem>
                <SelectItem value="Lecturer">Lecturer</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="course"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Course Hours</FormLabel>
            <FormControl>
              <Input type="number" placeholder="Enter course hours" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="td"
        render={({ field }) => (
          <FormItem>
            <FormLabel>TD Hours</FormLabel>
            <FormControl>
              <Input type="number" placeholder="Enter TD hours" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="tp"
        render={({ field }) => (
          <FormItem>
            <FormLabel>TP Hours</FormLabel>
            <FormControl>
              <Input type="number" placeholder="Enter TP hours" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="coefficient"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Coefficient</FormLabel>
            <FormControl>
              <Input type="number" placeholder="Enter coefficient" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="numSupervisionSessions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Number of Supervision Sessions</FormLabel>
            <FormControl>
              <Input type="number" placeholder="Enter number of supervision sessions" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button type="submit" disabled={!isValid}>
        {teacherId ? "Update Teacher" : "Create Teacher"}
      </Button>
    </form>
  );
};

export default TeacherForm;
