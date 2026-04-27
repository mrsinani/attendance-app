import { NextResponse } from "next/server";
import getCollection, { CLASSES_COLLECTION, USERS_COLLECTION } from "@/db";
import { getInstructorOrAdminSession } from "@/lib/api-helpers";
import { getAttendancePercentForClass } from "@/lib/attendance-math";
import type { ActionResult, UserDoc } from "@/lib/types";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

/**
 * Instructors can set a manual attendance % (0–100) for a student in a class.
 * Stored on the user as attendanceOverrideByClass[classId].
 */
export async function POST(req: Request) {
  const { session, errorResponse } = await getInstructorOrAdminSession();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const classId = typeof body.classId === "string" ? body.classId.trim() : "";
  const percent = Number(body.percent);
  if (!email || !classId) {
    return NextResponse.json<ActionResult>(
      { ok: false, error: "email and classId are required" },
      { status: 400 },
    );
  }
  if (Number.isNaN(percent) || percent < 0 || percent > 100) {
    return NextResponse.json<ActionResult>(
      { ok: false, error: "percent must be between 0 and 100" },
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

  const role = (session!.user as { role?: string }).role;
  if (
    role !== "admin" &&
    classDoc.instructorEmail !== session!.user!.email
  ) {
    return NextResponse.json<ActionResult>(
      { ok: false, error: "Not allowed" },
      { status: 403 },
    );
  }

  const cid = String(classDoc._id);
  const fieldPath = `attendanceOverrideByClass.${cid}`;

  const col = await getCollection(USERS_COLLECTION);
  const r = await col.updateOne(
    { email, role: "student" },
    { $set: { [fieldPath]: Math.round(percent) } },
  );
  if (r.matchedCount === 0) {
    return NextResponse.json<ActionResult>(
      { ok: false, error: "Student not found" },
      { status: 404 },
    );
  }

  const u = (await col.findOne({ email })) as UserDoc | null;
  const newPercent = u
    ? await getAttendancePercentForClass(email, cid, u)
    : percent;

  return NextResponse.json<
    ActionResult<{
      email: string;
      classId: string;
      attendance: number;
    }>
  >({
    ok: true,
    data: { email, classId: cid, attendance: newPercent },
  });
}
