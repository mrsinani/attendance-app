import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import getCollection, {
  ATTENDANCE_COLLECTION,
  SESSIONS_COLLECTION,
  USERS_COLLECTION,
} from "@/db";
import type { ActionResult, AttendanceDoc } from "@/lib/types";

export const dynamic = "force-dynamic";

type AttendeeRow = {
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  image: string | null;
  scannedAt: string;
};

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" };
  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(" "),
  };
}

/**
 * GET ?sessionId=... — list check-ins for an attendance session (instructor/admin only).
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json<ActionResult>(
      { ok: false, error: "Not signed in" },
      { status: 401 },
    );
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "instructor" && role !== "admin") {
    return NextResponse.json<ActionResult>(
      { ok: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json<ActionResult>(
      { ok: false, error: "sessionId is required" },
      { status: 400 },
    );
  }

  const attendance = await getCollection(ATTENDANCE_COLLECTION);
  const rows = await attendance
    .find({ sessionId })
    .sort({ scannedAt: 1 })
    .toArray();

  const users = await getCollection(USERS_COLLECTION);
  const attendees: AttendeeRow[] = [];

  for (const r of rows) {
    const u = await users.findOne({ email: r.studentEmail });
    const displayName = (u?.name as string | undefined) ?? r.studentEmail;
    const { firstName, lastName } = splitName(displayName);
    attendees.push({
      email: r.studentEmail,
      name: displayName,
      firstName,
      lastName,
      image: (u?.image as string | undefined) ?? null,
      scannedAt:
        r.scannedAt instanceof Date
          ? r.scannedAt.toISOString()
          : String(r.scannedAt),
    });
  }

  return NextResponse.json<ActionResult<{ attendees: AttendeeRow[] }>>({
    ok: true,
    data: { attendees },
  });
}

/**
 * POST — student checks in with a valid qrToken (identity from session, not body).
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json<ActionResult>(
      { ok: false, error: "Not signed in" },
      { status: 401 },
    );
  }

  const { qrToken } = await req.json();
  if (!qrToken || typeof qrToken !== "string") {
    return NextResponse.json<ActionResult>(
      { ok: false, error: "qrToken is required" },
      { status: 400 },
    );
  }

  const email = session.user.email;

  const sessionsCol = await getCollection(SESSIONS_COLLECTION);
  const sess = await sessionsCol.findOne({
    qrToken,
    status: "active",
  });

  if (!sess) {
    return NextResponse.json<ActionResult>(
      { ok: false, error: "Invalid or closed attendance session" },
      { status: 400 },
    );
  }

  const expires = sess.tokenExpiresAt instanceof Date
    ? sess.tokenExpiresAt
    : new Date(sess.tokenExpiresAt as string);
  if (expires < new Date()) {
    return NextResponse.json<ActionResult>(
      { ok: false, error: "This QR code has expired" },
      { status: 400 },
    );
  }

  const sessionIdStr = sess._id ? String(sess._id) : "";
  const classId = String(sess.classId);

  const attendanceCol = await getCollection(ATTENDANCE_COLLECTION);
  const existing = await attendanceCol.findOne({
    sessionId: sessionIdStr,
    studentEmail: email,
  });

  if (existing) {
    return NextResponse.json<
      ActionResult<{ alreadyCheckedIn: boolean; scannedAt: string }>
    >({
      ok: true,
      data: {
        alreadyCheckedIn: true,
        scannedAt:
          existing.scannedAt instanceof Date
            ? existing.scannedAt.toISOString()
            : String(existing.scannedAt),
      },
    });
  }

  const row: Omit<AttendanceDoc, "_id"> = {
    sessionId: sessionIdStr,
    classId,
    studentEmail: email,
    status: "present",
    scannedAt: new Date(),
  };

  const ins = await attendanceCol.insertOne(row);
  if (!ins.acknowledged) {
    return NextResponse.json<ActionResult>(
      { ok: false, error: "Could not record attendance" },
      { status: 500 },
    );
  }

  return NextResponse.json<
    ActionResult<{ scannedAt: string; alreadyCheckedIn: boolean }>
  >({
    ok: true,
    data: {
      scannedAt: row.scannedAt.toISOString(),
      alreadyCheckedIn: false,
    },
  });
}
