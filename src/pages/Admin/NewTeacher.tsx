
import React from "react";
import TeacherForm from "@/components/TeacherForm";

const NewTeacher: React.FC = () => {
  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-6">Add New Teacher</h2>
      <TeacherForm />
    </div>
  );
};

export default NewTeacher;
