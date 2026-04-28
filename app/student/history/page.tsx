/**
 * Page: Attendance History
 * Author: Jackson Pine
 * Purpose: Student attendance history from Mongo (same user + optional classId).
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AttendanceRecord } from "../../components/student/AttendanceTable";
import AttendanceTable from "../../components/student/AttendanceTable";
import Nav from "../../components/Nav";

const Page = styled.div`
  padding: 24px;
  font-family: Arial, sans-serif;
  color: black;
`;

const Header = styled.h1`
  font-size: 20px;
  font-weight: 600;
  margin: 12px 0 20px 0;
`;

const P = styled.p`
  color: #374151;
  margin: 4px 0;
`;

const BackButton = styled.button`
  background: white;
  color: black;
  border: 1px solid black;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 14px;
  &:hover {
    background: black;
    color: white;
  }
`;

const ClassFilter = styled.label`
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 360px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #374151;
`;

const Select = styled.select`
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
`;

export default function AttendanceHistoryPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<
    { classId: string; code: string; name: string }[]
  >([]);
  const [classFilter, setClassFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { status } = useSession();

  const load = useCallback(async (classId: string) => {
    setLoading(true);
    setError(null);
    const qs =
      classId && classId.length > 0
        ? `?classId=${encodeURIComponent(classId)}`
        : "";
    try {
      const res = await fetch(`/api/attendance/history${qs}`, {
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not load history");
        setRecords([]);
        setClasses([]);
        return;
      }
      setRecords(json.data?.records ?? []);
      setClasses(json.data?.classes ?? []);
    } catch {
      setError("Could not load history");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
      return;
    }
    if (status !== "authenticated") {
      return;
    }
    void load(classFilter);
  }, [status, classFilter, load, router]);

  const attendanceCount = records.filter(
    (r) =>
      r.status === "present" ||
      (r.notes?.toLowerCase().includes("excused") ?? false),
  ).length;
  const total = records.length;
  const pct =
    total > 0 ? ((attendanceCount / total) * 100).toFixed(1) : "0.0";

  return (
    <>
      <Nav />
      <Page>
        {status === "loading" ? (
          <P>Loading…</P>
        ) : status === "unauthenticated" ? null : (
          <>
            <BackButton type="button" onClick={() => router.back()}>
              ← Back
            </BackButton>
            <Header>Attendance History</Header>
            {classes.length > 0 && (
              <ClassFilter>
                Filter by class
                <Select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                >
                  <option value="">All classes</option>
                  {classes.map((c) => (
                    <option key={c.classId} value={c.classId}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </Select>
              </ClassFilter>
            )}
            {error && <P style={{ color: "#b91c1c" }}>{error}</P>}
            {loading ? (
              <P>Loading records…</P>
            ) : (
              <>
                {!error && records.length === 0 && (
                  <P>No available records yet. Check in during an active class session to appear here.</P>
                )}
                {total > 0 && (
                  <>
                    <P>
                      You have attended {attendanceCount} / {total} sessions (
                      {pct}%)
                    </P>
                    <P>Remaining allowed absences: — (not set)</P>
                  </>
                )}
                <AttendanceTable records={records} />
              </>
            )}
          </>
        )}
      </Page>
    </>
  );
}
