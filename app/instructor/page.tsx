/*
  Page: Instructor Dashboard
  Author: Toriana Mullins
  Purpose: Provides the instructor-facing dashboard structure and displays
  the shared navigation bar.
*/

import Nav from "../components/Nav";

export default function InstructorPage() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/");
    }

    return (
        <>
            <Nav role="instructor" />
            <main style={{ padding: "2rem" }}>
                <h1>Instructor Dashboard</h1>
                <p>Welcome to the instructor view of the attendance app.</p>
            </main>
        </>
    );
}