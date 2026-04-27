import { NextResponse } from "next/server";
import getCollection, {
  ATTENDANCE_COLLECTION,
  CLASSES_COLLECTION,
  USERS_COLLECTION,
} from "@/db";
import { getInstructorOrAdminSession } from "@/lib/api-helpers";
import type { UserDoc } from "@/lib/types";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

/**
 * CSV of all attendance rows for a class: email, name, date, status, session.
 */
export async function GET(request: Request) {
  const { session, errorResponse } = await getInstructorOrAdminSession();
  if (errorResponse) return errorResponse;

  const classId = new URL(request.url).searchParams.get("classId");
  if (!classId) {
    return new NextResponse("classId is required", { status: 400 });
  }

  const classes = await getCollection(CLASSES_COLLECTION);
  const classFilter: { _id?: ObjectId; code?: string } = ObjectId.isValid(
    classId,
  ) && new ObjectId(classId).toString() === classId
    ? { _id: new ObjectId(classId) }
    : { code: classId.toUpperCase() };
  const classDoc = await classes.findOne(classFilter);
  if (!classDoc) {
    return new NextResponse("Class not found", { status: 404 });
  }

  if (
    (session!.user as { role?: string }).role !== "admin" &&
    classDoc.instructorEmail !== session!.user!.email
  ) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const cid = String(classDoc._id);
  const att = await getCollection(ATTENDANCE_COLLECTION);
  const rows = await att
    .find({ classId: cid })
    .sort({ scannedAt: 1 })
    .toArray();
  const users = await getCollection(USERS_COLLECTION);

  const header = "name,email,date,status,notes,sessionId\n";
  const lines: string[] = [header];
  for (const r of rows) {
    const u = (await users.findOne({
      email: r.studentEmail,
    })) as UserDoc | null;
    const name = (u?.name ?? r.studentEmail).replaceAll('"', '""');
    const date =
      r.scannedAt instanceof Date
        ? r.scannedAt.toISOString()
        : String(r.scannedAt);
    const notes = (r.notes ?? "").replaceAll('"', '""');
    const row = [
      `"${name}"`,
      r.studentEmail,
      date,
      r.status,
      `"${notes}"`,
      r.sessionId,
    ].join(",");
    lines.push(row + "\n");
  }

  const filename = `attendance-${(classDoc.code as string) || "class"}-${cid.slice(-6)}.csv`;
  return new NextResponse(lines.join(""), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
