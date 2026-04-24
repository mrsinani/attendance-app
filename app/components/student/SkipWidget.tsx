"use client";
import styled, { keyframes } from "styled-components";
import { AttendanceRecord } from "../student/AttendanceTable";

const Container = styled.div`
  background: #ffffff;
 
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
`;

const Title = styled.h2`
  font-size: 1rem;
  margin: 0;
  align-self: flex-start;
`;

const ArcWrapper = styled.div`
  position: relative;
  width: 140px;
  height: 140px;
`;

const CenterText = styled.div`
  font-size: 0.75rem;
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatusRow = styled.div`
  display: flex;
  gap: 1.5rem;
  width: 100%;
`;

const Stat = styled.div`
  display: flex;
  flex-direction: row;
  gap: 5px;
`;

const StatValue = styled.span`
  font-size: 1rem;
`;

const StatusBar = styled.div`
  font-size: 0.75rem;
  margin-top: auto;
  align-self: flex-start;
  font-size: 1rem;
  padding: 4px;
`;


// helper function that does some circle math. circle is drawn from the top and moves clockwise
// returns d value for an SVG arc (fraction of a circle) 
function arcPath(fraction: number, r: number, cx: number, cy: number): string {
    if (fraction >= 1) fraction = 0.9999; // aparently prevents fullcircle degenerate case
    const angle = fraction * 2 * Math.PI;
    const startX = cx;
    const startY = cy - r;
    const endX = cx + r * Math.sin(angle);
    const endY = cy - r * Math.cos(angle);
    const largeArc = fraction > 0.5 ? 1 : 0;
    // formatted for SVG component
    return `M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`;
}

interface Props {
    records: AttendanceRecord[];
}
export default function SkipWidget({ records }: Props ) {
    const totalClasses = records.length;
    const absences = totalClasses - records.filter((r) => r.status === "present"
        || (r.notes?.toLowerCase().includes("excused") ?? false)).length;
    const maxAbsences = Math.floor(totalClasses * 0.15);  // Assumes 85% attendance threshhold for now
    const skipsLeft = Math.max(0, maxAbsences - absences);
    const attended = totalClasses - absences;
    const fraction = totalClasses > 0 ? Math.min(1, skipsLeft / Math.max(1, maxAbsences)) : 0; // fraction of remaining "skip budget" 

    const level: "safe" | "warning" | "danger" = skipsLeft === 0 ? "danger" : skipsLeft <= 2 ? "warning" : "safe";
       
    const statusText =
        level === "safe" ? "On track"
            : level === "warning" ? "Close to limit"
                : "Limit reached";

    const arcColor =
        level === "safe" ? "#00ffaaff" : level === "warning" ? "#ffa200ff" : "#ff0000ff";

    const cx = 70;
    const cy = 70;
    const r = 60;
    const strokeW = 8;

    return (
        <Container>
            <Title>Absences remaining</Title>
            <ArcWrapper>
                <svg width="140" height="140" viewBox="0 0 140 140">
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="#c7c7c7ff" strokeWidth={strokeW} />
                    {fraction > 0 && (
                        <path d={arcPath(fraction, r, cx, cy)} fill="none" stroke={arcColor} strokeWidth={strokeW} strokeLinecap="round" />      
                    )}
                </svg>
                <CenterText>
                    {skipsLeft} of {maxAbsences} allowed
                </CenterText>
            </ArcWrapper>
            <StatusRow>
                <Stat>
                    <StatValue>{attended} Attended</StatValue>
                </Stat>
                <Stat>
                    <StatValue>{absences} Missed</StatValue>
                </Stat>
                <Stat>
                    <StatValue>
                        {totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 0}% Rate
                    </StatValue>
                </Stat>
            </StatusRow>
            <StatusBar>{statusText}</StatusBar>
        </Container>
    );
}
