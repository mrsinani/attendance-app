// danaid sinani
// Provides shared session checks for protected API routes.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";
import type { Session } from "next-auth";

/**
 * Instructors and admins can manage classes, rosters, exports, and overrides.
 */
export async function getInstructorOrAdminSession(): Promise<
  | { session: Session; errorResponse: null }
  | { session: null; errorResponse: NextResponse<ActionResult> }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return {
      session: null,
      errorResponse: NextResponse.json<ActionResult>(
        { ok: false, error: "Not signed in" },
        { status: 401 },
      ),
    };
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "instructor" && role !== "admin") {
    return {
      session: null,
      errorResponse: NextResponse.json<ActionResult>(
        { ok: false, error: "Forbidden" },
        { status: 403 },
      ),
    };
  }
  return { session, errorResponse: null };
}
