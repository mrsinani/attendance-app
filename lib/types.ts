export interface Session {
    _id?: string
    classId: string
    qrToken: string
    tokenExpiresAt: Date
    status: 'active' | 'closed'
    createdAt: Date
}

export interface Attendance {
    sessionId: string
    studentId: string
    scannedAt: Date
}