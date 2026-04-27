import { NextResponse } from "next/server";
import getCollection, {
  ATTENDANCE_COLLECTION,
  CLASSES_COLLECTION,
  USERS_COLLECTION,
} from "@/db";
import { getInstructorOrAdminSession } from "@/lib/api-helpers";
import { getAttendancePercentForClass } from "@/lib/attendance-math";
import type { ActionResult, UserDoc } from "@/lib/types";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

/**
 * Class-level averages for dashboard: avg %, high/low students.
 */
export async function GET(request: Request) {
  const { session, errorResponse } = await getInstructorOrAdminSession();
  if (errorResponse) return errorResponse;

  const classId = new URL(request.url).searchParams.get("classId");
  if (!classId) {
    return NextResponse.json<ActionResult>(
      { ok: false, error: "classId is required" },
      { status: 400 },
    );
  }

  const classes = await getCollection(CLASSES_COLLECTION);
  const classFilter: { _id?: ObjectId; code?: string } = ObjectId.isValid(
    classId,
  ) && new ObjectId(classId).toString() === classId
    ? { _id: new ObjectId(classId) }
    : { code: classId.toUpperCase() };
  const classDoc = await classes.findOne(classFilter);
  if (!classDoc) {
    return NextResponse.json<ActionResult>(
      { ok: false, error: "Class not found" },
      { status: 404 },
    );
  }

  if (
    (session!.user as { role?: string }).role !== "admin" &&
    classDoc.instructorEmail !== session!.user!.email
  ) {
    return NextResponse.json<ActionResult>(
      { ok: false, error: "Not allowed" },
      { status: 403 },
    );
  }

  const cid = String(classDoc._id);
  const att = await getCollection(ATTENDANCE_COLLECTION);
  const fromAttendance: string[] = await att.distinct("studentEmail", {
    classId: cid,
  });
  const enrolled: string[] = (classDoc.studentEmails as string[]) ?? [];
  const emailSet = new Set<string>([...enrolled, ...fromAttendance]);

  if (emailSet.size === 0) {
    return NextResponse.json<
      ActionResult<{
        average: number;
        highest: { name: string; email: string; percent: number } | null;
        lowest: { name: string; email: string; percent: number } | null;
        studentCount: number;
      }>
    >({
      ok: true,
      data: {
        average: 0,
        highest: null,
        lowest: null,
        studentCount: 0,
      },
    });
  }

  const users = await getCollection(USERS_COLLECTION);
  const rows: { name: string; email: string; percent: number }[] = [];
  for (const email of emailSet) {
    const u = (await users.findOne({
      email,
      role: "student",
    })) as UserDoc | null;
    if (!u) continue;
    const p = await getAttendancePercentForClass(email, cid, u);
    rows.push({
      name: u.name || email,
      email,
      percent: p,
    });
  }

  if (rows.length === 0) {
    return NextResponse.json<
      ActionResult<{
        average: number;
        highest: { name: string; email: string; percent: number } | null;
        lowest: { name: string; email: string; percent: number } | null;
        studentCount: number;
      }>
    >({
      ok: true,
      data: {
        average: 0,
        highest: null,
        lowest: null,
        studentCount: 0,
      },
    });
  }

  const sum = rows.reduce((a, b) => a + b.percent, 0);
  const average = Math.round((sum / rows.length) * 10) / 10;
  const sorted = [...rows].sort((a, b) => b.percent - a.percent);
  const highest = sorted[0]!;
  const lowest = sorted[sorted.length - 1]!;

  return NextResponse.json<
    ActionResult<{
      average: number;
      highest: { name: string; email: string; percent: number };
      lowest: { name: string; email: string; percent: number };
      studentCount: number;
    }>
  >({
    ok: true,
    data: {
      average,
      highest: {
        name: highest.name,
        email: highest.email,
        percent: highest.percent,
      },
      lowest: { name: lowest.name, email: lowest.email, percent: lowest.percent },
      studentCount: rows.length,
    },
  });
}
