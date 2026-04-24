import { NextResponse } from 'next/server'
import { ActionResult } from '@/lib/types'

export async function POST(req: Request) {
    const { qrToken, studentEmail } = await req.json()
    if (!qrToken || !studentEmail) {
        return NextResponse.json<ActionResult>({ ok: false, error: 'Missing fields' }, { status: 400 })
    }

    // mock: accept any token
    return NextResponse.json<ActionResult>({ ok: true }, { status: 201 })
}