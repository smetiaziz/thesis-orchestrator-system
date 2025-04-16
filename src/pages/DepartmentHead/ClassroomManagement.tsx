
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import DepartmentSelector from "@/components/DepartmentSelector";
import { toast } from "@/components/ui/use-toast";
import { Building2, Plus, Search, Edit, Trash } from "lucide-react";

interface Classroom {
  _id: string;
  name: string;
  building: string;
  capacity: number;
  department: string;
  hasProjector: boolean;
  hasComputers: boolean;
  notes?: string;
}

const ClassroomManagement: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState(user?.department || "");
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [minCapacity, setMinCapacity] = useState("");
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentClassroom, setCurrentClassroom] = useState<Classroom | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Classroom>>({
    name: "",
    building: "",
    capacity: 30,
    department: user?.department || "",
    hasProjector: true,
    hasComputers: false,
    notes: ""
  });
  
  // Fetch classrooms
  const { data: classroomsResponse, isLoading } = useQuery({
    queryKey: ['classrooms', searchTerm, selectedDepartment, selectedBuilding, minCapacity],
    queryFn: async () => {
      let queryParams = new URLSearchParams();
      
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }
      
      if (selectedDepartment) {
        queryParams.append('department', selectedDepartment);
      }
      
      if (selectedBuilding && selectedBuilding !== "all") {
        queryParams.append('building', selectedBuilding);
      }
      
      if (minCapacity) {
        queryParams.append('minCapacity', minCapacity);
      }
      
      return api.get<{ success: boolean; data: Classroom[] }>(`/classrooms?${queryParams.toString()}`);
    }
  });
  
  // Fetch buildings for filter
  const { data: buildingsResponse } = useQuery({
    queryKey: ['classroom-buildings', selectedDepartment],
    queryFn: async () => {
      const params = selectedDepartment ? `?department=${selectedDepartment}` : '';
      return api.get<{ success: boolean; data: string[] }>(`/classrooms/buildings${params}`);
    }
  });

  // Create classroom mutation
  const createClassroomMutation = useMutation({
    mutationFn: async (data: Partial<Classroom>) => {
      return api.post<{ success: boolean; data: Classroom }>('/classrooms', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      queryClient.invalidateQueries({ queryKey: ['classroom-buildings'] });
      setIsEditDialogOpen(false);
      resetForm();
      toast({
        title: "Classroom Created",
        description: "The classroom has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating Classroom",
        description: error.message || "There was an error creating the classroom",
        variant: "destructive",
      });
    }
  });
  
  // Update classroom mutation
  const updateClassroomMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Classroom> }) => {
      return api.put<{ success: boolean; data: Classroom }>(`/classrooms/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      queryClient.invalidateQueries({ queryKey: ['classroom-buildings'] });
      setIsEditDialogOpen(false);
      resetForm();
      toast({
        title: "Classroom Updated",
        description: "The classroom has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Updating Classroom",
        description: error.message || "There was an error updating the classroom",
        variant: "destructive",
      });
    }
  });
  
  // Delete classroom mutation
  const deleteClassroomMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete<{ success: boolean }>(`/classrooms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      setIsDeleteDialogOpen(false);
      setCurrentClassroom(null);
      toast({
        title: "Classroom Deleted",
        description: "The classroom has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting Classroom",
        description: error.message || "There was an error deleting the classroom",
        variant: "destructive",
      });
    }
  });
  
  // Helper functions
  const resetForm = () => {
    setFormData({
      name: "",
      building: "",
      capacity: 30,
      department: user?.department || "",
      hasProjector: true,
      hasComputers: false,
      notes: ""
    });
    setCurrentClassroom(null);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };
  
  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
    }));
  };
  
  const handleEditClick = (classroom: Classroom) => {
    setCurrentClassroom(classroom);
    setFormData({
      name: classroom.name,
      building: classroom.building,
      capacity: classroom.capacity,
      department: classroom.department,
      hasProjector: classroom.hasProjector,
      hasComputers: classroom.hasComputers,
      notes: classroom.notes || ""
    });
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteClick = (classroom: Classroom) => {
    setCurrentClassroom(classroom);
    setIsDeleteDialogOpen(true);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.building || !formData.department) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (currentClassroom) {
      // Update existing classroom
      updateClassroomMutation.mutate({ id: currentClassroom._id, data: formData });
    } else {
      // Create new classroom
      createClassroomMutation.mutate(formData);
    }
  };
  
  const handleDelete = () => {
    if (currentClassroom) {
      deleteClassroomMutation.mutate(currentClassroom._id);
    }
  };
  
  const classrooms = classroomsResponse?.data || [];
  const buildings = buildingsResponse?.data || [];
  
  return (
    <div className="py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-navy">Classroom Management</h1>
        
        <Button onClick={() => { resetForm(); setIsEditDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Classroom
        </Button>
      </div>
      
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search classrooms..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <DepartmentSelector 
            value={selectedDepartment}
            onValueChange={setSelectedDepartment}
            placeholder="All Departments"
            label="Department"
          />
          
          <div className="space-y-2">
            <Label>Building</Label>
            <Select 
              value={selectedBuilding} 
              onValueChange={setSelectedBuilding}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Buildings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Buildings</SelectItem>
                {buildings.map(building => (
                  <SelectItem key={building} value={building}>
                    {building}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Min Capacity</Label>
            <Input
              type="number"
              placeholder="Minimum capacity"
              value={minCapacity}
              onChange={(e) => setMinCapacity(e.target.value)}
              min="0"
            />
          </div>
        </div>
      </Card>
      
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Building</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Features</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">Loading classrooms...</TableCell>
              </TableRow>
            ) : classrooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  No classrooms found with the current filters
                </TableCell>
              </TableRow>
            ) : (
              classrooms.map((classroom) => (
                <TableRow key={classroom._id}>
                  <TableCell className="font-medium">{classroom.name}</TableCell>
                  <TableCell>{classroom.building}</TableCell>
                  <TableCell>{classroom.capacity}</TableCell>
                  <TableCell>{classroom.department}</TableCell>
                  <TableCell>
                    <div className="space-x-2">
                      {classroom.hasProjector && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Projector</span>}
                      {classroom.hasComputers && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Computers</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(classroom)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleDeleteClick(classroom)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
      
      {/* Edit/Create Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {currentClassroom ? "Edit Classroom" : "Add New Classroom"}
            </DialogTitle>
            <DialogDescription>
              {currentClassroom 
                ? "Update the classroom details below."
                : "Fill in the classroom details below to add a new classroom."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="name">Classroom Name*</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="building">Building*</Label>
                <Input
                  id="building"
                  name="building"
                  value={formData.building}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="capacity">Capacity*</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="department">Department*</Label>
                <DepartmentSelector 
                  value={formData.department}
                  onValueChange={(value) => setFormData({...formData, department: value})}
                  placeholder="Select Department"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label>Features</Label>
              <div className="flex gap-6 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hasProjector" 
                    checked={formData.hasProjector} 
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('hasProjector', checked === true)
                    }
                  />
                  <label htmlFor="hasProjector" className="text-sm font-medium">
                    Projector
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hasComputers" 
                    checked={formData.hasComputers} 
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('hasComputers', checked === true)
                    }
                  />
                  <label htmlFor="hasComputers" className="text-sm font-medium">
                    Computers
                  </label>
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                name="notes"
                value={formData.notes || ""}
                onChange={handleInputChange}
                placeholder="Any additional information about this classroom"
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {currentClassroom ? "Update" : "Create"} Classroom
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the classroom "{currentClassroom?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClassroomManagement;
