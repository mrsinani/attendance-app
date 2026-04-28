import { NextResponse } from 'next/server'
import { ActionResult } from '@/lib/types'

/*
  File: attendance/route.ts
  Author: Jorge Lozano
  Purpose:This is the API endpoint that records a student's attendance.
   When a student scans the QR code, the frontend calls this file.
*/

export async function POST(req: Request) {
    const { qrToken, studentEmail } = await req.json()
    if (!qrToken || !studentEmail) {
        return NextResponse.json<ActionResult>({ ok: false, error: 'Missing fields' }, { status: 400 })
    }

    // mock: accept any token
    return NextResponse.json<ActionResult>({ ok: true }, { status: 201 })
}