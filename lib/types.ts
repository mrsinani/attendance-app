// user document type
export type UserDoc = {
    email: string;
    _id?: string;
    name: string;
    role: "student" | "instructor" | "admin";
    classIds?: string[];
    createdAt?: Date;
}

export type ClassDoc = {
    _id?: string;
    name: string;
    code: string;
    instructorEmail: string;
    studentEmails: string[];
    createdAt: Date;
}

export type SessionDoc = {
    _id?: string;
    classId: string;
    qrToken: string;
    tokenExpiresAt: Date;
    status: "active" | "expired";
    createdAt: Date;

};

export type AttendanceDoc = {
    _id?: string;
    sessionId: string;
    classId: string;
    studentEmail: string;
    status: "present" | "absent" | "late";
    scannedAt: Date;
    notes?: string;
}

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };