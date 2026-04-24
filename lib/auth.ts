// this code is taken straight from next auth docs with some logic from mongodb

import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import getCollection, { USERS_COLLECTION } from "@/db";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const users = await getCollection(USERS_COLLECTION);
      const adminEmails = (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);
      const defaultRole = adminEmails.includes(user.email ?? "")
        ? "admin"
        : "student";
      const image =
        typeof user.image === "string" && user.image.length > 0
          ? user.image
          : undefined;

      const existing = await users.findOne({ email: user.email });
      if (!existing) {
        await users.insertOne({
          name: user.name,
          email: user.email,
          role: defaultRole,
          image,
          createdAt: new Date(),
        });
      } else {
        await users.updateOne(
          { email: user.email },
          {
            $set: {
              name: user.name,
              image,
            },
          },
        );
      }
      return true;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session }) {
      const users = await getCollection(USERS_COLLECTION);
      const dbUser = await users.findOne({ email: session.user?.email });
      if (dbUser) {
        (session.user as { role?: string }).role = dbUser.role;
      }
      return session;
    },
  },
};