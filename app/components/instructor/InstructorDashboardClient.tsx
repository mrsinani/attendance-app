//Nolan Mackie
//U44215554
//nmackie@bu.edu

"use client";

import { useCallback, useEffect, useState } from "react";
import EditAttendanceModal from "./EditAttendanceModal";
import SearchBar from "./SearchBar";
import StudentList from "./StudentList";
import { type Student } from "./types";

type ClassItem = { _id: string; name: string; code: string };

type Stats = {
  average: number;
  highest: { name: string; email: string; percent: number } | null;
  lowest: { name: string; email: string; percent: number } | null;
  studentCount: number;
};

export default function InstructorDashboardClient() {
  // Dashboard state: search, list, and edit modal.
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [newClassName, setNewClassName] = useState("");
  const [newClassCode, setNewClassCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const loadClasses = useCallback(async () => {
    setLoadingClasses(true);
    setRosterError(null);
    try {
      const res = await fetch("/api/classes", { credentials: "same-origin" });
      const json = await res.json();
      if (json.ok && json.data?.classes) {
        setClasses(json.data.classes);
        setSelectedClassId((prev) => {
          if (prev && json.data.classes.some((c: ClassItem) => c._id === prev)) {
            return prev;
          }
          return json.data.classes[0]?._id ?? "";
        });
      } else {
        setRosterError(json.error ?? "Could not load classes");
      }
    } catch {
      setRosterError("Could not load classes");
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  const loadRoster = useCallback(async () => {
    if (!selectedClassId) {
      setStudents([]);
      return;
    }
    setLoadingRoster(true);
    setRosterError(null);
    try {
      const res = await fetch(
        `/api/students?classId=${encodeURIComponent(selectedClassId)}&q=${encodeURIComponent(debouncedQ)}`,
        { credentials: "same-origin" },
      );
      const json = await res.json();
      if (json.ok && json.data?.students) {
        setStudents(json.data.students);
      } else {
        setRosterError(json.error ?? "Could not load students");
        setStudents([]);
      }
    } catch {
      setRosterError("Could not load students");
      setStudents([]);
    } finally {
      setLoadingRoster(false);
    }
  }, [selectedClassId, debouncedQ]);

  useEffect(() => {
    void loadRoster();
  }, [loadRoster]);

  const loadStats = useCallback(async () => {
    if (!selectedClassId) {
      setStats(null);
      return;
    }
    try {
      const res = await fetch(
        `/api/attendance/stats?classId=${encodeURIComponent(selectedClassId)}`,
        { credentials: "same-origin" },
      );
      const json = await res.json();
      if (json.ok && json.data) {
        setStats(json.data);
      } else {
        setStats(null);
      }
    } catch {
      setStats(null);
    }
  }, [selectedClassId]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    const name = newClassName.trim();
    const code = newClassCode.trim();
    if (!name || !code) {
      setCreateError("Name and code are required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name, code }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setCreateError(json.error ?? "Create failed");
        return;
      }
      setNewClassName("");
      setNewClassCode("");
      await loadClasses();
      if (json.data?.class?._id) {
        setSelectedClassId(json.data.class._id);
      }
    } catch {
      setCreateError("Network error");
    } finally {
      setCreating(false);
    }
  };

  const handleOpenModal = (student: Student) => {
    setSelectedStudent(student);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedStudent(null);
  };

  const handleSavedOverride = () => {
    void loadRoster();
    void loadStats();
  };

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">
          Instructor Dashboard
        </h1>
        <p className="text-sm text-gray-600">
          Pick a class, search students, and update attendance. Percentages
          are based on check-ins; you can override with &quot;Edit
          Attendance&quot;.
        </p>
      </header>

      <div className="space-y-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <form onSubmit={handleCreateClass} className="space-y-2">
          <p className="text-sm font-medium text-gray-800">Add a class</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
            <input
              className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Name (e.g. Web App Dev)"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
            />
            <input
              className="w-full min-w-[5rem] rounded-md border border-gray-300 px-3 py-2 text-sm uppercase sm:w-36"
              placeholder="Code (e.g. CS391)"
              value={newClassCode}
              onChange={(e) => setNewClassCode(e.target.value.toUpperCase())}
            />
            <button
              type="submit"
              disabled={creating}
              className="w-full shrink-0 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
          {createError && (
            <p className="text-sm text-red-600">{createError}</p>
          )}
        </form>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="min-w-0 flex-1">
            <label
              className="text-sm font-medium text-gray-800"
              htmlFor="dashboard-class"
            >
              Class for roster
            </label>
            <select
              id="dashboard-class"
              className="mt-1 w-full min-w-0 rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={loadingClasses}
            >
              {classes.length === 0 && (
                <option value="">— Create a class first —</option>
              )}
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
          {selectedClassId && (
            <a
              href={`/api/attendance/export?classId=${encodeURIComponent(selectedClassId)}`}
              className="inline-flex shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100"
            >
              Download CSV
            </a>
          )}
        </div>
      </div>

      {selectedClassId && stats && !loadingRoster && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-gray-500">
              Avg. attendance
            </p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {stats.studentCount > 0 ? `${stats.average}%` : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-gray-500">
              Highest
            </p>
            {stats.highest ? (
              <>
                <p className="mt-1 font-semibold text-gray-900">
                  {stats.highest.name}
                </p>
                <p className="text-sm text-gray-600">{stats.highest.percent}%</p>
              </>
            ) : (
              <p className="mt-1 text-sm text-gray-500">—</p>
            )}
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-gray-500">
              Lowest
            </p>
            {stats.lowest ? (
              <>
                <p className="mt-1 font-semibold text-gray-900">
                  {stats.lowest.name}
                </p>
                <p className="text-sm text-gray-600">{stats.lowest.percent}%</p>
              </>
            ) : (
              <p className="mt-1 text-sm text-gray-500">—</p>
            )}
          </div>
        </div>
      )}

      {rosterError && (
        <p className="text-sm text-red-600">{rosterError}</p>
      )}

      {loadingClasses ? (
        <p className="text-sm text-gray-600">Loading classes…</p>
      ) : null}

      <SearchBar onSearch={setSearchQuery} />

      {selectedClassId ? (
        loadingRoster && students.length === 0 ? (
          <p className="text-sm text-gray-600">Loading roster…</p>
        ) : (
          <StudentList
            students={students}
            searchQuery={searchQuery}
            onEdit={handleOpenModal}
          />
        )
      ) : (
        <p className="text-sm text-amber-800">
          Create a class to see the student roster. Students who check in to that
          class will appear here automatically.
        </p>
      )}

      <EditAttendanceModal
        student={selectedStudent}
        classId={selectedClassId || null}
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSavedOverride}
      />
    </section>
  );
}
