import StudentCard from "./StudentCard";
import { type Student } from "./types";

type StudentListProps = {
  students: Student[];
  searchQuery: string;
  onEdit: (student: Student) => void;
};

export default function StudentList({
  students,
  searchQuery,
  onEdit,
}: StudentListProps) {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredStudents = students.filter((student) => {
    if (!normalizedQuery) {
      return true;
    }

    return (
      student.name.toLowerCase().includes(normalizedQuery) ||
      student.email.toLowerCase().includes(normalizedQuery)
    );
  });

  if (filteredStudents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600">
        No students match your search.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filteredStudents.map((student) => (
        <StudentCard key={student.id} student={student} onEdit={onEdit} />
      ))}
    </div>
  );
}
