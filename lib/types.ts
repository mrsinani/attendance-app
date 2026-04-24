// Shape of a user document in the `users` collection.
// Created on first sign-in in lib/auth.ts.
export type UserDoc = {
    _id?: string;
    name: string;
    email: string;
    role: "student" | "instructor" | "admin";
    classIds?: string[]; // classes this user is enrolled in (students) or teaches (instructors)
    createdAt: Date;
};

// Shape of a class document in the `classes` collection.
// One row per class (e.g., CS391 Fall 2026).
export type ClassDoc = {
    _id?: string;
    name: string;             // e.g. "Web Application Development"
    code: string;             // e.g. "CS391" — unique, used for dedupe
    instructorEmail: string;  // owner
    studentEmails: string[];  // enrolled students (kept in sync with UserDoc.classIds)
    createdAt: Date;
};

// Shape of a session document in the `sessions` collection.
// One row per attendance session (a lecture that's currently taking attendance).
// Renamed from Session -> SessionDoc for consistency with the other ~Doc types.
export type SessionDoc = {
    _id?: string;
    classId: string;
    qrToken: string;
    tokenExpiresAt: Date;
    status: "active" | "closed";
    createdAt: Date;
};

// Shape of an attendance document in the `attendance` collection.
// One row per student per session.
export type AttendanceDoc = {
    _id?: string;
    sessionId: string;
    classId: string;          // denormalized for fast stats queries without a join
    studentEmail: string;     // using email as the stable key (matches auth.ts)
    status: "present" | "late" | "absent";
    scannedAt: Date;
    notes?: string;
};

// Discriminated-union return type for server actions (mp5 pattern).
// Every write action returns one of these so the client can render success/error.
export type ActionResult<T = undefined> =
    | { ok: true; data?: T }
    | { ok: false; error: string };