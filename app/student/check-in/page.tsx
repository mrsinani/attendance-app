import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Nav from '../../components/Nav'
import CheckInClient from '../../components/student/CheckInClient'

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