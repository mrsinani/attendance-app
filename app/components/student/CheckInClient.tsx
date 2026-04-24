'use client'
import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export default function CheckInClient({ studentEmail }: { studentEmail: string }) {
    const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')
    const scannerRef = useRef<Html5Qrcode | null>(null)

    useEffect(() => {
        return () => { scannerRef.current?.stop().catch(() => {}) }
    }, [])

    async function startScanning() {
        setStatus('scanning')
        const scanner = new Html5Qrcode('qr-reader')
        scannerRef.current = scanner

        await scanner.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: 250 },
            async (decodedText) => {
                await scanner.stop()
                const url = new URL(decodedText)
                const token = url.searchParams.get('token')
                if (!token) { setStatus('error'); setMessage('Invalid QR code'); return }
                await submitCheckIn(token)
            },
            () => {}
        )
    }

    async function submitCheckIn(qrToken: string) {
        try {
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qrToken, studentEmail })
            })
            const json = await res.json()
            if (json.ok) {
                setStatus('success')
                setMessage('You are checked in!')
            } else {
                setStatus('error')
                setMessage(json.error)
            }
        } catch {
            setStatus('error')
            setMessage('Something went wrong')
        }
    }

    return (
        <main style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
            <h1>Check In</h1>

            {status === 'idle' && (
                <button onClick={startScanning} style={{ marginTop: '1.5rem', padding: '0.75rem 2rem' }}>
                    Scan QR Code
                </button>
            )}

            <div id='qr-reader' style={{ marginTop: '1.5rem', width: '100%' }} />

            {status === 'success' && (
                <p style={{ color: 'green', fontSize: '1.25rem', marginTop: '1rem' }}>{message}</p>
            )}

            {status === 'error' && (
                <div>
                    <p style={{ color: 'red', marginTop: '1rem' }}>{message}</p>
                    <button onClick={() => setStatus('idle')} style={{ marginTop: '1rem' }}>Try Again</button>
                </div>
            )}
        </main>
    )
}