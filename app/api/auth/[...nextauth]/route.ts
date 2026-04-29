// danaid sinani
// Exposes NextAuth handlers for GET and POST auth requests.
import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };