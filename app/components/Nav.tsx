/*
    Page: Nav bar
    Author: Toriana Mullins
    Purpose: navigation menu to use in student and instructor view
 */
"use client";

import Link from "next/link";
import styled from "styled-components";
import { useSession, signOut } from "next-auth/react";



const Navbar = styled.nav`
    width: 100%;
    background-color: #ededed;
    border-bottom: 1px solid #dddddd;
    padding: 1rem 2rem;
`;

const NavContainer = styled.div`
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
`;

const Brand = styled.div`
    font-size: 2rem;
    font-weight: 700;
    color: #111111;
`;
const NavLinks = styled.div`
    display: flex;
    gap: 1rem;
    align-items: center;
`;

const StyledLink = styled(Link)`
  text-decoration: none;
  color: #333333;
  font-weight: 500;

 
`;
const LogoutButton = styled.button`
    background: none;
    border: none;
    color: #333333;
    font-weight: 500;
    cursor: pointer;
`;


export default function Nav() {
    const {data:session, status} = useSession();
    if (status === "loading"){
        return null;
    }
    const role = (session?.user as { role?: string } | undefined)?.role;


    //links change on which role in logged in
    const links =
        role === "instructor" ?[
            {label: "Dashboard", href: "/instructor"},
            {label: "Search Students", href:"/instructor/search"},
            {label: "QR Attendance",href:"/instructor/attendance"},
        ]:[
            {label: "Dashboard", href: "/student"},
            {label: "Check In", href:"/student/check-in"},
            {label: "Attendance History", href:"/student/history"},
        ];
    return (
        <Navbar>
            <NavContainer>
                <Brand>Attendance App</Brand>

                <NavLinks>
                    {links.map((link)=>(
                        <StyledLink key={link.href} href={link.href}>
                            {link.label}
                        </StyledLink>
                    ))}
                    {session && (
                        <LogoutButton onClick={() => signOut({callbackUrl: "/"})}>
                            Log Out
                        </LogoutButton>
                    )}
                </NavLinks>
            </NavContainer>
        </Navbar>
    );
}

