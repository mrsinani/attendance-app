/*
  File: proxy.ts
  Author: Toriana Mullins
  Purpose: Protects student and instructor routes so unauthenticated
  users cannot access them directly.
*/
import { withAuth } from "next-auth/middleware";
import type { NextRequest } from "next/server";

function isCheckInPath(req: NextRequest) {
    const p = req.nextUrl.pathname;
    return p === "/student/check-in" || p.startsWith("/student/check-in/");
}

export default withAuth({
    callbacks: {
        /** Allow /student/check-in without a session; page prompts for Google, then check-in runs. */
        authorized: ({ token, req }) => {
            if (isCheckInPath(req as NextRequest)) {
                return true;
            }
            return !!token;
        },
    },
    pages: {
        signIn: "/",
    },
});

export const config = {
    matcher: ["/student/:path*", "/instructor/:path*"],
};