import getCollection, {
  ATTENDANCE_COLLECTION,
  SESSIONS_COLLECTION,
} from "@/db";
import type { UserDoc } from "@/lib/types";

/**
 * Present + late count as "attended". Denominator = number of sessions for this class.
 * If an instructor set `attendanceOverrideByClass`, that wins (0–100).
 */
export async function getAttendancePercentForClass(
  studentEmail: string,
  classId: string,
  user: UserDoc | null,
): Promise<number> {
  const key = classId;
  const override = user?.attendanceOverrideByClass?.[key];
  if (typeof override === "number" && !Number.isNaN(override)) {
    return Math.min(100, Math.max(0, Math.round(override)));
  }

  const sessionsCol = await getCollection(SESSIONS_COLLECTION);
  const totalSessions = await sessionsCol.countDocuments({ classId });
  if (totalSessions === 0) {
    return 0;
  }

  const attCol = await getCollection(ATTENDANCE_COLLECTION);
  const rows = await attCol
    .find({ classId, studentEmail })
    .toArray();
  const attended = rows.filter(
    (r) => r.status === "present" || r.status === "late",
  ).length;
  return Math.min(
    100,
    Math.round((100 * attended) / totalSessions),
  );
}
