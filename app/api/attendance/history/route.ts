import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import getCollection, {
  ATTENDANCE_COLLECTION,
  CLASSES_COLLECTION,
} from "@/db";
import type { ActionResult, AttendanceDoc } from "@/lib/types";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

type HistoryRow = {
  _id: string;
  date: string;
  sessionName: string;
  status: AttendanceDoc["status"];
  notes?: string;
  classId: string;
};

type ClassOption = { classId: string; code: string; name: string };

function resolveClassObjectId(classId: string): ObjectId | null {
  if (ObjectId.isValid(classId) && new ObjectId(classId).toString() === classId) {
    return new ObjectId(classId);
  }
  return null;
}

/**
 * GET ?classId=optional — signed-in user's own attendance rows.
 * Mongo filter: { studentEmail: <session email>, classId?: <resolved id> }.
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json<ActionResult>(
      { ok: false, error: "Not signed in" },
      { status: 401 },
    );
  }

  const email = session.user.email;
  const classIdParam = new URL(request.url).searchParams.get("classId");

  const attendanceCol = await getCollection(ATTENDANCE_COLLECTION);
  const classesCol = await getCollection(CLASSES_COLLECTION);

  let resolvedClassId: string | undefined;
  if (classIdParam) {
    const oid = resolveClassObjectId(classIdParam);
    const classDoc = await classesCol.findOne(
      oid ? { _id: oid } : { code: classIdParam.toUpperCase() },
    );
    if (!classDoc) {
      return NextResponse.json<ActionResult>(
        { ok: false, error: "Class not found" },
        { status: 404 },
      );
    }
    resolvedClassId = String(classDoc._id);
  }

  const match: { studentEmail: string; classId?: string } = {
    studentEmail: email,
  };
  if (resolvedClassId) {
    match.classId = resolvedClassId;
  }

  const rows = await attendanceCol
    .find(match)
    .sort({ scannedAt: -1 })
    .toArray();

  const distinctClassIds = (await attendanceCol.distinct("classId", {
    studentEmail: email,
  })) as string[];

  const classOptions: ClassOption[] = [];
  for (const cid of distinctClassIds) {
    const oid = resolveClassObjectId(String(cid));
    const c = oid
      ? await classesCol.findOne({ _id: oid })
      : await classesCol.findOne({ code: String(cid).toUpperCase() });
    if (c?._id) {
      classOptions.push({
        classId: String(c._id),
        code: c.code as string,
        name: c.name as string,
      });
    }
  }
  classOptions.sort((a, b) => a.code.localeCompare(b.code));

  const uniqueRowClassIds = [...new Set(rows.map((r) => String(r.classId)))];
  const oids = uniqueRowClassIds
    .filter((id) => resolveClassObjectId(id))
    .map((id) => resolveClassObjectId(id)!);
  const classDocs =
    oids.length > 0
      ? await classesCol.find({ _id: { $in: oids } }).toArray()
      : [];
  const classById = new Map(
    classDocs.map((d) => [String(d._id), d] as const),
  );

  const records: HistoryRow[] = rows.map((r) => {
    const cid = String(r.classId);
    const c = classById.get(cid);
    const code = (c?.code as string) ?? "Class";
    const scanned =
      r.scannedAt instanceof Date
        ? r.scannedAt
        : new Date(r.scannedAt as string);
    const dateStr = scanned.toISOString().slice(0, 10);
    return {
      _id: String(r._id),
      date: dateStr,
      sessionName: `${code} — ${dateStr}`,
      status: r.status,
      notes: r.notes,
      classId: cid,
    };
  });

  return NextResponse.json<
    ActionResult<{ records: HistoryRow[]; classes: ClassOption[] }>
  >({
    ok: true,
    data: { records, classes: classOptions },
  });
}
