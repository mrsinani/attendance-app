/*
  Page: Student Dashboard
  Author: Toriana Mullins
  Purpose: Provides the basic structure for the student-facing view.
*/
import Nav from "../components/Nav";

export default function StudentPage() {
    return (
        <>
            <Nav role="student" />
            <main style={{ padding: "2rem" }}>
                <h1>Student Dashboard</h1>
                <p>Welcome to the Student view</p>
            </main>
        </>
    );
}