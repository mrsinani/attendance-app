import { NextResponse } from "next/server";
import getCollection, { SESSIONS_COLLECTION } from "@/db";
import type { ActionResult, SessionDoc } from "@/lib/types";

export const dynamic = "force-dynamic";

function generateToken() {
  return "tok_" + Math.random().toString(36).slice(2, 10);
}

export async function POST(req: Request) {
  const { classId } = await req.json();
  if (!classId || typeof classId !== "string") {
    return NextResponse.json<ActionResult>(
      { ok: false, error: "classId is required" },
      { status: 400 },
    );
  }

  const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  const doc: Omit<SessionDoc, "_id"> = {
    classId,
    qrToken: generateToken(),
    tokenExpiresAt,
    status: "active",
    createdAt: new Date(),
  };

  const sessions = await getCollection(SESSIONS_COLLECTION);
  const res = await sessions.insertOne(doc);

  if (!res.acknowledged) {
    return NextResponse.json<ActionResult>(
      { ok: false, error: "Failed to create session" },
      { status: 500 },
    );
  }

  return NextResponse.json<
    ActionResult<{
      sessionId: string;
      qrToken: string;
      tokenExpiresAt: string;
    }>
  >(
    {
      ok: true,
      data: {
        sessionId: res.insertedId.toString(),
        qrToken: doc.qrToken,
        tokenExpiresAt: tokenExpiresAt.toISOString(),
      },
    },
    { status: 201 },
  );
}
