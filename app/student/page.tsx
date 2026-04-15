/*
  Page: Student Dashboard
  Author: Toriana Mullins
  Purpose: Provides the basic structure for the student-facing view.
*/
import Nav from "../components/Nav";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {redirect} from "next/navigation";

export default async function StudentPage() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/");

    }
    const role = (session.user as {role?: string}| undefined)?.role;

    if (role !== "student") {
        redirect("/instructor");
    }
    return (
        <>
            <Nav/>
            <main style={{ padding: "2rem" }}>
                <h1>Student Dashboard</h1>
                <p>Welcome to the Student view</p>
            </main>
        </>
    );
}