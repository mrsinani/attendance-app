import { NextResponse } from 'next/server'
import { ActionResult, SessionDoc } from '@/lib/types'

function generateToken() {
    return 'tok_' + Math.random().toString(36).slice(2, 10)
}

export async function POST(req: Request) {
    const { classId } = await req.json()
    if (!classId) {
        return NextResponse.json<ActionResult>({ ok: false, error: 'classId is required' }, { status: 400 })
    }

    return NextResponse.json<ActionResult<{ sessionId: string; qrToken: string; tokenExpiresAt: Date }>>({
        ok: true,
        data: {
            sessionId: 'mock_session_001',
            qrToken: generateToken(),
            tokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000)
        }
    }, { status: 201 })
}