// Danaid Sinani
// Handles class roster and student attendance summary queries.
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
 * Roster for a class: students enrolled, those who have checked in, or both.
 * `q` optional search on name or email.
 */
export async function GET(request: Request) {
  const { session, errorResponse } = await getInstructorOrAdminSession();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();

  if (!classId) {
    return NextResponse.json<ActionResult>(
      { ok: false, error: "classId is required" },
      { status: 400 },
    );
  }

  const classes = await getCollection(CLASSES_COLLECTION);
  let classFilter: { _id?: ObjectId; code?: string } = {};
  if (ObjectId.isValid(classId) && new ObjectId(classId).toString() === classId) {
    classFilter = { _id: new ObjectId(classId) };
  } else {
    classFilter = { code: classId.toUpperCase() };
  }
  const classDoc = await classes.findOne(classFilter);
  if (!classDoc) {
    return NextResponse.json<ActionResult>(
      { ok: false, error: "Class not found" },
      { status: 404 },
    );
  }

  const role = (session!.user as { role?: string }).role;
  const isOwner = classDoc.instructorEmail === session!.user!.email;
  if (role !== "admin" && !isOwner) {
    return NextResponse.json<ActionResult>(
      { ok: false, error: "Not allowed to view this class" },
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
        students: {
          id: string;
          name: string;
          email: string;
          attendance: number;
        }[];
      }>
    >({
      ok: true,
      data: { students: [] },
    });
  }

  const users = await getCollection(USERS_COLLECTION);
  const base = {
    role: "student" as const,
    email: { $in: [...emailSet] as string[] },
  };
  const query = q
    ? {
        $and: [
          base,
          {
            $or: [
              { name: { $regex: q, $options: "i" } },
              { email: { $regex: q, $options: "i" } },
            ],
          },
        ],
      }
    : base;

  const list = await users.find(query).sort({ name: 1 }).toArray();
  const students: {
    id: string;
    name: string;
    email: string;
    attendance: number;
  }[] = [];

  for (const u of list) {
    const user = u as unknown as UserDoc;
    const email = user.email;
    if (!email) continue;
    const percent = await getAttendancePercentForClass(email, cid, user);
    students.push({
      id: email,
      name: user.name || email,
      email,
      attendance: percent,
    });
  }

  return NextResponse.json<
    ActionResult<{
      students: {
        id: string;
        name: string;
        email: string;
        attendance: number;
      }[];
    }>
  >({
    ok: true,
    data: { students },
  });
}
