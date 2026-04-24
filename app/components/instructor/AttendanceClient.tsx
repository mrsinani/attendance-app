'use client'
import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

type ClassOption = { _id: string; name: string; code: string }

export default function AttendanceClient({
                                             classes,
                                             instructorEmail
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
        try {
            const res = await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ classId: selectedClassId })
            })
            const json = await res.json()
            if (!json.ok) { setError(json.error); return }
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

    return (
        <main style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto' }}>
            <h1>Start Attendance Session</h1>

            <div style={{ marginTop: '1.5rem' }}>
                <label>Select a class</label>
                <select
                    value={selectedClassId}
                    onChange={e => setSelectedClassId(e.target.value)}
                    style={{ display: 'block', marginTop: '0.5rem', width: '100%', padding: '0.5rem' }}
                >
                    <option value=''>-- Pick a class --</option>
                    {classes.map(c => (
                        <option key={c._id} value={c._id}>{c.code} — {c.name}</option>
                    ))}
                </select>
            </div>

            <button
                onClick={startSession}
                disabled={!selectedClassId || loading}
                style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}
            >
                {loading ? 'Starting...' : 'Start Session'}
            </button>

            {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}

            {qrToken && (
                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <QRCodeSVG value={`${window.location.origin}/student/check-in?token=${qrToken}`} size={256} />
                    <p style={{ marginTop: '1rem', fontFamily: 'monospace' }}>{qrToken}</p>
                    <p style={{ color: secondsLeft < 60 ? 'red' : 'gray' }}>
                        Expires in {minutes}:{String(seconds).padStart(2, '0')}
                    </p>
                </div>
            )}
        </main>
    )
}