"use client";

import { useState } from "react";
import EditAttendanceModal from "./EditAttendanceModal";
import SearchBar from "./SearchBar";
import StudentList from "./StudentList";
import { type Student } from "./types";

const MOCK_STUDENTS: Student[] = [
  {
    id: "1",
    name: "Avery Johnson",
    email: "avery.johnson@example.edu",
    attendance: 93,
  },
  {
    id: "2",
    name: "Morgan Lee",
    email: "morgan.lee@example.edu",
    attendance: 87,
  },
  {
    id: "3",
    name: "Jordan Kim",
    email: "jordan.kim@example.edu",
    attendance: 76,
  },
  {
    id: "4",
    name: "Taylor Smith",
    email: "taylor.smith@example.edu",
    attendance: 98,
  },
  {
    id: "5",
    name: "Riley Patel",
    email: "riley.patel@example.edu",
    attendance: 82,
  },
  {
    id: "6",
    name: "Cameron Davis",
    email: "cameron.davis@example.edu",
    attendance: 90,
  },
];

export default function InstructorDashboardClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenModal = (student: Student) => {
    setSelectedStudent(student);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedStudent(null);
  };

  const handleSaveAttendance = (updatedStudent: Student) => {
    setStudents((previousStudents) =>
      previousStudents.map((student) =>
        student.id === updatedStudent.id ? updatedStudent : student,
      ),
    );
    handleCloseModal();
  };

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">
          Instructor Dashboard
        </h1>
        <p className="text-sm text-gray-600">
          Search students and update attendance records.
        </p>
      </header>

      <SearchBar onSearch={setSearchQuery} />

      <StudentList
        students={students}
        searchQuery={searchQuery}
        onEdit={handleOpenModal}
      />

      <EditAttendanceModal
        student={selectedStudent}
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveAttendance}
      />
    </section>
  );
}
