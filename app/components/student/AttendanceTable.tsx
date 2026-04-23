"use client"
import styled from "styled-components";

export interface AttendanceRecord {
    _id: string;
    date: string;
    sessionName: string;
    status: "present" | "absent" | "late";
    notes?: string // could be used for "late" status with an "excused" note
}

const Table = styled.table`
    background: white;
    width: 100%;
    border-collapse: collapse;
    margin-top: 16px;
`;

const Th = styled.th`
    text-align: left;
    border-bottom: 1px solid black;
    padding: 8px;
    font-size: 13px;
`;

const Td = styled.td`
    border-bottom: 1px solid #ddd;
    padding: 8px;
    font-size: 14px;
`;

interface Props {
    records: AttendanceRecord[];
}

export default function AttendanceTable( {records}: Props ) {
    return (
        <Table>
            <thead>
                <tr>
                    <Th>Date</Th>
                    <Th>Session</Th>
                    <Th>Status</Th>
                    <Th>Notes</Th>
                </tr>
            </thead>
            <tbody>
                {records.map((r) => (
                    <tr key={r._id}>
                        <Td>{r.date}</Td>
                        <Td>{r.sessionName}</Td>
                        <Td>{r.status.toUpperCase()}</Td>
                        <Td>{r.notes || "-"}</Td>
                    </tr>
                ))}
            </tbody>
        </Table>
    )
}