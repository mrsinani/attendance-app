/**
 * Page: Attendance History
 * Author: Jackson Pine
 * Purpose: Provides the student attendance history as a table.
 */
"use client"

import { useEffect, useState } from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import { AttendanceRecord } from "../../components/student/AttendanceTable";
import AttendanceTable from "../../components/student/AttendanceTable";

const Page = styled.div`
    padding: 24px;
    font-family: Arial, sans-serif;
    color: black;
`;

const Header = styled.h1`
    font-size: 20px;
    font-weight: 600;
    margin: 12px 0 20px 0;
`;

const P = styled.p`
    color: white;
`;

const BackButton = styled.button`
    background: white;
    color: black;
    border: 1px solid black;
    padding: 6px 10px;
    cursor: pointer;
    font-size: 14px;
    &:hover {
        background: black;
        color: white;
    }
`;

export default function AttendanceHistoryPage() {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
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
                status: "late",
                notes: "5 minutes late. excused",
            },
            {
                _id: "3",
                date: "2026-04-22",
                sessionName: "Lecture 3",
                status: "absent",
            },
            {
                _id: "4",
                date: "2026-04-20",
                sessionName: "Lecture 1",
                status: "present",
                notes: "on time",
            },
            {
                _id: "5",
                date: "2026-04-21",
                sessionName: "Lecture 2",
                status: "late",
                notes: "5 minutes late. excused",
            },
            {
                _id: "6",
                date: "2026-04-22",
                sessionName: "Lecture 3",
                status: "present",
            },
            {
                _id: "7",
                date: "2026-04-20",
                sessionName: "Lecture 1",
                status: "present",
                notes: "on time",
            },
            {
                _id: "8",
                date: "2026-04-21",
                sessionName: "Lecture 2",
                status: "late",
                notes: "5 minutes late. excused",
            },
            {
                _id: "9",
                date: "2026-04-22",
                sessionName: "Lecture 3",
                status: "present",
            },
            {
                _id: "10",
                date: "2026-04-20",
                sessionName: "Lecture 1",
                status: "present",
                notes: "on time",
            },
            {
                _id: "11",
                date: "2026-04-21",
                sessionName: "Lecture 2",
                status: "late",
                notes: "5 minutes late. excused",
            },
            {
                _id: "12",
                date: "2026-04-22",
                sessionName: "Lecture 3",
                status: "absent",
            },
        ];
        setRecords(dummyData);
        setLoading(false);
        // async function fetchData() {
            
        //     try {
        //         const res = await fetch("/api/attendence/history");
        //         const data = await res.json();
        //         setRecords(data);
        //     } catch (err) {
        //         console.log(err);
        //     } finally {
        //         setLoading(false);
        //     }
        // }
        // fetchData();
    }, []);

    const attendanceCount = records.filter((r) => r.status === "present"
        || (r.notes?.toLowerCase().includes("excused") ?? false)).length
        
    return (
        <Page>
            {loading ? (
                <Page>loading... </Page>
            ) : (
            <>
                <BackButton onClick={() => router.back()}>
                ← Back
                </BackButton>
                <Header>Attendance History</Header>
                {!loading && records.length === 0 && (
                    <p>No Avalible Records</p>
                )}
                <P>You have attended {attendanceCount} / {records.length} or {((attendanceCount / records.length) * 100).toPrecision(3) }% of Lectures</P>
                <P>Remaining Allowed Absences: {"?"}</P>
                <AttendanceTable records={records}></AttendanceTable>
            </>
            )}
        </Page>
        
    );
}