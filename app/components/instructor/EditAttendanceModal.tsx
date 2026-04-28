//Nolan Mackie
//U44215554
//nmackie@bu.edu

"use client";

import { useEffect, useState } from "react";
import { type Student } from "./types";

type EditAttendanceModalProps = {
  student: Student | null;
  classId: string | null;
  isOpen: boolean;
  onClose: () => void;
  /** Called after a successful server save (e.g. refetch roster). */
  onSave: () => void;
};

export default function EditAttendanceModal({
  student,
  classId,
  isOpen,
  onClose,
  onSave,
}: EditAttendanceModalProps) {
  const [attendanceInput, setAttendanceInput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Sync form field with selected student.
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

  const handleSave = async () => {
    if (!classId) {
      setError("No class selected");
      return;
    }
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
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/students/attendance-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          email: student.email,
          classId,
          percent: Math.round(parsedAttendance),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Save failed");
        return;
      }
      onSave();
      onClose();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
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
              // Clear stale error while user edits.
              if (error) {
                setError(null);
              }
            }}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            disabled={saving}
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
