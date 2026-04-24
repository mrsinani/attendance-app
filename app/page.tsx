"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

function RoleNavLinks() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
      <Link
        href="/instructor"
        className="rounded-lg bg-blue-600 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Continue as Instructor
      </Link>
      <Link
        href="/student"
        className="rounded-lg bg-gray-800 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
      >
        Continue as Student
      </Link>
    </div>
  );
}

/**
 * `callbackUrl` is set by next-auth middleware when a signed-out user
 * hits a protected route (e.g. /student/check-in?token=...). After Google
 * sign-in, the user is sent back there and check-in can run automatically.
 */
function HomeContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  const { callbackUrl, isCheckInFlow } = useMemo(() => {
    const raw = searchParams.get("callbackUrl");
    if (!raw) {
      return { callbackUrl: "/", isCheckInFlow: false };
    }
    if (raw.startsWith("/")) {
      return { callbackUrl: raw, isCheckInFlow: raw.includes("/check-in") };
    }
    try {
      const u = new URL(raw);
      const path = u.pathname + u.search;
      return {
        callbackUrl: path || "/",
        isCheckInFlow: path.includes("/check-in"),
      };
    } catch {
      return { callbackUrl: "/", isCheckInFlow: false };
    }
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <p className="text-base font-medium text-gray-900">Loading...</p>
      </div>
    );
  }

  if (session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-12">
        <h1 className="text-center text-2xl font-bold text-gray-900">
          Welcome to Attendance App
        </h1>
        {session.user?.image && (
          <img
            src={session.user.image}
            alt="Profile"
            className="h-16 w-16 rounded-full"
          />
        )}
        <p className="text-center text-base text-gray-800">
          Signed in as {session.user?.email}
        </p>
        <RoleNavLinks />
        <button
          type="button"
          onClick={() => signOut()}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-12">
      <h1 className="text-center text-2xl font-bold text-gray-900">
        Welcome to Attendance App
      </h1>

      {isCheckInFlow ? (
        <>
          <p className="max-w-md text-center text-base text-gray-700">
            You opened a check-in link. Sign in with Google to record your
            attendance — you will be sent back and checked in automatically.
          </p>
          <button
            type="button"
            onClick={() => void signIn("google", { callbackUrl })}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Sign in with Google to check in
          </button>
        </>
      ) : (
        <>
          <p className="text-center text-base text-gray-700">Not signed in</p>
          <button
            type="button"
            onClick={() => void signIn("google", { callbackUrl: "/" })}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Sign in with Google
          </button>
          <RoleNavLinks />
        </>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
          <p className="text-base font-medium text-gray-900">Loading...</p>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
