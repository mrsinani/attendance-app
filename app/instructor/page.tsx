/*
  Page: Instructor Dashboard
  Author: Toriana Mullins
  Purpose: Provides the instructor-facing dashboard structure and displays
  the shared navigation bar.
*/

import Nav from "../components/Nav";
import InstructorDashboardClient from "../components/instructor/InstructorDashboardClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function InstructorPage() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/");

    }
    const role = (session.user as {role?: string}| undefined)?.role;

    if (role !== "instructor" && role !== "admin") {
        redirect("/student");
    }

    return (
        <>
            <Nav/>
            <InstructorDashboardClient />
        </>
    );
}