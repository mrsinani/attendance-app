/*
  File: proxy.ts
  Author: Toriana Mullins
  Purpose: Protects student and instructor routes so unauthenticated
  users cannot access them directly.
*/
import { withAuth } from "next-auth/middleware";

export default withAuth({
    callbacks: {
        authorized: ({ token }) => !!token,
    },
});

export const config = {
    matcher: ["/student/:path*", "/instructor/:path*"],
};