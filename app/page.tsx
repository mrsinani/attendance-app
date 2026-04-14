"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        {session.user?.image && (
          <img
            src={session.user.image}
            alt="Profile"
            className="w-16 h-16 rounded-full"
          />
        )}
        <p>Signed in as {session.user?.email}</p>
        <button
          onClick={() => signOut()}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <p>Not signed in</p>
      <button
        onClick={() => signIn("google")}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Sign in with Google
      </button>
    </div>
  );
}