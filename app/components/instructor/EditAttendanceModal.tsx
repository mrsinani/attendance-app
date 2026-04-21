"use client";

import { useEffect, useState } from "react";
import { type Student } from "./types";

type EditAttendanceModalProps = {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Student) => void;
};

export default function EditAttendanceModal({
  student,
  isOpen,
  onClose,
  onSave,
}: EditAttendanceModalProps) {
  const [attendanceInput, setAttendanceInput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setAttendanceInput(String(student.attendance));
      setError(null);
    } else {
      setAttendanceInput("");
      setError(null);
    }
  }, [student]);

  if (!isOpen || !student) {
    return null;
  }

  const handleSave = () => {
    const trimmedInput = attendanceInput.trim();

    if (!trimmedInput) {
      setError("Attendance is required");
      return;
    }

    const parsedAttendance = Number(trimmedInput);
    if (Number.isNaN(parsedAttendance)) {
      setError("Must be a valid number");
      return;
    }

    if (parsedAttendance < 0 || parsedAttendance > 100) {
      setError("Must be between 0 and 100");
      return;
    }

    const normalizedAttendance = Math.round(parsedAttendance);
    setError(null);
    onSave({ ...student, attendance: normalizedAttendance });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900">
          Edit Attendance
        </h2>
        <p className="mt-1 text-sm text-gray-600">Student: {student.name}</p>
        <p className="text-sm text-gray-600">
          Current attendance: {student.attendance}%
        </p>

        <label className="mt-4 block text-sm font-medium text-gray-700">
          New attendance (%)
          <input
            type="number"
            min={0}
            max={100}
            value={attendanceInput}
            onChange={(event) => {
              setAttendanceInput(event.target.value);
              if (error) {
                setError(null);
              }
            }}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
