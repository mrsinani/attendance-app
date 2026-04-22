import { NextResponse } from 'next/server'

function generateToken() {
    return 'tok_' + Math.random().toString(36).slice(2, 10)
}

export async function POST(req: Request) {
    const { classId } = await req.json()

    return NextResponse.json({
        sessionId: 'mock_session_001',
        classId,
        qrToken: generateToken(),
        tokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        status: 'active'
    }, { status: 201 })
}