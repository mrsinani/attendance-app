'use client'
import { useCallback, useEffect, useRef, useState, startTransition } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function CheckInClient() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [uiStatus, setUiStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')
    const scannerRef = useRef<Html5Qrcode | null>(null)
    const autoCheckInDone = useRef(false)

    const submitCheckIn = useCallback(async (qrToken: string) => {
        setUiStatus('scanning')
        setMessage('Checking in…')
        try {
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ qrToken }),
            })
            const json = await res.json()
            if (json.ok) {
                setUiStatus('success')
                setMessage('You are checked in!')
            } else {
                setUiStatus('error')
                setMessage(json.error || 'Check-in failed')
            }
        } catch {
            setUiStatus('error')
            setMessage('Something went wrong')
        }
    }, [])

    useEffect(() => {
        return () => { scannerRef.current?.stop().catch(() => { }) }
    }, [])

    /** Instructors use the other dashboard; students + admins can check in. */
    useEffect(() => {
        if (status !== 'authenticated' || !session) return
        const role = (session.user as { role?: string })?.role
        if (role === 'instructor') {
            router.replace('/instructor')
        }
    }, [status, session, router])

    /**
     * After Google sign-in, if the URL still has ?token= from the QR, check in once.
     */
    useEffect(() => {
        if (status !== 'authenticated' || !session) return
        const role = (session.user as { role?: string })?.role
        if (role === 'instructor') return

        const params = new URLSearchParams(window.location.search)
        const t = params.get('token')
        if (t && !autoCheckInDone.current) {
            autoCheckInDone.current = true
            startTransition(() => {
                void submitCheckIn(t)
            })
        }
    }, [status, session, submitCheckIn])

    async function startScanning() {
        setMessage('')
        setUiStatus('scanning')
        const scanner = new Html5Qrcode('qr-reader')
        scannerRef.current = scanner

        await scanner.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: 250 },
            async (decodedText) => {
                await scanner.stop()
                const url = new URL(decodedText)
                const token = url.searchParams.get('token')
                if (!token) { setUiStatus('error'); setMessage('Invalid QR code'); return }
                await submitCheckIn(token)
            },
            () => { }
        )
    }

    if (status === 'loading') {
        return (
            <main style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto', textAlign: 'center', color: '#111827' }}>
                <h1>Check In</h1>
                <p style={{ marginTop: '1rem', color: '#4b5563' }}>Loading…</p>
            </main>
        )
    }

    if (status === 'unauthenticated') {
        const callback = typeof window !== 'undefined' ? window.location.href : '/student/check-in'
        return (
            <main style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto', textAlign: 'center', color: '#111827' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Check in</h1>
                <p style={{ marginTop: '1.25rem', lineHeight: 1.5, color: '#374151' }}>
                    Sign in with Google to record your attendance for this session. If you came from a QR
                    code, you will be checked in automatically after you sign in.
                </p>
                <button
                    type="button"
                    onClick={() => void signIn('google', { callbackUrl: callback })}
                    style={{
                        marginTop: '1.5rem',
                        padding: '0.75rem 1.5rem',
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    Sign in with Google
                </button>
            </main>
        )
    }

    if (!session) {
        return null
    }

    if ((session.user as { role?: string })?.role === 'instructor') {
        return (
            <main style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto', textAlign: 'center', color: '#4b5563' }}>
                <p>Redirecting to instructor view…</p>
            </main>
        )
    }

    return (
        <main style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto', textAlign: 'center', color: '#111827' }}>
            <h1>Check In</h1>
            {session.user?.name && (
                <p style={{ fontSize: '0.9rem', color: '#4b5563', marginTop: '0.5rem' }}>{session.user.name}</p>
            )}

            {uiStatus === 'idle' && (
                <button
                    type="button"
                    onClick={startScanning}
                    style={{ marginTop: '1.5rem', padding: '0.75rem 2rem' }}
                >
                    Scan QR Code
                </button>
            )}

            {uiStatus === 'scanning' && message && (
                <p style={{ color: '#4b5563', marginTop: '1.25rem' }}>{message}</p>
            )}

            <div id='qr-reader' style={{ marginTop: '1.5rem', width: '100%' }} />

            {uiStatus === 'success' && (
                <p style={{ color: 'green', fontSize: '1.25rem', marginTop: '1rem' }}>{message}</p>
            )}

            {uiStatus === 'error' && (
                <div>
                    <p style={{ color: 'red', marginTop: '1rem' }}>{message}</p>
                    <button
                        type="button"
                        onClick={() => { setUiStatus('idle'); setMessage('') }}
                        style={{ marginTop: '1rem' }}
                    >
                        Try Again
                    </button>
                </div>
            )}
        </main>
    )
}
