import { type Student } from "./types";

type StudentCardProps = {
  student: Student;
  onEdit: (student: Student) => void;
};

export default function StudentCard({ student, onEdit }: StudentCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-gray-900">{student.name}</h3>
        <p className="text-sm text-gray-600">{student.email}</p>
        <p className="text-sm text-gray-700">Attendance: {student.attendance}%</p>
      </div>

      <button
        type="button"
        onClick={() => onEdit(student)}
        className="mt-4 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        Edit Attendance
      </button>
    </div>
  );
}
