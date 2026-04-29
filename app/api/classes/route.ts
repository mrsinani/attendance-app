// danaid sinani
// Creates and lists classes for instructors/admins.
import { NextResponse } from "next/server";
import getCollection, { CLASSES_COLLECTION } from "@/db";
import { getInstructorOrAdminSession } from "@/lib/api-helpers";
import type { ActionResult } from "@/lib/types";

export const dynamic = "force-dynamic";

function serializeClass(doc: { _id: unknown; [k: string]: unknown }) {
  return {
    _id: String(doc._id),
    name: doc.name as string,
    code: doc.code as string,
    instructorEmail: doc.instructorEmail as string,
    studentEmails: (doc.studentEmails as string[]) ?? [],
    createdAt:
      doc.createdAt instanceof Date
        ? (doc.createdAt as Date).toISOString()
        : String(doc.createdAt),
  };
}

/**
 * List classes: instructors see their own; admins see all.
 */
export async function GET() {
  const { session, errorResponse } = await getInstructorOrAdminSession();
  if (errorResponse) return errorResponse;
  if (!session?.user?.email) {
    return errorResponse!;
  }

  const col = await getCollection(CLASSES_COLLECTION);
  const role = (session.user as { role?: string }).role;
  const filter =
    role === "admin" ? {} : { instructorEmail: session.user.email };
  const list = await col.find(filter).sort({ code: 1 }).toArray();

  return NextResponse.json<
    ActionResult<{
      classes: ReturnType<typeof serializeClass>[];
    }>
  >({
    ok: true,
    data: { classes: list.map(serializeClass) },
  });
}

/**
 * Create a class owned by the signed-in instructor (admin creates for their own email).
 */
export async function POST(req: Request) {
  const { session, errorResponse } = await getInstructorOrAdminSession();
  if (errorResponse) return errorResponse;
  if (!session?.user?.email) {
    return errorResponse!;
  }

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!name || !code) {
    return NextResponse.json<ActionResult>(
      { ok: false, error: "name and code are required" },
      { status: 400 },
    );
  }

  const col = await getCollection(CLASSES_COLLECTION);
  const upper = code.toUpperCase();
  const dupe = await col.findOne({ code: upper });
  if (dupe) {
    return NextResponse.json<ActionResult>(
      { ok: false, error: "A class with that code already exists" },
      { status: 400 },
    );
  }

  const instructorEmail =
    typeof body.instructorEmail === "string" && body.instructorEmail.trim()
      ? body.instructorEmail.trim()
      : session.user.email;
  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && instructorEmail !== session.user.email) {
    return NextResponse.json<ActionResult>(
      { ok: false, error: "You can only create classes for yourself" },
      { status: 403 },
    );
  }

  const doc = {
    name,
    code: upper,
    instructorEmail,
    studentEmails: [] as string[],
    createdAt: new Date(),
  };
  const res = await col.insertOne(doc);
  if (!res.acknowledged) {
    return NextResponse.json<ActionResult>(
      { ok: false, error: "Failed to create class" },
      { status: 500 },
    );
  }

  return NextResponse.json<
    ActionResult<{ class: ReturnType<typeof serializeClass> }>
  >(
    {
      ok: true,
      data: {
        class: serializeClass({
          _id: res.insertedId,
          ...doc,
        }),
      },
    },
    { status: 201 },
  );
}
