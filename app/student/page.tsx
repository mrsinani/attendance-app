/*
  Page: Student Dashboard
  Author: Toriana Mullins, Jackson Pine
  Purpose: Provides the basic structure for the student-facing view.
*/
import Nav from "../components/Nav";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {redirect} from "next/navigation";
import styled from "styled-components";
import { AttendanceRecord } from "../components/student/AttendanceTable";
import AttendanceTable from "../components/student/AttendanceTable";
import SkipWidget from "../components/student/SkipWidget";

const Page = styled.main`
    padding: 2rem;
    color: #000000;
    font-family: Arial, sans-serif;
`;

const Title = styled.h1`
    color: #111827;
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 0.25rem;
`;

const Subtitle = styled.p`
    color: #374151;
    margin-bottom: 2rem;
`;

const Layout = styled.div`
    background: #ffffff;
    display: flex;
    gap: 2rem;
`;

const Left = styled.div`
    flex: 2;
    border: 1px solid #e5e7eb;
    padding: 1rem;
`;

const Right = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const Box = styled.div`
    border: 1px solid #cfcfcfff;
    padding: 1rem;
    min-height: 150px;
`;

async function getAttendance() {
    // -- dummy data for now --
    // const res = await fetch("/api/attendence/history", {
    //     cache: "no-store",
    // });
    //if (!res.ok) return [];
    //return res.json();
    const dummyData: AttendanceRecord[] = [
        {
            _id: "1",
            date: "2026-04-20",
            sessionName: "Lecture 1",
            status: "present",
            notes: "on time",
        },
        {
            _id: "2",
            date: "2026-04-21",
            sessionName: "Lecture 2",
            status: "present",
        },
        {
            _id: "3",
            date: "2026-04-22",
            sessionName: "Lecture 3",
            status: "present",
        },
        {
            _id: "4",
            date: "2026-04-20",
            sessionName: "Lecture 4",
            status: "present",
            notes: "on time",
        },
        {
            _id: "5",
            date: "2026-04-21",
            sessionName: "Lecture 5",
            status: "late",
            notes: "5 minutes late. excused",
        },
        {
            _id: "6",
            date: "2026-04-22",
            sessionName: "Lecture 6",
            status: "absent",
        },
    ];
    return dummyData;
}


export default async function StudentPage() {
    
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/");

    }
    const role = (session.user as {role?: string}| undefined)?.role;

    if (role !== "student") {
        redirect("/instructor");
    }
    const records = await getAttendance();
    return (
        <>
            <Nav/>
            <Page>
                <Title>Student Dashboard</Title>
                <Subtitle>Welcome to the Student view</Subtitle>
                <Layout>
                    <Left>
                        <AttendanceTable records={records.reverse().slice(0, 5)}></AttendanceTable>
                    </Left>
                    <Right>
                        <Box>
                            <SkipWidget records={records}></SkipWidget>
                        </Box>
                        
                    </Right>
                </Layout>
            </Page>
        </>
    );
}