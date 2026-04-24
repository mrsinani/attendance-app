import Nav from '../../components/Nav'
import CheckInClient from '../../components/student/CheckInClient'

/** Session and role are handled in CheckInClient so unsigned users can open a QR link and sign in first. */
export default function CheckInPage() {
    return (
        <>
            <Nav />
            <CheckInClient />
        </>
    )
}