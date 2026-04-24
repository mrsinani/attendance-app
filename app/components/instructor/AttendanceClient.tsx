'use client'
import { useState, useEffect, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'

type ClassOption = { _id: string; name: string; code: string }

type AttendeeRow = {
    email: string
    name: string
    firstName: string
    lastName: string
    image: string | null
    scannedAt: string
}

export default function AttendanceClient({
    classes,
    instructorEmail,
}: {
    classes: ClassOption[]
    instructorEmail: string
}) {
    const [selectedClassId, setSelectedClassId] = useState('')
    const [qrToken, setQrToken] = useState('')
    const [expiresAt, setExpiresAt] = useState<Date | null>(null)
    const [sessionId, setSessionId] = useState('')
    const [secondsLeft, setSecondsLeft] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [attendees, setAttendees] = useState<AttendeeRow[]>([])
    const [origin, setOrigin] = useState('')

    useEffect(() => {
        setOrigin(window.location.origin)
    }, [])

    const fetchAttendees = useCallback(async () => {
        if (!sessionId) return
        try {
            const res = await fetch(
                `/api/attendance?sessionId=${encodeURIComponent(sessionId)}`,
                { credentials: 'same-origin' },
            )
            const json = await res.json()
            if (json.ok && json.data?.attendees) {
                setAttendees(json.data.attendees)
            }
        } catch {
            // ignore transient errors while polling
        }
    }, [sessionId])

    useEffect(() => {
        if (!sessionId) return
        void fetchAttendees()
        const id = setInterval(() => void fetchAttendees(), 2000)
        return () => clearInterval(id)
    }, [sessionId, fetchAttendees])

    useEffect(() => {
        if (!expiresAt) return
        const interval = setInterval(() => {
            const diff = Math.floor((expiresAt.getTime() - Date.now()) / 1000)
            if (diff <= 0) {
                clearInterval(interval)
                setQrToken('')
                setExpiresAt(null)
            } else {
                setSecondsLeft(diff)
            }
        }, 1000)
        return () => clearInterval(interval)
    }, [expiresAt])

    async function startSession() {
        if (!selectedClassId) return
        setLoading(true)
        setError('')
        setAttendees([])
        try {
            const res = await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ classId: selectedClassId }),
            })
            const json = await res.json()
            if (!json.ok) {
                setError(json.error ?? 'Failed to start session')
                return
            }
            setQrToken(json.data.qrToken)
            setSessionId(json.data.sessionId)
            setExpiresAt(new Date(json.data.tokenExpiresAt))
            setSecondsLeft(15 * 60)
        } catch {
            setError('Failed to start session')
        } finally {
            setLoading(false)
        }
    }

    const minutes = Math.floor(secondsLeft / 60)
    const seconds = secondsLeft % 60

    function formatTime(iso: string) {
        try {
            const d = new Date(iso)
            return d.toLocaleString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
            })
        } catch {
            return iso
        }
    }

    return (
        <main
            style={{
                padding: '2rem',
                maxWidth: '560px',
                margin: '0 auto',
                color: '#111827',
            }}
        >
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Start Attendance Session</h1>
            {instructorEmail && (
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Signed in as {instructorEmail}
                </p>
            )}

            <div style={{ marginTop: '1.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Select a class</label>
                <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    style={{
                        display: 'block',
                        marginTop: '0.5rem',
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                    }}
                >
                    <option value="">-- Pick a class --</option>
                    {classes.map((c) => (
                        <option key={c._id} value={c._id}>
                            {c.code} — {c.name}
                        </option>
                    ))}
                </select>
            </div>

            <button
                type="button"
                onClick={startSession}
                disabled={!selectedClassId || loading}
                style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1.5rem',
                    background: !selectedClassId || loading ? '#9ca3af' : '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: !selectedClassId || loading ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                }}
            >
                {loading ? 'Starting...' : 'Start Session'}
            </button>

            {error && <p style={{ color: '#dc2626', marginTop: '1rem' }}>{error}</p>}

            {qrToken && origin && (
                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <QRCodeSVG
                        value={`${origin}/student/check-in?token=${encodeURIComponent(qrToken)}`}
                        size={256}
                    />
                    <p style={{ marginTop: '1rem', fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                        {qrToken}
                    </p>
                    <p style={{ color: secondsLeft < 60 ? '#dc2626' : '#6b7280', marginTop: '0.5rem' }}>
                        Expires in {minutes}:{String(seconds).padStart(2, '0')}
                    </p>
                </div>
            )}

            {sessionId && (
                <section
                    style={{
                        marginTop: '2.5rem',
                        paddingTop: '1.5rem',
                        borderTop: '1px solid #e5e7eb',
                    }}
                >
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                        Checked in ({attendees.length})
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                        Students who scan the QR and sign in with Google appear here, newest updates every few
                        seconds.
                    </p>
                    {attendees.length === 0 ? (
                        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No one has checked in yet.</p>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {attendees.map((a) => (
                                <li
                                    key={a.email + a.scannedAt}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '10px 12px',
                                        marginBottom: '8px',
                                        background: '#f9fafb',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                    }}
                                >
                                    <Avatar name={a.name} imageUrl={a.image} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, color: '#111827' }}>
                                            {a.firstName} <span style={{ fontWeight: 500 }}>{a.lastName}</span>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{a.email}</div>
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '0.75rem',
                                            color: '#4b5563',
                                            textAlign: 'right',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {formatTime(a.scannedAt)}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}
        </main>
    )
}

function Avatar({ name, imageUrl }: { name: string; imageUrl: string | null }) {
    const [failed, setFailed] = useState(false)
    const initials = name
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()

    if (imageUrl && !failed) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={imageUrl}
                alt=""
                width={44}
                height={44}
                style={{
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                    border: '1px solid #e5e7eb',
                }}
                onError={() => setFailed(true)}
            />
        )
    }

    return (
        <div
            style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#e0e7ff',
                color: '#3730a3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                flexShrink: 0,
            }}
        >
            {initials || '?'}
        </div>
    )
}
