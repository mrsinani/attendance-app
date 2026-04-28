import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Nav from '../../components/Nav'
import CheckInClient from '../../components/student/CheckInClient'

/*
  File: check-in/page.tsx
  Author: Jorge Lozano
  Purpose: Server-side page for the student check-in flow.
  Handles auth and role check, then passes student email
  to the client component for QR scanning.
*/

export default async function CheckInPage() {
    const session = await getServerSession(authOptions)
    if (!session) redirect('/')

    const role = (session.user as { role?: string })?.role
    if (role !== 'student') redirect('/instructor')

    return (
        <>
            <Nav />
            <CheckInClient studentEmail={session.user?.email ?? ''} />
        </>
    )
}