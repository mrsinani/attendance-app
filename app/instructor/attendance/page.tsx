import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Nav from '../../components/Nav'
import AttendanceClient from '../../components/instructor/AttendanceClient'

const MOCK_CLASSES = [
    { _id: 'class_001', name: 'Web Application Development', code: 'CS391' },
    { _id: 'class_002', name: 'Algorithms', code: 'CS301' },
]

export default async function InstructorAttendancePage() {
    const session = await getServerSession(authOptions)
    if (!session) redirect('/')

    const role = (session.user as { role?: string })?.role
    if (role !== 'instructor' && role !== 'admin') redirect('/student')

    return (
        <>
            <Nav />
            <AttendanceClient classes={MOCK_CLASSES} instructorEmail={session.user?.email ?? ''} />
        </>
    )
}